import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import textract from 'textract';
import sharp from 'sharp';

function mimeFromExt(ext: string): string {
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.tif':
    case '.tiff':
      return 'image/tiff';
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

async function ocrImageBuffer(buf: Buffer): Promise<string> {
  // Preprocess: grayscale, normalize, resize into a reasonable range ~300-600 DPI equivalent
  // Using pixel width heuristic (2000px)
  try {
    const processed = await sharp(buf)
      .greyscale()
      .normalize()
      .resize({ width: 2000, withoutEnlargement: true })
      .toFormat('png')
      .toBuffer();
    try {
      const result = await Tesseract.recognize(processed, 'eng', { tessedit_pageseg_mode: 6 } as any);
      return result.data.text;
    } catch (e) {
      console.error('tesseract processed image failed', e);
    }
  } catch (e) {
    console.error('sharp preprocess failed', e);
  }
  try {
    const result = await Tesseract.recognize(buf, 'eng');
    return result.data.text;
  } catch (e) {
    console.error('tesseract raw image failed', e);
    return '';
  }
}

export async function ocrFile(buffer: Buffer, mime: string, ext: string): Promise<string> {
  const type = mime || mimeFromExt(ext);
  try {
    if (type === 'application/pdf' || ext === '.pdf') {
      // Use pdf-parse; if empty, we do not attempt OCR without rendering pages to images
      const data = await pdfParse(buffer);
      const text = (data.text || '').trim();
      if (text) return text;
      return '';
    }

    if (
      type === 'image/png' ||
      type === 'image/jpeg' ||
      type === 'image/tiff' ||
      ['.png', '.jpg', '.jpeg', '.tif', '.tiff'].includes(ext)
    ) {
      let imgBuf = buffer;
      if (type === 'image/tiff' || ext === '.tif' || ext === '.tiff') {
        try {
          imgBuf = await sharp(buffer).png().toBuffer();
        } catch (e) {
          console.error('tiff->png conversion failed', e);
        }
      }
      return await ocrImageBuffer(imgBuf);
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
          (err: any, text: string) => {
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

    if (type === 'application/msword' || ext === '.doc' || type === 'application/rtf' || ext === '.rtf') {
      return await new Promise<string>((resolve) => {
        textract.fromBufferWithMime(type, buffer, (err: any, text: string) => {
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
