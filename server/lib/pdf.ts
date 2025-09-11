// server/lib/pdf.ts
let pdfParse: typeof import("pdf-parse")["default"] | null = null;

export async function parsePdf(buffer: Buffer) {
  if (!pdfParse) {
    pdfParse = (await import("pdf-parse")).default;
  }
  return pdfParse!(buffer);
}
