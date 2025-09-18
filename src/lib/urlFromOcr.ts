// Heuristic URL extractor for OCR text
export type ExtractedUrl = { url: string; score: number };

const URL_RX = /\bhttps?:\/\/[^\s<>")']+/gi;

// Basic email+mailto cleanup lives elsewhere; here we only target http(s) links.
function normalise(url: string) {
  return url.replace(/[),.;:]+$/g, '');
}

export function extractCandidateUrls(ocr: string): ExtractedUrl[] {
  if (!ocr) return [];
  const found = new Set<string>();
  const out: ExtractedUrl[] = [];
  const text = ocr.replace(/\u00A0/g, ' ');

  for (const raw of text.match(URL_RX) ?? []) {
    const u = normalise(raw);
    if (found.has(u)) continue;
    found.add(u);

    const lower = u.toLowerCase();
    let score = 0;
    if (/\b\.gov\.uk\b/.test(lower)) score -= 2;
    if (/licen[cs]ing|representation|object(ion)?|alcohol|premises/.test(lower)) score -= 2;
    if (/forms?|apply|submit/.test(lower)) score -= 1;

    out.push({ url: u, score });
  }

  return out.sort((a, b) => a.score - b.score);
}

export function pickBestUrl(ocr: string): string | null {
  const cands = extractCandidateUrls(ocr);
  return cands.length ? cands[0].url : null;
}
