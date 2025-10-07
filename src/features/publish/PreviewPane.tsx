import * as React from 'react';

type Props = {
  html?: string;
  children?: React.ReactNode;
};

export default function PreviewPane({ html, children }: Props) {
  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="prose prose-sm md:prose max-w-none text-foreground">
        {html ? (
          // TODO: Sanitize HTML before rendering once the template pipeline is wired up.
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
