import React from 'react';
import SiteHeader from '../SiteHeader';

export default function Header() {
  const onPublish = typeof window !== 'undefined' ? window.location.pathname.startsWith('/publish') : true;
  // SiteHeader now manages sticky + compact visuals itself
  void onPublish; // suppress unused var if build strips code
  return <SiteHeader />;
}
