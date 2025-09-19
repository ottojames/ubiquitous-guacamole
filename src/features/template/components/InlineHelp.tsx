import React from 'react';

export default function InlineHelp({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <p id={id} className="mt-1 text-sm text-slate-600">
      {children}
    </p>
  );
}
