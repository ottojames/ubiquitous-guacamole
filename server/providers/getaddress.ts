import type { AddressProvider, AddressCandidate } from "./AddressProvider.js";

const BASE = "https://api.getAddress.io";
const KEY =
  process.env.GETADDRESS_API_KEY ||
  process.env.VITE_GETADDRESS_API_KEY ||
  process.env.NEXT_PUBLIC_GETADDRESS_API_KEY;

function normaliseLineCase(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
function toSingleLine(lines: string[], postcode: string) {
  const core = lines.filter(Boolean).map(normaliseLineCase).join(", ");
  return `${core} ${postcode}`.replace(/\s+/g, " ").trim();
}
function isPoBox(lines: string[]) {
  return lines.some((l) => /\bP\.?\s*O\.?\s*BOX\b/i.test(l));
}

export class GetAddressProvider implements AddressProvider {
  async search(q: string): Promise<AddressCandidate[]> {
    if (!KEY) throw new Error("Missing GETADDRESS_API_KEY");

    const url = `${BASE}/autocomplete/${encodeURIComponent(q)}?api-key=${encodeURIComponent(
      KEY
    )}&all=true&top=20`;

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const j: any = await r.json();
    if (!r.ok) throw new Error(j?.Message || "provider_error");

    const suggestions: any[] = Array.isArray(j?.suggestions) ? j.suggestions : [];

    const candidates: AddressCandidate[] = suggestions
      .map((s: any): AddressCandidate => {
        const text = normaliseLineCase(s?.address || s?.text || s?.label || "");
        const postcode = String(s?.postcode || "").trim();
        const lines = text ? [text] : [];
        const formatted_single_line = postcode ? `${text} ${postcode}`.trim() : text;

        return {
          lines,
          postcode,
          formatted_single_line,
          confidence: "low",
        };
      })
      .filter((c: AddressCandidate) => Boolean(c.formatted_single_line));

    return candidates;
  }

  async find(postcode: string, numberOrName: string): Promise<AddressCandidate[]> {
    if (!KEY) throw new Error("Missing GETADDRESS_API_KEY");

    const url = `${BASE}/find/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(
      KEY
    )}&expand=true`;

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const j: any = await r.json();
    if (!r.ok) throw new Error(j?.Message || "provider_error");

    const items: any[] = Array.isArray(j?.addresses) ? j.addresses : [];

    const norm: AddressCandidate[] = items.map((a: any): AddressCandidate => {
      const l1 = a?.line_1 || a?.line1 || "";
      const l2 = a?.line_2 || a?.line2 || "";
      const l3 = a?.line_3 || a?.line3 || "";
      const town = a?.town_or_city || a?.town || a?.locality || "";
      const county = a?.county || "";
      const pc = a?.postcode || postcode || "";
      const lines = [l1, l2, l3, town, county].filter(Boolean).map(normaliseLineCase);
      const lat = a?.latitude != null ? Number(a.latitude) : undefined;
      const lng = a?.longitude != null ? Number(a.longitude) : undefined;
      const uprn = a?.uprn ? String(a.uprn) : undefined;
      const udprn = a?.udprn ? String(a.udprn) : undefined;
      const formatted_single_line = toSingleLine([l1, l2, l3, town, county].filter(Boolean), pc);

      return {
        uprn,
        udprn,
        postcode: pc,
        lat,
        lng,
        lines,
        formatted_single_line,
        confidence: "high",
      };
    });

    // Filter by number/building if provided
    const q = numberOrName?.trim();
    const filtered: AddressCandidate[] = q
      ? norm.filter((c: AddressCandidate) =>
          c.formatted_single_line.toLowerCase().includes(q.toLowerCase())
        )
      : norm;

    // Block PO Boxes
    return filtered.filter((c: AddressCandidate) => !isPoBox(c.lines));
  }
}
