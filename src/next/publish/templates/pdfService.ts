/**
 * Client-side PDF service - calls the server-side API endpoint
 * 
 * This service replaces the broken client-side PDF rendering
 * with calls to the /api/pdf/generate endpoint.
 */

import type { NoticeBase } from '@/types/notice';

export interface PdfGenerationOptions {
  category: string;
  variant?: string;
  tokens: Record<string, string>;
  premisesName?: string;
  premisesAddress?: string;
  noticeType?: string;
  deadline?: string;
}

/**
 * Generate a PDF by calling the server-side API
 * Returns the PDF as a Uint8Array
 */
export async function generatePdf(options: PdfGenerationOptions): Promise<Uint8Array> {
  const response = await fetch('/api/pdf/generate?format=base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
    throw new Error(error.error || 'Failed to generate PDF');
  }

  const result = await response.json();
  
  if (!result.success || !result.pdf) {
    throw new Error(result.error || 'Invalid response from PDF API');
  }

  // Convert base64 to Uint8Array
  const binaryString = atob(result.pdf);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Download a PDF directly (opens download dialog)
 */
export async function downloadPdf(options: PdfGenerationOptions, filename?: string): Promise<void> {
  const pdfBytes = await generatePdf(options);
  
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `notice-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Extract PDF options from a NoticeBase
 */
export function extractPdfOptions(notice: NoticeBase, category: string): PdfGenerationOptions {
  const extras = (notice.extras ?? {}) as Record<string, unknown>;
  const tokens = (extras.tokens as Record<string, string>) ?? {};
  const variant = extras.variant as string | undefined;
  const premises = notice.premises as { name?: string; address?: string } | undefined;
  const consultation = notice.consultation as { deadline?: string } | undefined;
  
  return {
    category,
    variant: variant || `${category}-new`,
    tokens,
    premisesName: premises?.name,
    premisesAddress: premises?.address,
    noticeType: notice.noticeType,
    deadline: consultation?.deadline,
  };
}
