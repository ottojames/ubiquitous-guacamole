const buckets = new Map<string,{ n:number; ts:number }>();
export function rateLimit(maxPerMin = 60) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "anon";
    const now = Date.now();
    const slot = Math.floor(now / 60000);
    const key = `${ip}:${slot}`;
    const b = buckets.get(key) || { n: 0, ts: slot };
    if (b.ts !== slot) { b.n = 0; b.ts = slot; }
    b.n += 1; buckets.set(key, b);
    if (b.n > maxPerMin) return res.status(429).json({ error: { code: "rate_limited", message: "Too many requests" } });
    next();
  };
}
