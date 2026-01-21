/**
 * Component to display representation analysis summary in council inbox
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Shield,
  Volume2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useRepresentationAnalysis, type AnalysisResult } from '@/hooks/useRepresentationAnalysis';

interface RepresentationAnalysisSummaryProps {
  representationId: string;
  representationText: string;
  statedStance?: 'support' | 'objection' | 'comment';
}

// Icon mapping for licensing objectives
const objectiveIcons: Record<string, typeof Shield> = {
  'crime-disorder': Shield,
  'public-safety': AlertTriangle,
  'public-nuisance': Volume2,
  'child-protection': Users,
};

export default function RepresentationAnalysisSummary({
  representationId,
  representationText,
  statedStance,
}: RepresentationAnalysisSummaryProps) {
  const { analysis, loading, error, analyzeRepresentation } = useRepresentationAnalysis();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (representationText && !analysis) {
      analyzeRepresentation(representationText, statedStance, representationId);
    }
  }, [representationId, representationText, statedStance, analysis, analyzeRepresentation]);

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
          <span className="text-sm text-purple-700">Analyzing representation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">Analysis unavailable</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const mentionedObjectives = analysis.licensingObjectives.filter(obj => obj.mentioned);
  const topThemes = analysis.themes.slice(0, 3);

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">AI Analysis Summary</span>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            {Math.round(analysis.stanceConfidence * 100)}% confident
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-purple-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-600" />
        )}
      </button>

      {/* Collapsed Summary */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-sm text-purple-800">{analysis.summary}</p>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-purple-200 pt-4">
          {/* Summary */}
          <div>
            <h5 className="text-xs font-medium text-purple-700 uppercase tracking-wider mb-1">Summary</h5>
            <p className="text-sm text-purple-900">{analysis.summary}</p>
          </div>

          {/* Themes */}
          {topThemes.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-purple-700 uppercase tracking-wider mb-2">Key Themes</h5>
              <div className="flex flex-wrap gap-2">
                {topThemes.map(theme => (
                  <span
                    key={theme.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    title={`Confidence: ${Math.round(theme.confidence * 100)}%`}
                  >
                    {theme.name}
                    <span className="ml-1 text-purple-500">
                      ({Math.round(theme.confidence * 100)}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Licensing Objectives */}
          {mentionedObjectives.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-purple-700 uppercase tracking-wider mb-2">
                Licensing Objectives Referenced
              </h5>
              <div className="space-y-2">
                {mentionedObjectives.map(obj => {
                  const Icon = objectiveIcons[obj.id] || Shield;
                  return (
                    <div
                      key={obj.id}
                      className="flex items-start gap-2 bg-white rounded-md p-2 border border-purple-100"
                    >
                      <Icon className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">{obj.name}</p>
                        {obj.relevantText && (
                          <p className="text-xs text-purple-600 mt-1 italic">
                            "{obj.relevantText}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-purple-600 pt-2 border-t border-purple-100">
            <span>{analysis.wordCount} words</span>
            <span>{analysis.sentenceCount} sentences</span>
            <span>Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
