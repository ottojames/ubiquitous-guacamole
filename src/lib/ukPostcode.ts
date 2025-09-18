export const UK_POSTCODE_RX =
  /\b(?:(?:GIR\s?0AA)|(?:(?:[A-PR-UWYZ][0-9][0-9A-HJKSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9ABEHMNPRV-Y]?)[ ]?[0-9][ABD-HJLNP-UW-Z]{2}))\b/i;

export function formatUKPostcode(input: string): string {
  if (!input) return '';
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length < 5) return raw;
  return raw.replace(/^(.+?)([A-Z0-9]{3})$/, '$1 $2').trim();
}

export function extractUKPostcode(text?: string | null): string {
  if (!text) return '';
  const match = text.match(UK_POSTCODE_RX);
  return match ? formatUKPostcode(match[0]) : '';
}
