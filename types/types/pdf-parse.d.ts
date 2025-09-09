declare module 'pdf-parse/lib/pdf-parse.js' {
  export type PdfResult = { text?: string };
  const parse: (data: Buffer | Uint8Array) => Promise<PdfResult>;
  export default parse;
}