"""AI artwork for a material's infographic: one hero illustration plus one icon per pillar.

The AI draws pictures only. Image models misspell words, so every prompt forbids text and every picture is read
back (OCR); a picture that still contains lettering is redrawn once and otherwise reported to the teacher. All
titles and labels are placed by the app from the validated infographic, so their spelling is always exact.
"""
import logging
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)
STYLE = ("Clean flat vector illustration for an Indonesian school learning app, white background, soft blue, teal, "
         "amber and purple palette, friendly and clear, simple shapes.")
NO_TEXT = ("Absolutely no text: no letters, words, numbers, captions, labels, signs, logos or watermark anywhere "
           "in the picture.")


def hero_prompt(info: dict) -> str:
    # Words like "infographic" or quoting sentences make image models add labels, so the idea is described
    # for the artist to depict, never as text to reproduce.
    return (f"{STYLE} A wide editorial illustration, like a picture-book scene, that depicts (does not write) "
            f"the idea of the school topic \"{info['title']}\". Idea to depict with objects, people and symbols: "
            f"{info['big_idea']['text']} Pure picture: no charts with labels, no screens or papers showing writing, "
            f"no speech bubbles with words. {NO_TEXT}")


def icon_prompt(info: dict, pillar: dict) -> str:
    return (f"{STYLE} One single centered icon on a plain white background that represents \"{pillar['name']}\" "
            f"in the topic \"{info['title']}\" ({pillar['desc']}). The icon is large and fills about 85% of the "
            f"canvas. Bold simple shapes, no border, no frame. {NO_TEXT}")


def trim_whitespace(image: bytes, pad: float = 0.08) -> bytes:
    """Crops the empty white margin around an icon so it fills its card (skipped if Pillow is unavailable)."""
    try:
        import io
        from PIL import Image, ImageChops
    except ImportError:
        return image
    try:
        picture = Image.open(io.BytesIO(image)).convert("RGB")
        box = ImageChops.difference(picture, Image.new("RGB", picture.size, (255, 255, 255))) \
            .convert("L").point(lambda value: 255 if value > 12 else 0).getbbox()
        if not box:
            return image
        left, top, right, bottom = box
        width, height = right - left, bottom - top
        side = round(max(width, height) * (1 + 2 * pad))
        square = Image.new("RGB", (side, side), (255, 255, 255))
        square.paste(picture.crop(box), ((side - width) // 2, (side - height) // 2))
        out = io.BytesIO()
        square.save(out, format="PNG")
        return out.getvalue()
    except Exception as exc:
        logger.warning("Icon trim skipped: %s", exc)
        return image


def _client():
    from google import genai
    return genai.Client(api_key=settings.IMAGE_GEN_API_KEY or settings.GEMINI_API_KEY)


def draw(prompt: str, aspect_ratio: str = "1:1") -> bytes:
    from google.genai import types
    model = (settings.IMAGE_GEN_MODEL or "gemini-2.5-flash-image").removeprefix("gemini/")
    client = _client()  # keep a reference: a discarded client closes its connection before the request is sent
    response = client.models.generate_content(
        model=model, contents=prompt,
        config=types.GenerateContentConfig(response_modalities=["IMAGE"],
                                           image_config=types.ImageConfig(aspect_ratio=aspect_ratio)),
    )
    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data
    raise ValueError("Model gambar tidak mengembalikan gambar.")


def read_text(image: bytes) -> str:
    from google.genai import types
    client = _client()
    response = client.models.generate_content(
        model=settings.clean_chat_model,
        contents=[types.Part.from_bytes(data=image, mime_type="image/png"),
                  "Apakah ada tulisan (huruf, kata, atau angka) pada gambar ini? Jika ada, salin persis. "
                  "Jika tidak ada sama sekali, jawab hanya: TIDAK ADA"],
        config=types.GenerateContentConfig(temperature=0),
    )
    return response.text or ""


def has_lettering(seen: str) -> bool:
    cleaned = re.sub(r"(?i)tidak\s+ada", "", seen)
    return len(re.findall(r"[A-Za-z0-9]", cleaned)) >= 3


def _save(document_id: str, image: bytes) -> str:
    folder = os.path.join(settings.UPLOADS_DIR, "images")
    os.makedirs(folder, exist_ok=True)
    name = f"{re.sub(r'[^A-Za-z0-9_-]', '_', document_id)}_ai_{uuid.uuid4().hex[:8]}.png"
    with open(os.path.join(folder, name), "wb") as handle:
        handle.write(image)
    return f"/uploads/images/{name}"


def _draw_clean(prompt: str, aspect_ratio: str) -> tuple[bytes, bool]:
    """Returns (image, still_has_lettering) after at most one redraw."""
    image = draw(prompt, aspect_ratio)
    for attempt in range(2):
        try:
            lettered = has_lettering(read_text(image))
        except Exception as exc:  # unverified pictures are flagged for the teacher rather than trusted
            logger.warning("Lettering check failed: %s", exc)
            lettered = True
        if not lettered or attempt == 1:
            return image, lettered
        image = draw(prompt, aspect_ratio)
    return image, True


def create_art(document_id: str, info: dict) -> dict:
    """Draws the hero and pillar icons in parallel; raises only if nothing at all could be drawn."""
    jobs = [("hero", None, hero_prompt(info), "16:9")]
    jobs += [("icon", pillar["name"], icon_prompt(info, pillar), "1:1") for pillar in info.get("pillars", [])[:4]]

    def run(job):
        kind, label, prompt, ratio = job
        try:
            image, lettered = _draw_clean(prompt, ratio)
            if kind == "icon":
                image = trim_whitespace(image)
            return kind, label, _save(document_id, image), lettered
        except Exception as exc:
            logger.warning("AI art %s %s failed for %s: %s", kind, label or "", document_id, exc)
            return kind, label, None, False

    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        results = list(pool.map(run, jobs))
    hero = next((url for kind, _, url, _ in results if kind == "hero"), None)
    icons = [{"label": label, "url": url} for kind, label, url, _ in results if kind == "icon" and url]
    if not hero and not icons:
        raise ValueError("Gambar belum berhasil dibuat.")
    lettered = [("Ilustrasi utama" if kind == "hero" else f"Ikon {label}") for kind, label, url, flag in results if url and flag]
    return {"state": "READY", "hero_url": hero, "icons": icons, "lettered": lettered,
            "created_at": datetime.utcnow().isoformat() + "Z"}


def image_urls(image: dict | None) -> list[str]:
    if not image:
        return []
    return [url for url in [image.get("hero_url"), image.get("url"), *(i.get("url") for i in image.get("icons") or [])] if url]


def remove_file(url: str | None):
    """Deletes a picture this service created (never anything outside uploads/images)."""
    if not url or not re.fullmatch(r"/uploads/images/[A-Za-z0-9_-]+_ai_[0-9a-f]{8}\.png", url):
        return
    path = os.path.join(settings.UPLOADS_DIR, "images", url.rsplit("/", 1)[1])
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def remove_files(image: dict | None, keep: dict | None = None):
    kept = set(image_urls(keep))
    for url in image_urls(image):
        if url not in kept:
            remove_file(url)
