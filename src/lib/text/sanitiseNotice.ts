export function sanitiseNoticeText(raw: string): string {
  if (!raw) return '';

  let t = raw;

  // Remove leading HYPERLINK "mailto:..." noise and leave the email on its own line.
  t = t.replace(/HYPERLINK\s+"mailto:([^"\\n]+)"\s*/gi, '$1\n');
  // Remove any HYPERLINK wrappers around http(s) URLs that occasionally appear in OCR output.
  t = t.replace(/HYPERLINK\s+"https?:\/\/[^"\\n]+"\s*/gi, '');

  // Normalise mailto formats whether quoted or bare.
  t = t.replace(/"mailto:([^"\\n]+)"/gi, '$1');
  t = t.replace(/\bmailto:([^\s"<>]+)/gi, '$1');

  // De-duplicate repeated email lines introduced by OCR quirks.
  t = t.replace(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b(?:\s*\n\s*\1\b)+/gi, '$1');

  // Lower-case emails for display consistency while leaving source data untouched.
  t = t.replace(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi, (match) => match.toLowerCase());

  // Remove duplicate consecutive paragraphs/blocks (OCR sometimes extracts text twice)
  // Split into paragraphs and remove consecutive duplicates
  const paragraphs = t.split(/\n\n+/);
  const deduped: string[] = [];
  let prev = '';
  for (const para of paragraphs) {
    const normalized = para.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalized && normalized !== prev) {
      deduped.push(para);
      prev = normalized;
    }
  }
  t = deduped.join('\n\n');

  return t;
}

export default sanitiseNoticeText;
