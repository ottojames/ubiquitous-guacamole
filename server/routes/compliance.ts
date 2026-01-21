import { Router } from 'express';
import { checkCompliance, checkNoticeBaseCompliance } from '../services/complianceChecker.js';
import type { NoticeDraft } from '../../src/types/notice';

const router = Router();

/**
 * POST /api/compliance/check
 * Validates a notice against UK statutory requirements
 *
 * Request body: Partial<NoticeDraft> with notice fields to validate
 * Response: ComplianceResult with passed, score, issues array
 */
router.post('/check', async (req, res) => {
  try {
    const notice = req.body as Partial<NoticeDraft>;

    if (!notice || Object.keys(notice).length === 0) {
      return res.status(400).json({ error: 'Notice data is required' });
    }

    const result = checkCompliance(notice);

    return res.json(result);
  } catch (error: any) {
    console.error('[compliance-check] Error:', error);
    return res.status(500).json({ error: 'Failed to check compliance' });
  }
});

/**
 * POST /api/compliance/check-base
 * Validates a NoticeBase format notice (used in wizard flow)
 *
 * Request body: NoticeBase with full notice structure
 * Response: ComplianceResult with passed, score, issues array
 */
router.post('/check-base', async (req, res) => {
  try {
    const notice = req.body;

    if (!notice || !notice.noticeType) {
      return res.status(400).json({ error: 'NoticeBase data with noticeType is required' });
    }

    const result = checkNoticeBaseCompliance(notice);

    return res.json(result);
  } catch (error: any) {
    console.error('[compliance-check-base] Error:', error);
    return res.status(500).json({ error: 'Failed to check compliance' });
  }
});

export default router;
