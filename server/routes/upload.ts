import { Router } from "express";
import multer from "multer";
import { getServiceSupabaseClient } from "../lib/supabase.js";
import { createHash } from "node:crypto";
import slugify from "slugify";
import { extractTextFromBuffer } from "../utils/extractText";
import { cleanupNoticeText } from "../utils/cleanupNoticeText";

const upload = (multer as any)({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(req: any, file: any, cb: any) {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/tiff",
      "image/tif",
      "text/plain",
      "application/rtf",
      "text/rtf",
      "application/msword", // .doc (we'll 415 later in extractor)
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.apple.pages", // .pages
      "application/x-iwork-pages-sffpages", // .pages (alternate MIME)
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else {
      (req as any).invalidMime = file.mimetype;
      cb(null, false);
    }
  },
});

const router = Router();
const PAGE_LIMIT = Number(process.env.PAGE_LIMIT || 4);
const seenHashes = new Map<string, { path: string; text: string; meta: any }>();

// Simple in-memory rate limiter: 20/min per IP
const hits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
router.use((req, res, next) => {
  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "ip:unknown";
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return next();
  }
  rec.count += 1;
  if (rec.count > RATE_LIMIT) {
    res
      .status(429)
      .json({ ok: false, error: "Too many uploads, please try again shortly." });
  } else next();
});

// Core handler logic
export async function handleUploadCore(
  file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
  query: Record<string, any>,
  body: Record<string, any>,
  env: NodeJS.ProcessEnv
) {
  const hasSupabase = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = env.SUPABASE_BUCKET || "blue-notices";
  const uploaderId = body["uploaderId"];
  const safe = slugify(file.originalname, { lower: true, strict: true });
  const path = `${uploaderId || "anon"}/${Date.now()}_${safe}`;

  const skipOcr = String(query.skipOcr) === "1";
  let ocr_text = "";
  let meta: any = {};
  const sha256 = createHash("sha256").update(file.buffer).digest("hex");

  if (!skipOcr) {
    try {
      const { text, meta: m } = await extractTextFromBuffer(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      // Apply AI-powered text cleanup to fix capitalization, postcodes, etc.
      // while preserving legal wording
      ocr_text = cleanupNoticeText(text);
      meta = m;
      console.log('[upload] Text cleanup applied:', {
        originalLength: text.length,
        cleanedLength: ocr_text.length,
      });
    } catch (err: any) {
      const status = err?.status || 500;
      if (status === 415) {
        return {
          ok: false,
          error: {
            code: "UNSUPPORTED_TYPE",
            message:
              err?.message ||
              "Unsupported file. Upload PDF, DOC, DOCX, Pages, RTF, TXT, or an image (PNG/JPG/TIFF).",
          },
        };
      }
      throw err;
    }
  }

  const pageCount = meta.pages || meta.pageCount || 0;
  const mimeMeta = {
    engine: meta.engine || (hasSupabase ? "supabase" : "local"),
    pageCount,
    bytes: file.size,
    mime: file.mimetype,
    sha256,
    stored: false,
  } as any;

  if (pageCount > PAGE_LIMIT) {
    return {
      ok: false,
      error: {
        code: "TOO_MANY_PAGES",
        message: `File has ${pageCount} pages; limit is ${PAGE_LIMIT}.`,
      },
      meta: mimeMeta,
    };
  }

  // Check for duplicate and return cached text if available
  if (seenHashes.has(sha256)) {
    const cached = seenHashes.get(sha256)!;
    console.log('[upload] 🔄 Duplicate detected, returning cached text:', {
      textLength: cached.text.length,
      path: cached.path
    });

    return {
      ok: true,
      text: cached.text,
      ocr_text: cached.text,
      meta: { ...mimeMeta, ...cached.meta, cached: true },
      info: "This file was already processed. Returning cached result.",
    };
  }

  // Store hash with text and meta for future duplicate uploads
  seenHashes.set(sha256, { path, text: ocr_text, meta });

  if (!hasSupabase) {
    if (!ocr_text.trim()) {
      return {
        ok: true,
        text: "",
        ocr_text: "",
        error: "OCR_EMPTY",
        meta: mimeMeta,
      };
    }
    return {
      ok: true,
      text: ocr_text,
      ocr_text,
      meta: mimeMeta,
    };
  }

  const supabase = getServiceSupabaseClient();

  const uploaded = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype });
  if (uploaded.error) {
    throw new Error(uploaded.error.message);
  }

  const signed = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error(signed.error?.message || "Failed to sign URL");
  }

  const row = await supabase
    .from("uploads")
    .insert({
      bucket,
      path,
      file_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      applicant_email: body["applicantEmail"],
      ocr_text,
      status: "processed",
      public_url: signed.data.signedUrl,
      uploader_id: uploaderId || null,
    })
    .select()
    .single();
  if (row.error) {
    throw new Error(row.error.message);
  }

  return {
    ok: true,
    id: row.data.id,
    signed_url: signed.data.signedUrl,
    ocr_text,
    text: ocr_text,
    ...(ocr_text.trim() ? {} : { error: "OCR_EMPTY" }),
    meta: { ...mimeMeta, stored: true },
  };
}

router.get("/", (_req, res) =>
  res
    .status(400)
    .json({ ok: false, code: "NO_FILE", message: "No file provided" })
);

router.post("/", (req, res) => {
  (upload.single("file"))(req as any, res as any, async (err: any) => {
    if (err) {
      const code = err?.code;
      if (code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          ok: false,
          code: "FILE_TOO_LARGE",
          message:
            "File is over 25MB. Please upload a smaller file or compress.",
        });
      }
      console.error("multer error", err);
      return res.status(400).json({
        ok: false,
        code: code || "UPLOAD_ERROR",
        message: err?.message || "Upload error",
      });
    }

    if ((req as any).invalidMime) {
      return res.status(415).json({
        ok: false,
        code: "UNSUPPORTED_TYPE",
        message:
          "Unsupported file. Upload PDF, DOC, DOCX, Pages, RTF, TXT, or an image (PNG/JPG/TIFF).",
      });
    }

    const file = (req as any).file as
      | {
          originalname: string;
          buffer: Buffer;
          mimetype: string;
          size: number;
        }
      | undefined;

    if (!file) {
      return res
        .status(400)
        .json({ ok: false, code: "NO_FILE", message: "No file provided" });
    }

    try {
      const t0 = Date.now();
      const traceId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const result = await handleUploadCore(
        file,
        req.query as any,
        req.body as any,
        process.env
      );

      const ocrMs = Date.now() - t0;

      console.log(
        JSON.stringify({
          level: "info",
          msg: "upload_complete",
          traceId,
          ext: (file.originalname.split(".").pop() || "").toLowerCase(),
          size: file.size,
          ocrMs,
          outcome: (result as any).ok ? "ok" : "error",
        })
      );

      if (
        (result as any).ok === false &&
        (result as any).error?.code === "UNSUPPORTED_TYPE"
      ) {
        return res.status(415).json(result);
      }

      return res.json(result);
    } catch (err: any) {
      console.error("[UPLOAD_ERR]", err);
      const status = err?.status || 500;
      return res.status(status).json({
        ok: false,
        error: {
          code: "UPLOAD_FAILED",
          message: err?.message || "Upload failed",
        },
      });
    }
  });
});

export default router;
