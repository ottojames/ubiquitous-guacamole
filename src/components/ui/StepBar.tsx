import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

type Step = { key: string; label: string; href: string };

export function StepBar({ steps }: { steps: Step[] }) {
  const { pathname } = useLocation();
  return (
    <ol className="flex flex-wrap items-center gap-3 text-sm">
      {steps.map((s, i) => {
        const active = pathname.endsWith('/' + s.key) || (s.key === 'type' && pathname.endsWith('/publish'));
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border'}`}>
              {i + 1}
            </span>
            <Link to={s.href} className={`hover:underline ${active ? 'font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </Link>
            {i < steps.length - 1 && <span className="mx-2 text-muted-foreground">/</span>}
          </li>
        );
      })}
    </ol>
  );
}
export default StepBar;
