import React, { useEffect, useState } from "react";

export interface ComplianceIssue {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  field?: string;
  suggestion?: string;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  issues: ComplianceIssue[];
  checkedAt: string;
}

interface ComplianceFeedbackProps {
  noticeData: Record<string, unknown>;
  useBaseEndpoint?: boolean;
}

/**
 * ComplianceFeedback component displays real-time compliance validation
 * for notices being created in the publish wizard.
 */
export default function ComplianceFeedback({
  noticeData,
  useBaseEndpoint = false,
}: ComplianceFeedbackProps) {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCompliance = async () => {
      if (!noticeData || Object.keys(noticeData).length === 0) {
        setResult(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = useBaseEndpoint
          ? "/api/compliance/check-base"
          : "/api/compliance/check";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noticeData),
        });

        if (!response.ok) {
          throw new Error("Failed to check compliance");
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Compliance check failed");
      } finally {
        setLoading(false);
      }
    };

    // Debounce the compliance check
    const timeoutId = setTimeout(checkCompliance, 500);
    return () => clearTimeout(timeoutId);
  }, [noticeData, useBaseEndpoint]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <span className="text-sm text-slate-600">Checking compliance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="text-sm text-amber-700">
            Unable to check compliance: {error}
          </span>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const errorCount = result.issues.filter((i) => i.severity === "error").length;
  const warningCount = result.issues.filter((i) => i.severity === "warning").length;
  const infoCount = result.issues.filter((i) => i.severity === "info").length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  const getSeverityStyles = (severity: ComplianceIssue["severity"]) => {
    switch (severity) {
      case "error":
        return {
          bg: "bg-rose-50",
          border: "border-rose-200",
          icon: "text-rose-500",
          text: "text-rose-800",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: "text-amber-500",
          text: "text-amber-800",
        };
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-500",
          text: "text-blue-800",
        };
    }
  };

  return (
    <div
      className="space-y-4"
      data-testid="compliance-feedback"
      aria-label="Compliance check results"
    >
      {/* Score Header */}
      <div
        className={`rounded-2xl border p-5 ${getScoreBgColor(result.score)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`text-3xl font-bold ${getScoreColor(result.score)}`}
            >
              {result.score}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Compliance Score
              </h3>
              <p className="text-xs text-slate-600">
                {result.passed
                  ? "Ready for publication"
                  : "Issues need attention"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </span>
            )}
            {infoCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {infoCount} note{infoCount !== 1 ? "s" : ""}
              </span>
            )}
            {result.passed && result.issues.length === 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                All checks passed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Issues List */}
      {result.issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Issues Found
          </h4>
          <ul className="space-y-2" role="list">
            {result.issues.map((issue, idx) => {
              const styles = getSeverityStyles(issue.severity);
              return (
                <li
                  key={`${issue.code}-${idx}`}
                  className={`rounded-xl border p-4 ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${styles.icon}`}>
                      {issue.severity === "error" && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {issue.severity === "warning" && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {issue.severity === "info" && (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm font-medium ${styles.text}`}>
                        {issue.message}
                      </p>
                      {issue.suggestion && (
                        <p className="text-xs text-slate-600">
                          {issue.suggestion}
                        </p>
                      )}
                      {issue.field && (
                        <p className="text-xs text-slate-500">
                          Field: <code className="rounded bg-slate-200/50 px-1 py-0.5 font-mono">{issue.field}</code>
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
