type Entry<T> = { v: T; exp: number };
const mem = new Map<string, Entry<any>>();

export function getCache<T>(k: string): T | undefined {
  const e = mem.get(k);
  if (!e) return;
  if (Date.now() > e.exp) { mem.delete(k); return; }
  return e.v as T;
}
export function setCache<T>(k: string, v: T, ttlMs = 5 * 60 * 1000) {
  mem.set(k, { v, exp: Date.now() + ttlMs });
}
