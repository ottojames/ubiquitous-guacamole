// server/utils/extractText.ts
import { parsePdf } from "../lib/pdf";
import * as mammoth from "mammoth";
import { createWorker } from "tesseract.js";

export type ExtractResult = {
  text: string;
  meta: Record<string, any>;
};

const isType = {
  pdf: (m: string, n: string) =>
    m === "application/pdf" || /\.pdf$/i.test(n),
  docx: (m: string, n: string) =>
    m ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(n),
  rtf: (m: string, n: string) =>
    m === "application/rtf" || m === "text/rtf" || /\.rtf$/i.test(n),
  txt: (m: string, n: string) =>
    m === "text/plain" || /\.txt$/i.test(n),
  image: (m: string, n: string) =>
    /^image\/(png|jpe?g|tiff?)$/i.test(m) || /\.(png|jpe?g|tiff?)$/i.test(n),
  legacyDoc: (m: string, n: string) =>
    m === "application/msword" || /\.doc$/i.test(n),
  pages: (m: string, n: string) =>
    m === "application/vnd.apple.pages" ||
    m === "application/x-iwork-pages-sffpages" ||
    /\.pages$/i.test(n),
};

function rtfToText(buf: Buffer): string {
  // Minimal pragmatic RTF → text (good enough for notices)
  const raw = buf.toString("utf8");
  return raw
    // hex escapes \'hh
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    // strip control words/groups
    .replace(/\\[a-z]+-?\d*(?:\s)?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<ExtractResult> {
  // Fast test/dev path if desired
  if (process.env.TEST_MODE === "1") {
    return { text: "hello (test mode)", meta: { engine: "test" } };
  }

  if (isType.pdf(mimetype, filename)) {
    const result = await parsePdf(buffer);
    let text = (result.text || "").trim();
    if (text) {
      return {
        text,
        meta: {
          engine: "pdf-parse",
          pages: (result as any).numpages ?? undefined,
          info: (result as any).info ?? undefined,
        },
      };
    }
    try {
      const worker = await createWorker("eng", 1, { logger: undefined });
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return {
        text: (data.text || "").trim(),
        meta: { engine: "tesseract", pages: (result as any).numpages ?? undefined },
      };
    } catch (e) {
      return { text: "", meta: { engine: "tesseract", error: String(e) } };
    }
  }

  if (isType.docx(mimetype, filename)) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: (result.value || "").trim(),
      meta: { engine: "mammoth", messages: result.messages },
    };
  }

  if (isType.rtf(mimetype, filename)) {
    return { text: rtfToText(buffer), meta: { engine: "rtf" } };
  }

  if (isType.txt(mimetype, filename)) {
    return { text: buffer.toString("utf8").trim(), meta: { engine: "txt" } };
  }

  if (isType.image(mimetype, filename)) {
    const worker = await createWorker("eng", 1, { logger: undefined });
    try {
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return {
        text: (data.text || "").trim(),
        meta: { engine: "tesseract", confidence: data.confidence },
      };
    } catch (e) {
      await worker.terminate().catch(() => {});
      throw e;
    }
  }

  if (isType.legacyDoc(mimetype, filename)) {
    try {
      const textract = await import("textract").then((m) => m.default || (m as any));
      const text: string = await new Promise((resolve, reject) => {
        textract.fromBufferWithMime("application/msword", buffer, (err: any, t: string) => {
          if (err) reject(err);
          else resolve(t);
        });
      });
      return { text: (text || "").trim(), meta: { engine: "textract" } };
    } catch (err: any) {
      err.status = 415;
      throw err;
    }
  }

  if (isType.pages(mimetype, filename)) {
    try {
      const textract = await import("textract").then((m) => m.default || (m as any));
      const text: string = await new Promise((resolve, reject) => {
        textract.fromBufferWithMime("application/vnd.apple.pages", buffer, (err: any, t: string) => {
          if (err) reject(err);
          else resolve(t);
        });
      });
      return { text: (text || "").trim(), meta: { engine: "textract" } };
    } catch (err: any) {
      err.status = 415;
      err.message = "Unable to extract text from Pages file. Please export as PDF or DOCX instead.";
      throw err;
    }
  }

  const err: any = new Error(
    `Unsupported file type: ${mimetype} (${filename})`
  );
  err.status = 415;
  throw err;
}
