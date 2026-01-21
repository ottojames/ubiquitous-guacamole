/**
 * Hook for generating draft notice text
 * Uses the /api/drafting/from-notice-base endpoint
 */

import { useState, useCallback } from 'react';
import type { NoticeBase } from '@/types/notice';

export interface DraftResult {
  success: boolean;
  draftText: string;
  noticeType: string;
  generatedAt: string;
  suggestions?: string[];
}

interface UseDraftNoticeResult {
  generateDraft: (notice: NoticeBase) => Promise<DraftResult | null>;
  draftResult: DraftResult | null;
  isGenerating: boolean;
  error: string | null;
  clearDraft: () => void;
}

/**
 * Hook to generate draft notice text from NoticeBase data
 *
 * Usage:
 * const { generateDraft, draftResult, isGenerating, error } = useDraftNotice();
 *
 * // Call when you have a NoticeBase
 * await generateDraft(notice);
 *
 * // Access the generated text
 * draftResult?.draftText
 */
export function useDraftNotice(): UseDraftNoticeResult {
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDraft = useCallback(async (notice: NoticeBase): Promise<DraftResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/drafting/from-notice-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notice),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate draft');
      }

      const result: DraftResult = await response.json();
      setDraftResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate draft';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearDraft = useCallback(() => {
    setDraftResult(null);
    setError(null);
  }, []);

  return {
    generateDraft,
    draftResult,
    isGenerating,
    error,
    clearDraft,
  };
}
