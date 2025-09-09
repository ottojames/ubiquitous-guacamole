import React, { useEffect, useState } from 'react';
import { FileText, Menu, X } from 'lucide-react';

// Simple analytics stub to mirror Home page behaviour
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log('[analytics]', event, payload);
}

export default function SiteHeader() {
  const [compactNav, setCompactNav] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompactNav(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 transition-[height] ${compactNav ? 'h-14' : 'h-[72px]'}`}>
        <div className="h-full flex items-center justify-between">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center text-slate-900 font-extrabold tracking-tight" style={{ letterSpacing: '-0.5px' }}>
              <span className={`transition-all ${compactNav ? 'text-lg' : 'text-xl'}`}>CivicNotices</span>
            </a>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { href: '/#notices', label: 'Find notices' },
                { href: '/#for-councils', label: 'For councils' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/#docs', label: 'Docs' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-600 hover:text-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right: ghost + primary */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/#signin"
              className="h-9 px-3 rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
            >
              Sign in
            </a>
            <a
              href="/publish"
              onClick={() => track('publish_started', { audience: 'public' })}
              className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
            >
              Publish a notice
            </a>
          </div>

          {/* Mobile: Publish stays visible + hamburger for sheet */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href="/publish"
              onClick={() => track('publish_started', { audience: 'public' })}
              className="h-10 px-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
              aria-label="Publish a notice"
            >
              <FileText className="w-4 h-4 mr-1" aria-hidden="true" /> Publish
            </a>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">CivicNotices</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-4">
              {[
                { href: '/#notices', label: 'Find notices' },
                { href: '/#for-councils', label: 'For councils' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/#docs', label: 'Docs' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2 rounded px-1 py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex items-center gap-3">
              <a
                href="/#signin"
                className="h-9 px-3 rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
              >
                Sign in
              </a>
              <a
                href="/publish"
                onClick={() => { setMobileOpen(false); track('publish_started', { audience: 'public' }); }}
                className="h-11 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 ring-offset-2"
              >
                Publish a notice
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

