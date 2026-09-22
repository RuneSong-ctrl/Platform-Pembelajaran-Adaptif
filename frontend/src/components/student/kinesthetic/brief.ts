// One short line for an object's label: the teacher-approved caption, else the first sentence, trimmed at a word.
export function brief(caption: string | undefined, text: string, max = 70): string {
  const source = (caption || "").trim() || text.split(/(?<=[.!?])\s/)[0].trim();
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : max).trim()}…`;
}
