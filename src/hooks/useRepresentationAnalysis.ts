/**
 * Hook for fetching representation analysis from the API
 */

import { useState, useCallback } from 'react';

export type RepresentationStance = 'support' | 'objection' | 'comment';

export interface LicensingObjective {
  id: string;
  name: string;
  mentioned: boolean;
  relevantText?: string;
}

export interface Theme {
  id: string;
  name: string;
  confidence: number;
  keywords: string[];
}

export interface AnalysisResult {
  representationId?: string;
  stance: RepresentationStance;
  stanceConfidence: number;
  themes: Theme[];
  licensingObjectives: LicensingObjective[];
  summary: string;
  wordCount: number;
  sentenceCount: number;
  analyzedAt: string;
}

interface UseRepresentationAnalysisReturn {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyzeRepresentation: (text: string, statedStance?: RepresentationStance, representationId?: string) => Promise<void>;
  clearAnalysis: () => void;
}

export function useRepresentationAnalysis(): UseRepresentationAnalysisReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRepresentation = useCallback(async (
    text: string,
    statedStance?: RepresentationStance,
    representationId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/representation-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          statedStance,
          representationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze representation');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeRepresentation,
    clearAnalysis,
  };
}
