import type { Request, Response } from "express";
import busboy from "busboy";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";
import Tesseract from "tesseract.js";
import path from "path";

function mimeFromExt(ext: string): string {
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".rtf":
      return "application/rtf";
    case ".txt":
      return "text/plain";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

async function extractText(buffer: Buffer, filename: string, mimeType: string) {
  const ext = path.extname(filename).toLowerCase();
  const type = mimeType || mimeFromExt(ext);
  if (type === "application/pdf" || ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const data = await mammoth.extractRawText({ buffer });
    return data.value;
  }
  if (
    type === "application/msword" ||
    ext === ".doc" ||
    type === "application/rtf" ||
    ext === ".rtf" ||
    type === "text/plain" ||
    ext === ".txt"
  ) {
    return await new Promise<string>((resolve, reject) => {
      textract.fromBufferWithMime(type, buffer, (err, text) => {
        if (err) reject(err);
        else resolve(text);
      });
    });
  }
  if (type.startsWith("image/") || [".png", ".jpg", ".jpeg"].includes(ext)) {
    const result = await Tesseract.recognize(buffer, "eng");
    return result.data.text;
  }
  return await new Promise<string>((resolve, reject) => {
    textract.fromBufferWithMime(type, buffer, (err, text) => {
      if (err) reject(err);
      else resolve(text);
    });
  });
}

export function ocrUpload(req: Request, res: Response) {
  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });
  let fileBuffer: Buffer = Buffer.alloc(0);
  let filename = "";
  let mimeType = "";
  let tooLarge = false;

  bb.on("file", (_name, file, info) => {
    filename = info.filename;
    mimeType = info.mimeType;
    file.on("data", (data: Buffer) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });
    file.on("limit", () => {
      tooLarge = true;
    });
  });

  bb.on("error", (err) => {
    console.error(err);
    res.status(500).json({ text: "", meta: { error: String(err) } });
  });

  bb.on("finish", async () => {
    if (tooLarge) {
      return res
        .status(400)
        .json({ text: "", meta: { error: "File must be 10 MB or less" } });
    }
    if (!fileBuffer.length) {
      return res
        .status(400)
        .json({ text: "", meta: { error: "No file uploaded" } });
    }
    try {
      const text = await extractText(fileBuffer, filename, mimeType);
      res.json({ text: text.trim(), meta: { filename, mimeType } });
    } catch (err: any) {
      console.error(err);
      res
        .status(400)
        .json({ text: "", meta: { error: err?.message || String(err) } });
    }
  });

  req.pipe(bb);
}
