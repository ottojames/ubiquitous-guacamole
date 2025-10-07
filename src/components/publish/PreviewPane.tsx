import React from 'react';
import { AlertTriangle } from 'lucide-react';

type DomainHosts = {
  provided: string;
  directory: string;
};

type PreviewPaneProps = {
  text?: string | null;
  html?: string | null;
  authorityURL?: string | null;
  councilDirectoryURL?: string | null;
  domainMismatch?: boolean;
  domainMismatchHosts?: DomainHosts | null;
};

function stripHtml(markup: string): string {
  return markup
    .replace(/<\s*br\s*\/?>(\s|$)/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PreviewPane({
  text,
  html,
  authorityURL,
  councilDirectoryURL,
  domainMismatch,
  domainMismatchHosts,
}: PreviewPaneProps) {
  const fallbackText = React.useMemo(() => {
    if (text && text.trim()) return text;
    if (html && html.trim()) return stripHtml(html);
    return '';
  }, [html, text]);

  const previewMarkup = React.useMemo(() => {
    if (html && html.trim()) return html;
    return null;
  }, [html]);

  const noticePlaceholder = '/* OCR or generated text will appear here */';

  const copyText = fallbackText || noticePlaceholder;
  const handleCopy = React.useCallback(async () => {
    if (!fallbackText) return;
    try {
      await navigator.clipboard?.writeText(fallbackText);
    } catch {
      /* ignore clipboard failures */
    }
  }, [fallbackText]);

  const handleDownload = React.useCallback(() => {
    if (!fallbackText) return;
    const blob = new Blob([fallbackText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'notice.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [fallbackText]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
      <div className="mb-2 text-sm text-slate-600">Preview (read-only)</div>
      {previewMarkup ? (
        <div
          className="prose prose-sm max-w-none rounded-lg border border-slate-200 bg-white p-4 text-slate-900"
          dangerouslySetInnerHTML={{ __html: previewMarkup }}
          aria-live="polite"
        />
      ) : (
        <pre
          className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 font-serif text-[15px] leading-7 text-slate-900"
          aria-live="polite"
        >
          {fallbackText || noticePlaceholder}
        </pre>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {authorityURL && (
          <span>
            <span className="font-medium text-slate-800">Authority URL:</span>{' '}
            <span data-testid="preview-authority-url">{authorityURL}</span>
          </span>
        )}
        {councilDirectoryURL && (
          <span>
            <span className="font-medium text-slate-800">Council directory:</span>{' '}
            <span data-testid="preview-directory-url">{councilDirectoryURL}</span>
          </span>
        )}
        {domainMismatch && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800"
            role="status"
            aria-live="polite"
            data-testid="confirm-domain-warning"
          >
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Authority URL doesn’t match the council directory domain.
            {domainMismatchHosts && (
              <span className="sr-only">
                {' '}
                Provided host {domainMismatchHosts.provided}; directory host {domainMismatchHosts.directory}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleCopy}
          disabled={!fallbackText}
        >
          Copy text
        </button>
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleDownload}
          disabled={!fallbackText}
        >
          Download .txt
        </button>
      </div>
    </div>
  );
}
