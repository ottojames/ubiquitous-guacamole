/**
 * TemplatePreview Component
 *
 * Renders a live preview of a notice template with placeholder substitution.
 * Shows example values for placeholders and highlights substituted content.
 *
 * Features:
 * - Real-time placeholder substitution with example values
 * - Visual highlighting of substituted placeholders
 * - Warning for unknown/unrecognized placeholders
 * - Empty state guidance
 */

import { useMemo } from 'react';
import {
  getPlaceholdersForNoticeType,
  type PlaceholderDefinition,
} from '@/next/publish/config/placeholders';

interface TemplatePreviewProps {
  /** The template text (may contain HTML from contentEditable) */
  templateText: string;

  /** Notice type to determine available placeholders */
  noticeType: string;

  /** Optional class name for styling */
  className?: string;
}

/**
 * Build a map of placeholder tokens to their example values
 */
function buildExampleValueMap(
  placeholders: PlaceholderDefinition[]
): Record<string, string> {
  return placeholders.reduce(
    (map, p) => ({
      ...map,
      [p.token]: p.example,
    }),
    {} as Record<string, string>
  );
}

/**
 * Find all placeholder tokens in the template text
 */
function findAllPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{([A-Z_]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Substitute placeholders with their example values and wrap in highlight spans
 */
function substitutePlaceholders(
  text: string,
  exampleValues: Record<string, string>,
  knownTokens: Set<string>
): string {
  // Replace each {{TOKEN}} with highlighted example value or warning span
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (match, token: string) => {
    const exampleValue = exampleValues[token];

    if (exampleValue) {
      // Known placeholder - show example value with blue highlight
      return `<span class="template-preview-placeholder bg-blue-50 text-blue-800 px-1 rounded border border-blue-200" title="{{${token}}}">${exampleValue}</span>`;
    } else if (knownTokens.has(token)) {
      // Token is known but has no example (use token name as fallback)
      return `<span class="template-preview-placeholder bg-blue-50 text-blue-800 px-1 rounded border border-blue-200" title="{{${token}}}">[${token}]</span>`;
    } else {
      // Unknown placeholder - show warning styling
      return `<span class="template-preview-unknown bg-amber-50 text-amber-800 px-1 rounded border border-amber-300" title="Unknown placeholder: {{${token}}}">{{${token}}}</span>`;
    }
  });
}

export default function TemplatePreview({
  templateText,
  noticeType,
  className = '',
}: TemplatePreviewProps) {
  // Get placeholders for this notice type
  const placeholders = useMemo(
    () => getPlaceholdersForNoticeType(noticeType),
    [noticeType]
  );

  // Build example value map
  const exampleValues = useMemo(
    () => buildExampleValueMap(placeholders),
    [placeholders]
  );

  // Build set of known token names
  const knownTokens = useMemo(
    () => new Set(placeholders.map(p => p.token)),
    [placeholders]
  );

  // Find placeholders in the template
  const foundTokens = useMemo(
    () => findAllPlaceholders(templateText),
    [templateText]
  );

  // Identify unknown placeholders
  const unknownPlaceholders = useMemo(
    () => foundTokens.filter(token => !knownTokens.has(token)),
    [foundTokens, knownTokens]
  );

  // Substitute placeholders with example values
  const renderedContent = useMemo(() => {
    if (!templateText || templateText.trim() === '') {
      return '';
    }
    return substitutePlaceholders(templateText, exampleValues, knownTokens);
  }, [templateText, exampleValues, knownTokens]);

  // Check if template is empty (accounting for potential empty HTML tags)
  const isEmptyTemplate = useMemo(() => {
    if (!templateText) return true;
    // Strip HTML tags and check if there's any content
    const div = document.createElement('div');
    div.innerHTML = templateText;
    const text = div.textContent || div.innerText || '';
    return text.trim() === '';
  }, [templateText]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Live Preview</h3>
          <div className="relative group">
            <svg
              className="w-4 h-4 text-gray-400 cursor-help"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="mb-2">
                This preview shows how your template will look with example
                values.
              </p>
              <p>
                <span className="inline-block bg-blue-50 text-blue-800 px-1 rounded text-[10px] mr-1">
                  Blue highlights
                </span>
                indicate placeholder substitutions.
              </p>
            </div>
          </div>
        </div>

        {/* Unknown placeholder warning */}
        {unknownPlaceholders.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              {unknownPlaceholders.length} unknown placeholder
              {unknownPlaceholders.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white border border-t-0 border-gray-200 rounded-b-xl">
        {isEmptyTemplate ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Start typing to see preview
            </h4>
            <p className="text-sm text-gray-500 max-w-xs">
              Your template will appear here with example values substituted for
              placeholders.
            </p>
          </div>
        ) : (
          // Rendered preview
          <div
            className="prose prose-sm max-w-none font-mono text-sm leading-relaxed"
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </div>

      {/* Legend */}
      {!isEmptyTemplate && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 rounded-b-xl flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
            <span>Example values</span>
          </div>
          {unknownPlaceholders.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-amber-50 border border-amber-300 rounded" />
              <span>Unknown placeholders</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
