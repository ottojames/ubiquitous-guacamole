/** @vitest-environment node */
import { describe, it, expect, vi } from 'vitest';
import { handleUploadCore } from '../routes/upload';

// Mock OCR to avoid heavy dependencies in unit test
vi.mock('../utils/ocr', () => ({
  ocrFile: vi.fn(async () => 'unit-ocr-text'),
}));

describe('upload handler (unit)', () => {
  it('returns OCR text locally when Supabase is not configured', async () => {
    const file = {
      originalname: 'hello.pdf',
      buffer: Buffer.from('dummy'),
      mimetype: 'application/pdf',
      size: 12,
    } as any;
    const result = await handleUploadCore(file, {}, {}, {} as any);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('unit-ocr-text');
    expect(result.meta.engine).toBe('local');
  });

  it('returns OCR_EMPTY when OCR yields empty text', async () => {
    const { ocrFile } = await import('../utils/ocr');
    (ocrFile as any).mockResolvedValueOnce('');
    const file = {
      originalname: 'blank.png',
      buffer: Buffer.from('dummy'),
      mimetype: 'image/png',
      size: 12,
    } as any;
    const result = await handleUploadCore(file, {}, {}, {} as any);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('');
    expect(result.error).toBe('OCR_EMPTY');
  });
});
