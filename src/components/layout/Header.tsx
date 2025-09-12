import React from 'react';
import SiteHeader from '../SiteHeader';

export default function Header() {
  const onPublish = typeof window !== 'undefined' ? window.location.pathname.startsWith('/publish') : true;
  const variant = onPublish ? 'bg-white text-slate-900' : 'bg-transparent text-white';
  return (
    <header className={`sticky top-0 z-50 ${variant}`}>
      <SiteHeader />
    </header>
  );
}
