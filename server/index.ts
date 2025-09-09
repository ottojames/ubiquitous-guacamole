// server/index.ts
import express from "express";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import cors from "cors";
import { createRequire } from "module";
import dotenv from "dotenv";
import { pathToFileURL } from "url";

// --- new imports for address provider --------------------------------------
import { GetAddressProvider } from "./providers/getaddress.js";

// simple in-memory cache
type CacheEntry<T> = { v: T; exp: number };
const cache = new Map<string, CacheEntry<any>>();
function getCache<T>(k: string): T | undefined {
  const e = cache.get(k);
  if (!e) return;
  if (Date.now() > e.exp) { cache.delete(k); return; }
  return e.v as T;
}
function setCache<T>(k: string, v: T, ttlMs = 5 * 60 * 1000) {
  cache.set(k, { v, exp: Date.now() + ttlMs });
}

// light rate-limit per IP
const buckets = new Map<string, { n: number; ts: number }>();
function rateLimit(maxPerMin = 60) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anon";
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

// ---------------------------------------------------------------------------

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

const require = createRequire(import.meta.url);
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// --- helpers --------------------------------------------------------------
const isPdfBuf = (buf: Buffer) => buf.slice(0, 4).toString() === "%PDF";
const isImageType = (ct?: string) => !!ct && /^image\//i.test(ct);
const extOf = (urlStr?: string) => {
  if (!urlStr) return "";
  try { return path.extname(new URL(urlStr).pathname).toLowerCase(); }
  catch { return path.extname(urlStr).toLowerCase(); }
};

// ---------------------------------------------------------------------------
// OCR + file parsing endpoints (your existing code) -------------------------
// ---------------------------------------------------------------------------

async function extractTextFromBuffer(
  buf: Buffer,
  contentType?: string,
  filenameHint?: string
) {
  if (isPdfBuf(buf) || extOf(filenameHint) === ".pdf" || (contentType ?? "").includes("pdf")) {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (b: Buffer) => Promise<{ text: string }>;
    const pdf = await pdfParse(buf);
    return { text: pdf.text || "", engine: "pdf-parse" };
  }

  if (extOf(filenameHint) === ".docx" || (contentType ?? "").includes("officedocument.wordprocessingml.document")) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return { text: value || "", engine: "mammoth-docx" };
  }

  if ((contentType ?? "").includes("text/plain") || extOf(filenameHint) === ".txt") {
    return { text: buf.toString("utf8"), engine: "plain" };
  }
  if (extOf(filenameHint) === ".rtf" || (contentType ?? "").includes("rtf")) {
    const raw = buf.toString("utf8").replace(/\\'[0-9a-fA-F]{2}/g, " ").replace(/\\[a-z]+\d* ?|[{}]/g, "");
    return { text: raw, engine: "rtf-strip" };
  }

  if (isImageType(contentType) || [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".gif", ".webp"].includes(extOf(filenameHint))) {
    const { data } = await Tesseract.recognize(buf, "eng");
    return { text: data.text || "", engine: "tesseract" };
  }

  const { data } = await Tesseract.recognize(buf, "eng");
  return { text: data.text || "", engine: "tesseract-fallback" };
}

app.post("/api/ocr-from-url", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: { message: "url required" } });
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
    const ct = resp.headers.get("content-type") || undefined;
    const ab = await resp.arrayBuffer();
    const buf = Buffer.from(ab);
    const { text, engine } = await extractTextFromBuffer(buf, ct, url);
    return res.json({ data: { ocr_text: text, engine } });
  } catch (e: any) {
    return res.status(500).json({ error: { message: e?.message || "ocr-from-url failed" } });
  }
});

app.post("/api/ocr", (req, res) => {
  const form = formidable({ multiples: false, keepExtensions: true });
  form.parse(req, async (err, _fields, files) => {
    if (err) return res.status(400).json({ error: { message: err.message } });
    const file: any = (files as any)?.file;
    if (!file) return res.status(400).json({ error: { message: "file required" } });

    try {
      const buf = fs.readFileSync(file.filepath);
      const { text, engine } = await extractTextFromBuffer(buf, file.mimetype, file.originalFilename);
      return res.json({ data: { ocr_text: text, engine } });
    } catch (e: any) {
      return res.status(500).json({ error: { message: e?.message || "ocr failed" } });
    } finally {
      try { fs.unlinkSync(file.filepath); } catch {}
    }
  });
});

// ---------------------------------------------------------------------------
// NEW: modernised address endpoints -----------------------------------------
// ---------------------------------------------------------------------------

const addressProvider = new GetAddressProvider();

app.get("/api/address/search", rateLimit(120), async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) return res.json({ candidates: [] });

    const key = `search:${q.toLowerCase()}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const candidates = await addressProvider.search(q);
    const payload = { candidates };
    setCache(key, payload);
    res.json(payload);
  } catch (e: any) {
    res.status(502).json({ error: { code: "provider_down", message: e?.message || "Lookup failed" } });
  }
});

app.get("/api/address/find", rateLimit(120), async (req, res) => {
  try {
    const postcode = String(req.query.postcode || "").trim();
    const number = String(req.query.number || "").trim();
    if (!postcode) return res.status(400).json({ error: { code: "bad_request", message: "postcode required" } });

    const key = `find:${postcode}:${number.toLowerCase()}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const candidates = await addressProvider.find(postcode, number);
    const payload = { candidates };
    setCache(key, payload);
    res.json(payload);
  } catch (e: any) {
    res.status(502).json({ error: { code: "provider_down", message: e?.message || "Lookup failed" } });
  }
});

app.get("/api/councils/resolve", async (req, res) => {
  const uprn = req.query.uprn ? String(req.query.uprn) : undefined;
  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lng = req.query.lng ? Number(req.query.lng) : undefined;
  // TODO: plug in LAD polygon resolution
  res.json({
    council: uprn || (lat && lng)
      ? { id: "stub-lad", name: "Your Local Council", email: "licensing@example.gov.uk" }
      : null,
    method: uprn ? "uprn" : (lat && lng) ? "point" : "unknown",
  });
});

// ---------------------------------------------------------------------------
// healthcheck + catch-all ---------------------------------------------------
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ Message: "Not Found" }));

// ---------------------------------------------------------------------------
// Start server only if run directly (ESM-safe) ------------------------------
// ---------------------------------------------------------------------------

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const PORT = Number(process.env.PORT) || 5174;
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}

export default app;
