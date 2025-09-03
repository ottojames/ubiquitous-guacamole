import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import textract from 'textract';

function mimeFromExt(ext: string): string {
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.txt':
      return 'text/plain';
    case '.rtf':
      return 'application/rtf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
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

    if (
      type === 'image/png' ||
      type === 'image/jpeg' ||
      ['.png', '.jpg', '.jpeg'].includes(ext)
    ) {
      const result = await Tesseract.recognize(buffer, 'eng');
      return result.data.text;
    }

    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === '.docx'
    ) {
      try {
        const data = await mammoth.extractRawText({ buffer });
        if (data.value.trim()) return data.value;
      } catch (e) {
        console.error('mammoth failed', e);
      }
      return await new Promise<string>((resolve) => {
        textract.fromBufferWithMime(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer,
          (err, text) => {
            if (err) {
              console.error('textract docx fallback failed', err);
              resolve('');
            } else {
              resolve(text);
            }
          },
        );
      });
    }

    if (
      type === 'application/msword' ||
      ext === '.doc' ||
      type === 'application/rtf' ||
      ext === '.rtf'
    ) {
      return await new Promise<string>((resolve) => {
        textract.fromBufferWithMime(type, buffer, (err, text) => {
          if (err) {
            console.error('textract doc/rtf failed', err);
            resolve('');
          } else {
            resolve(text);
          }
        });
      });
    }

    if (type === 'text/plain' || ext === '.txt') {
      return buffer.toString('utf-8');
    }

    return '';
  } catch (err) {
    console.error('ocrFile error', err);
    return '';
  }
}

