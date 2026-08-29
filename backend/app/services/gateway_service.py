import logging
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("eduadapt.gateway")

class AIGatewayService:
    """
    Unified Service Client untuk 9router / Custom OpenAI-compatible Gateway.
    Mendukung Text-to-Speech (TTS), Image Generation, Embeddings, dan Chat Completions.
    """

    @staticmethod
    def _normalize_endpoint(endpoint: str, default_suffix: str) -> str:
        clean = endpoint.rstrip("/")
        if clean.endswith("/v1"):
            return f"{clean}/{default_suffix.lstrip('/')}"
        return clean

    @staticmethod
    def _synthesize_edge_tts(text: str, voice: Optional[str] = None) -> Optional[bytes]:
        """Mesin sintesis suara bahasa Indonesia alami (HD) bebas kuota dan bebas error."""
        try:
            import asyncio
            import edge_tts
            import io
            import concurrent.futures
            import re

            selected_v = "id-ID-ArdiNeural"
            if voice and any(w in voice.lower() for w in ["female", "gadis", "wanita"]):
                selected_v = "id-ID-GadisNeural"

            clean_text = re.sub(r"[*#_`~>\[\]\n\r]+", " ", text).strip()
            if not clean_text:
                clean_text = "Selamat datang di podcast pembelajaran adaptif."

            async def _synth():
                communicate = edge_tts.Communicate(clean_text, selected_v)
                buf = io.BytesIO()
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        buf.write(chunk["data"])
                return buf.getvalue()

            with concurrent.futures.ThreadPoolExecutor() as pool:
                audio_bytes = pool.submit(asyncio.run, _synth()).result(timeout=50)
                if audio_bytes and len(audio_bytes) > 200:
                    logger.info(f"[AIGateway] Berhasil memproduksi audio podcast TTS alami ({len(audio_bytes)} bytes)")
                    return audio_bytes
        except Exception as e:
            logger.warning(f"[AIGateway] Sintesis suara edge-tts error: {e}")
        return None

    @staticmethod
    def generate_speech(text: str, voice: Optional[str] = None, model: Optional[str] = None) -> Optional[bytes]:
        """
        Menghasilkan audio biner (MP3) dari teks materi/podcast.
        """
        endpoint = AIGatewayService._normalize_endpoint(settings.TTS_ENDPOINT, "audio/speech")
        api_key = settings.TTS_API_KEY or settings.GEMINI_API_KEY or settings.AI_API_KEY or ""
        selected_model = model or settings.TTS_MODEL
        selected_voice = voice or settings.TTS_VOICE

        # Jika endpoint gateway eksternal dikonfigurasi dan bukan router yang tidak punya kredensial audio
        if endpoint and "router" not in endpoint.lower() and api_key and selected_model:
            # Format model with voice for Gemini TTS if applicable
            target_model = selected_model
            if target_model and "gemini" in target_model.lower() and "tts" in target_model.lower():
                if selected_voice and not target_model.endswith(f"/{selected_voice}"):
                    target_model = f"{target_model.rstrip('/')}/{selected_voice}"

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": target_model,
                "input": text
            }
            if not ("gemini" in target_model.lower() and "tts" in target_model.lower()):
                if selected_voice:
                    payload["voice"] = selected_voice

            try:
                with httpx.Client(timeout=6.0) as client:
                    response = client.post(endpoint, json=payload, headers=headers)
                    if response.status_code == 200 and len(response.content) > 300:
                        return response.content
                    else:
                        logger.warning(f"[AIGateway] Gateway TTS respons status={response.status_code}. Beralih ke mesin vokal alami...")
            except Exception as e:
                logger.warning(f"[AIGateway] Error koneksi Gateway TTS: {e}. Beralih ke mesin vokal alami...")

        # Gunakan sintesis vokal bahasa Indonesia berkualitas tinggi (cepat & jernih)
        return AIGatewayService._synthesize_edge_tts(text, selected_voice)

    @staticmethod
    def generate_image(prompt: str, size: str = "1024x1024", model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Menghasilkan URL atau data gambar konsep materi menggunakan 9router Image Gen Endpoint.
        """
        if not settings.IMAGE_GEN_ENDPOINT:
            return None

        endpoint = AIGatewayService._normalize_endpoint(settings.IMAGE_GEN_ENDPOINT, "images/generations")
        api_key = settings.IMAGE_GEN_API_KEY or settings.GEMINI_API_KEY or settings.AI_API_KEY or ""
        selected_model = model or settings.IMAGE_GEN_MODEL

        if not endpoint or not api_key or not selected_model:
            logger.debug("[AIGateway] Image Gen Endpoint, API Key, atau IMAGE_GEN_MODEL belum disetel.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": selected_model,
            "prompt": prompt,
            "n": 1,
            "size": size,
            "response_format": "url"
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(endpoint, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    return data
                else:
                    logger.debug(f"[AIGateway] Image Gen gagal status={response.status_code}: {response.text[:200]}")
                    return None
        except Exception as e:
            logger.debug(f"[AIGateway] Error koneksi Image Gen: {e}")
            return None

    @staticmethod
    def generate_embeddings(texts: List[str], model: Optional[str] = None) -> Optional[List[List[float]]]:
        """
        Menghasilkan vektor embedding menggunakan 9router Embeddings Endpoint.
        """
        if not settings.EMBEDDING_ENDPOINT:
            return None

        endpoint = AIGatewayService._normalize_endpoint(settings.EMBEDDING_ENDPOINT, "embeddings")
        api_key = settings.EMBEDDING_API_KEY or settings.GEMINI_API_KEY or settings.AI_API_KEY or ""
        selected_model = model or settings.EMBEDDING_MODEL or settings.GEMINI_EMBEDDING_MODEL

        if not endpoint or not api_key or not selected_model:
            logger.debug("[AIGateway] Embedding Endpoint, API Key, atau EMBEDDING_MODEL belum disetel.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": selected_model,
            "input": texts
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(endpoint, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and isinstance(data["data"], list):
                        return [item["embedding"] for item in data["data"]]
                else:
                    logger.debug(f"[AIGateway] Embedding gagal status={response.status_code}: {response.text[:200]}")
                    return None
        except Exception as e:
            logger.debug(f"[AIGateway] Error koneksi Embedding: {e}")
            return None

    @staticmethod
    def generate_chat(messages: List[Dict[str, str]], model: Optional[str] = None, temperature: float = 0.7) -> Optional[str]:
        """
        Menghasilkan teks chat/kuis menggunakan 9router Chat Completions Endpoint.
        """
        if not settings.CHAT_ENDPOINT:
            return None

        endpoint = AIGatewayService._normalize_endpoint(settings.CHAT_ENDPOINT, "chat/completions")
        api_key = settings.CHAT_API_KEY or settings.GEMINI_API_KEY or settings.AI_API_KEY or ""
        selected_model = model or settings.CHAT_MODEL or settings.GEMINI_CHAT_MODEL

        if not endpoint or not api_key or not selected_model:
            logger.debug("[AIGateway] Chat Endpoint, API Key, atau CHAT_MODEL belum disetel.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
            "stream": False
        }

        models_to_try = [selected_model]
        for alt in ["gemini/gemini-3.7-flash", "gemini/gemini-3.5-flash-lite"]:
            if alt not in models_to_try:
                models_to_try.append(alt)

        for current_model in models_to_try:
            payload["model"] = current_model
            try:
                with httpx.Client(timeout=20.0) as client:
                    response = client.post(endpoint, json=payload, headers=headers)
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            choices = data.get("choices", [])
                            if choices:
                                return choices[0].get("message", {}).get("content", "")
                        except Exception:
                            import json as _json
                            chunks = []
                            for line in response.text.split("\n"):
                                line = line.strip()
                                if line.startswith("data: ") and line != "data: [DONE]":
                                    try:
                                        d = _json.loads(line[6:])
                                        delta = d.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if delta:
                                            chunks.append(delta)
                                    except Exception:
                                        pass
                            if chunks:
                                return "".join(chunks)
                    elif response.status_code == 404:
                        continue
                    else:
                        logger.debug(f"[AIGateway] Chat completions gagal status={response.status_code}")
            except Exception as e:
                logger.debug(f"[AIGateway] Error koneksi Chat ({current_model}): {e}")

        return None
