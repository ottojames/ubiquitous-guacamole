declare module "pdf-parse/lib/pdf-parse.js" {
  const pdfParse: (b: Buffer) => Promise<{ text: string }>;
  export = pdfParse;
}