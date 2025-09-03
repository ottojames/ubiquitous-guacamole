import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import textract from 'textract';
import Tesseract from 'tesseract.js';

function mimeFromExt(ext: string): string {
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.rtf':
      return 'application/rtf';
    case '.txt':
      return 'text/plain';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

export async function ocrFile(buffer: Buffer, mime: string, ext: string): Promise<string> {
  const type = mime || mimeFromExt(ext);
  try {
    if (type === 'application/pdf' || ext === '.pdf') {
      try {
        const data = await pdfParse(buffer);
        if (data.text.trim()) return data.text;
      } catch (e) {
        console.error('pdf-parse failed', e);
      }
      try {
        const result = await Tesseract.recognize(buffer, 'eng');
        return result.data.text;
      } catch (e) {
        console.error('tesseract pdf fallback failed', e);
        return '';
      }
    }
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
      const data = await mammoth.extractRawText({ buffer });
      return data.value;
    }
    if (type === 'application/msword' || ext === '.doc' || type === 'application/rtf' || ext === '.rtf') {
      return await new Promise<string>((resolve, reject) => {
        textract.fromBufferWithMime(type, buffer, (err, text) => {
          if (err) reject(err);
          else resolve(text);
        });
      });
    }
    if (type === 'text/plain' || ext === '.txt') {
      return buffer.toString('utf-8');
    }
    if (type.startsWith('image/') || ['.png', '.jpg', '.jpeg'].includes(ext)) {
      const result = await Tesseract.recognize(buffer, 'eng');
      return result.data.text;
    }
    return '';
  } catch (err) {
    console.error('ocrFile error', err);
    return '';
  }
}
