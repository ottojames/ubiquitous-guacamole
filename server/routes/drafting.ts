import { Router } from 'express';
import {
  generateDraft,
  generateDraftFromNoticeBase,
  generateDraftFromNoticeDraft,
  type DraftInput,
} from '../services/noticeDrafter.js';
import type { NoticeDraft } from '../../src/types/notice';

const router = Router();

/**
 * POST /api/drafting/generate
 * Generates draft notice text from explicit input fields
 *
 * Request body: DraftInput with noticeType, applicantName, premisesAddress, etc.
 * Response: DraftResult with success, draftText, noticeType, generatedAt, suggestions
 */
router.post('/generate', async (req, res) => {
  try {
    const input = req.body as DraftInput;

    if (!input || !input.noticeType) {
      return res.status(400).json({ error: 'DraftInput with noticeType is required' });
    }

    if (!input.applicantName) {
      return res.status(400).json({ error: 'applicantName is required' });
    }

    if (!input.premisesAddress) {
      return res.status(400).json({ error: 'premisesAddress is required' });
    }

    const result = generateDraft(input);

    return res.json(result);
  } catch (error: any) {
    console.error('[drafting-generate] Error:', error);
    return res.status(500).json({ error: 'Failed to generate draft' });
  }
});

/**
 * POST /api/drafting/from-notice-base
 * Generates draft notice text from NoticeBase format (wizard flow)
 *
 * Request body: NoticeBase with full notice structure
 * Response: DraftResult with success, draftText, noticeType, generatedAt, suggestions
 */
router.post('/from-notice-base', async (req, res) => {
  try {
    const notice = req.body;

    if (!notice || !notice.noticeType) {
      return res.status(400).json({ error: 'NoticeBase data with noticeType is required' });
    }

    const result = generateDraftFromNoticeBase(notice);

    return res.json(result);
  } catch (error: any) {
    console.error('[drafting-from-notice-base] Error:', error);
    return res.status(500).json({ error: 'Failed to generate draft' });
  }
});

/**
 * POST /api/drafting/from-draft
 * Generates draft notice text from NoticeDraft format (legacy flow)
 *
 * Request body: Partial<NoticeDraft> with notice fields
 * Response: DraftResult with success, draftText, noticeType, generatedAt, suggestions
 */
router.post('/from-draft', async (req, res) => {
  try {
    const draft = req.body as Partial<NoticeDraft>;

    if (!draft || Object.keys(draft).length === 0) {
      return res.status(400).json({ error: 'NoticeDraft data is required' });
    }

    const result = generateDraftFromNoticeDraft(draft);

    return res.json(result);
  } catch (error: any) {
    console.error('[drafting-from-draft] Error:', error);
    return res.status(500).json({ error: 'Failed to generate draft' });
  }
});

export default router;
