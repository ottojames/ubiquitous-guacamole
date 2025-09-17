import * as React from 'react';
import { createPortal } from 'react-dom';

export function InPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const elRef = React.useRef<HTMLElement | null>(null);

  if (!elRef.current) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '0';
    el.style.height = '0';
    el.style.zIndex = '9999';
    elRef.current = el;
  }

  React.useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    setMounted(true);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return mounted ? createPortal(children, elRef.current!) : null;
}
