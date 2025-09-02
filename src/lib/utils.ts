export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
export function humanDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
// Very rough postcode→council heuristic (replace with real lookup later)
export function inferCouncil(postcode: string | undefined) {
  if (!postcode) return undefined;
  const pc = postcode.toUpperCase();
  if (pc.startsWith("SW")) return "Wandsworth";
  if (pc.startsWith("SE")) return "Southwark";
  if (pc.startsWith("L")) return "Liverpool";
  if (pc.startsWith("M")) return "Manchester";
  if (pc.startsWith("BN")) return "Brighton & Hove";
  return undefined;
}
