/**
 * Representation Analyzer Service
 *
 * Analyzes representation text to extract key themes, sentiment,
 * licensing objectives mentioned, and provides a summary for council officers.
 */

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
  confidence: number; // 0-1
  keywords: string[];
}

export interface AnalysisResult {
  representationId?: string;
  stance: RepresentationStance;
  stanceConfidence: number; // 0-1
  themes: Theme[];
  licensingObjectives: LicensingObjective[];
  summary: string;
  wordCount: number;
  sentenceCount: number;
  analyzedAt: string;
}

// UK Licensing Act 2003 - Four Licensing Objectives
const LICENSING_OBJECTIVES = [
  {
    id: 'crime-disorder',
    name: 'Prevention of Crime and Disorder',
    keywords: ['crime', 'disorder', 'violence', 'antisocial', 'anti-social', 'trouble', 'fighting', 'drugs', 'vandalism', 'theft', 'assault', 'police', 'criminal'],
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    keywords: ['safety', 'fire', 'hazard', 'emergency', 'exit', 'capacity', 'overcrowding', 'dangerous', 'risk', 'accident', 'injury', 'health'],
  },
  {
    id: 'public-nuisance',
    name: 'Prevention of Public Nuisance',
    keywords: ['noise', 'nuisance', 'disturbance', 'loud', 'music', 'litter', 'smell', 'odour', 'parking', 'traffic', 'congestion', 'sleep', 'late', 'hours', 'quiet'],
  },
  {
    id: 'child-protection',
    name: 'Protection of Children from Harm',
    keywords: ['children', 'child', 'minor', 'underage', 'young', 'school', 'family', 'protection', 'safeguarding', 'youth'],
  },
];

// Common themes in representations
const COMMON_THEMES = [
  { id: 'noise', name: 'Noise Concerns', keywords: ['noise', 'loud', 'music', 'sound', 'disturbance', 'quiet', 'peace'] },
  { id: 'hours', name: 'Operating Hours', keywords: ['hours', 'late', 'night', 'closing', 'opening', 'midnight', 'early'] },
  { id: 'parking', name: 'Parking/Traffic', keywords: ['parking', 'traffic', 'cars', 'vehicles', 'congestion', 'road'] },
  { id: 'antisocial', name: 'Antisocial Behaviour', keywords: ['antisocial', 'anti-social', 'behaviour', 'behavior', 'drunk', 'rowdy'] },
  { id: 'litter', name: 'Litter/Waste', keywords: ['litter', 'rubbish', 'waste', 'bins', 'mess', 'dirty'] },
  { id: 'saturation', name: 'Area Saturation', keywords: ['enough', 'many', 'saturation', 'already', 'another', 'too many'] },
  { id: 'community', name: 'Community Impact', keywords: ['community', 'residents', 'neighbourhood', 'neighborhood', 'local', 'area'] },
  { id: 'positive', name: 'Positive Contribution', keywords: ['welcome', 'benefit', 'improve', 'positive', 'good', 'support', 'enhance'] },
];

// Stance detection keywords
const STANCE_KEYWORDS = {
  support: ['support', 'favour', 'favor', 'welcome', 'positive', 'benefit', 'good idea', 'approve', 'agree', 'endorse'],
  objection: ['object', 'oppose', 'against', 'concern', 'worried', 'reject', 'refuse', 'disagree', 'complaint', 'problem'],
};

/**
 * Analyzes a representation text and extracts key information
 */
export function analyzeRepresentation(
  text: string,
  statedStance?: RepresentationStance,
  representationId?: string
): AnalysisResult {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Determine stance if not provided
  let stance: RepresentationStance = statedStance || 'comment';
  let stanceConfidence = statedStance ? 0.95 : 0.5;

  if (!statedStance) {
    const supportScore = STANCE_KEYWORDS.support.filter(k => lowerText.includes(k)).length;
    const objectionScore = STANCE_KEYWORDS.objection.filter(k => lowerText.includes(k)).length;

    if (supportScore > objectionScore && supportScore > 0) {
      stance = 'support';
      stanceConfidence = Math.min(0.9, 0.5 + supportScore * 0.1);
    } else if (objectionScore > supportScore && objectionScore > 0) {
      stance = 'objection';
      stanceConfidence = Math.min(0.9, 0.5 + objectionScore * 0.1);
    }
  }

  // Detect themes
  const themes: Theme[] = COMMON_THEMES.map(theme => {
    const matchedKeywords = theme.keywords.filter(k => lowerText.includes(k));
    const confidence = Math.min(1, matchedKeywords.length / 3);
    return {
      id: theme.id,
      name: theme.name,
      confidence,
      keywords: matchedKeywords,
    };
  }).filter(t => t.confidence > 0).sort((a, b) => b.confidence - a.confidence);

  // Check licensing objectives
  const licensingObjectives: LicensingObjective[] = LICENSING_OBJECTIVES.map(obj => {
    const matchedKeywords = obj.keywords.filter(k => lowerText.includes(k));
    const mentioned = matchedKeywords.length > 0;

    // Find relevant sentence if mentioned
    let relevantText: string | undefined;
    if (mentioned) {
      const relevantSentence = sentences.find(s =>
        matchedKeywords.some(k => s.toLowerCase().includes(k))
      );
      if (relevantSentence) {
        relevantText = relevantSentence.trim().substring(0, 200);
      }
    }

    return {
      id: obj.id,
      name: obj.name,
      mentioned,
      relevantText,
    };
  });

  // Generate summary
  const summary = generateSummary(text, stance, themes, licensingObjectives);

  return {
    representationId,
    stance,
    stanceConfidence,
    themes,
    licensingObjectives,
    summary,
    wordCount: words.length,
    sentenceCount: sentences.length,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generates a brief summary of the representation
 */
function generateSummary(
  text: string,
  stance: RepresentationStance,
  themes: Theme[],
  objectives: LicensingObjective[]
): string {
  const stanceLabel = stance === 'support' ? 'supports' : stance === 'objection' ? 'objects to' : 'comments on';

  const mentionedObjectives = objectives.filter(o => o.mentioned);
  const topThemes = themes.slice(0, 3);

  let summary = `This representation ${stanceLabel} the application`;

  if (topThemes.length > 0) {
    const themeNames = topThemes.map(t => t.name.toLowerCase());
    summary += `, citing concerns about ${themeNames.join(', ')}`;
  }

  if (mentionedObjectives.length > 0) {
    const objectiveNames = mentionedObjectives.map(o => o.name);
    summary += `. References licensing objective(s): ${objectiveNames.join(', ')}`;
  } else {
    summary += '.';
  }

  return summary;
}

/**
 * Analyzes multiple representations and returns aggregate insights
 */
export function analyzeMultiple(
  representations: Array<{ id: string; text: string; type?: RepresentationStance }>
): {
  analyses: AnalysisResult[];
  aggregate: {
    total: number;
    supportCount: number;
    objectionCount: number;
    commentCount: number;
    topThemes: Array<{ id: string; name: string; count: number }>;
    objectivesCited: Array<{ id: string; name: string; count: number }>;
  };
} {
  const analyses = representations.map(rep =>
    analyzeRepresentation(rep.text, rep.type, rep.id)
  );

  // Aggregate theme counts
  const themeCounts = new Map<string, { name: string; count: number }>();
  const objectiveCounts = new Map<string, { name: string; count: number }>();

  analyses.forEach(analysis => {
    analysis.themes.forEach(theme => {
      const existing = themeCounts.get(theme.id);
      if (existing) {
        existing.count++;
      } else {
        themeCounts.set(theme.id, { name: theme.name, count: 1 });
      }
    });

    analysis.licensingObjectives.filter(o => o.mentioned).forEach(obj => {
      const existing = objectiveCounts.get(obj.id);
      if (existing) {
        existing.count++;
      } else {
        objectiveCounts.set(obj.id, { name: obj.name, count: 1 });
      }
    });
  });

  const topThemes = Array.from(themeCounts.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count);

  const objectivesCited = Array.from(objectiveCounts.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    analyses,
    aggregate: {
      total: analyses.length,
      supportCount: analyses.filter(a => a.stance === 'support').length,
      objectionCount: analyses.filter(a => a.stance === 'objection').length,
      commentCount: analyses.filter(a => a.stance === 'comment').length,
      topThemes,
      objectivesCited,
    },
  };
}
