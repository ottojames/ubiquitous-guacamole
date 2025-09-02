export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function humanDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

/** Safely JSON.parse a string. Returns `fallback` if null/empty/invalid. */
export function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** File-name slug (keeps dots and dashes) */
export function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/** Get lowercased file extension (no dot) */
export function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Human-readable bytes (e.g., 10.2 MB) */
export function bytesToSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}