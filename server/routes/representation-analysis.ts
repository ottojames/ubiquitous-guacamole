import { Router } from 'express';
import {
  analyzeRepresentation,
  analyzeMultiple,
  type RepresentationStance,
} from '../services/representationAnalyzer.js';

const router = Router();

/**
 * POST /api/representation-analysis/analyze
 * Analyzes a single representation text
 *
 * Request body: { text: string, stance?: RepresentationStance, representationId?: string }
 * Response: AnalysisResult with stance, themes, licensingObjectives, summary, etc.
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, stance, representationId } = req.body as {
      text: string;
      stance?: RepresentationStance;
      representationId?: string;
    };

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ error: 'text cannot be empty' });
    }

    const result = analyzeRepresentation(text, stance, representationId);

    return res.json(result);
  } catch (error: any) {
    console.error('[representation-analysis-analyze] Error:', error);
    return res.status(500).json({ error: 'Failed to analyze representation' });
  }
});

/**
 * POST /api/representation-analysis/analyze-multiple
 * Analyzes multiple representations and returns aggregate insights
 *
 * Request body: { representations: Array<{ id: string, text: string, type?: RepresentationStance }> }
 * Response: { analyses: AnalysisResult[], aggregate: { total, supportCount, objectionCount, commentCount, topThemes, objectivesCited } }
 */
router.post('/analyze-multiple', async (req, res) => {
  try {
    const { representations } = req.body as {
      representations: Array<{ id: string; text: string; type?: RepresentationStance }>;
    };

    if (!representations || !Array.isArray(representations)) {
      return res.status(400).json({ error: 'representations array is required' });
    }

    if (representations.length === 0) {
      return res.status(400).json({ error: 'representations array cannot be empty' });
    }

    // Validate each representation has required fields
    for (let i = 0; i < representations.length; i++) {
      const rep = representations[i];
      if (!rep.id || typeof rep.id !== 'string') {
        return res.status(400).json({ error: `representations[${i}].id is required and must be a string` });
      }
      if (!rep.text || typeof rep.text !== 'string') {
        return res.status(400).json({ error: `representations[${i}].text is required and must be a string` });
      }
    }

    const result = analyzeMultiple(representations);

    return res.json(result);
  } catch (error: any) {
    console.error('[representation-analysis-analyze-multiple] Error:', error);
    return res.status(500).json({ error: 'Failed to analyze representations' });
  }
});

export default router;
