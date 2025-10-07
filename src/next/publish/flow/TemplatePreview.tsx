import React from 'react';
import * as UI from '@/styles/ui';

function parseTemplateText(text: string) {
  const normalised = text.replace(/\r\n/g, '\n').trim();
  const lines = normalised ? normalised.split('\n') : [];
  const heading = lines[0]?.trim() ?? '';
  const subheading = lines[1]?.trim() ?? '';
  const bodyLines = lines.slice(2);

  type Block = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };
  const blocks: Block[] = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length) {
      const textValue = currentParagraph.join(' ');
      blocks.push({ type: 'paragraph', text: textValue });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length) {
      blocks.push({ type: 'list', items: currentList });
      currentList = [];
    }
  };

  for (const rawLine of bodyLines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('•')) {
      flushParagraph();
      currentList.push(line.replace(/^•\s*/, ''));
      continue;
    }
    flushList();
    currentParagraph.push(line);
  }
  flushParagraph();
  flushList();

  return { heading, subheading, blocks };
}

export type TemplatePreviewProps = {
  text: string;
};

export default function TemplatePreview({ text }: TemplatePreviewProps) {
  const [copied, setCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);
  const hasContent = text.trim().length > 0;
  const { heading, subheading, blocks } = React.useMemo(() => parseTemplateText(text), [text]);

  const handleCopy = React.useCallback(async () => {
    if (!hasContent || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [hasContent, text]);

  const handleDownload = React.useCallback(() => {
    if (!hasContent) return;
    const blob = new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'notice-preview.txt';
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  }, [hasContent, text]);

  if (!hasContent) {
    return (
      <div className="p-6 text-sm text-neutral-600" data-testid="template-preview-empty">
        Preview will appear here once you complete the required fields.
      </div>
    );
  }

  return (
    <div className={`${UI.card} ${UI.cardHover} relative space-y-5 p-5`} data-testid="template-preview">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Preview</h3>
          <p className="text-xs text-neutral-500">Generated from template details</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${UI.btnSecondary} h-9 px-3 text-xs`}
            onClick={handleCopy}
            disabled={!hasContent}
          >
            {copied ? 'Copied' : 'Copy text'}
          </button>
          <button
            type="button"
            className={`${UI.btnSecondary} h-9 px-3 text-xs`}
            onClick={handleDownload}
            disabled={!hasContent}
          >
            {downloaded ? 'Downloaded' : 'Download'}
          </button>
        </div>
      </div>
      <article className="space-y-4">
        {heading && (
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900" data-testid="template-preview-heading">
            {heading}
          </h1>
        )}
        {subheading && (
          <h2 className="text-base font-semibold text-neutral-800" data-testid="template-preview-subheading">
            {subheading}
          </h2>
        )}
        <div className="space-y-4 text-sm leading-6 text-neutral-800">
          {blocks.map((block, index) => {
            if (block.type === 'list') {
              return (
                <ul key={`block-${index}`} className="list-disc space-y-1 pl-5 text-sm">
                  {block.items.map((item, itemIndex) => (
                    <li key={`block-${index}-item-${itemIndex}`}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={`block-${index}`} className="whitespace-pre-line">
                {block.text}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}
