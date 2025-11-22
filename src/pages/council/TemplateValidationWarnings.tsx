/**
 * TemplateValidationWarnings Component
 *
 * Real-time validation display for template text.
 * Shows:
 * - Red error alert for missing required placeholders
 * - Yellow warning for missing statutory clauses
 * - Green success when fully validated
 */

import { useMemo } from 'react';
import { validateTemplatePlaceholders } from '@/next/publish/config/placeholders';

interface TemplateValidationWarningsProps {
  /** Template text to validate */
  templateText: string;

  /** Notice type for validation rules */
  noticeType: string;

  /** Optional class name */
  className?: string;
}

export default function TemplateValidationWarnings({
  templateText,
  noticeType,
  className = '',
}: TemplateValidationWarningsProps) {
  // Perform validation
  const validation = useMemo(() => {
    if (!templateText || templateText.trim().length === 0) {
      return {
        isValid: false,
        missingRequired: [],
        warnings: ['Template text is empty'],
      };
    }

    return validateTemplatePlaceholders(templateText, noticeType);
  }, [templateText, noticeType]);

  const { isValid, missingRequired, warnings } = validation;

  // Don't show anything if template is empty (avoid noise)
  if (!templateText || templateText.trim().length === 0) {
    return null;
  }

  // Success state - all validated
  if (isValid && warnings.length === 0) {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-900 mb-1">
              Template Validated
            </h3>
            <p className="text-sm text-green-800">
              All required placeholders are present and the template is ready to
              use.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - missing required placeholders
  if (missingRequired.length > 0) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-2">
              Missing Required Placeholders
            </h3>
            <p className="text-sm text-red-800 mb-3">
              Your template must include the following placeholders for legal
              compliance:
            </p>
            <ul className="space-y-2">
              {missingRequired.map(token => (
                <li
                  key={token}
                  className="flex items-center gap-2 text-sm text-red-800"
                >
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  <code className="font-mono bg-red-100 px-2 py-1 rounded">
                    {`{{${token}}}`}
                  </code>
                </li>
              ))}
            </ul>
            {warnings.length > 0 && (
              <>
                <div className="mt-4 pt-4 border-t border-red-300">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">
                    Additional Warnings
                  </h4>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-red-800"
                      >
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Warning state - all required present but has other warnings
  if (warnings.length > 0) {
    return (
      <div
        className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              Template Warnings
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Your template is functional but has some recommendations:
            </p>
            <ul className="space-y-2">
              {warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-amber-800"
                >
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
