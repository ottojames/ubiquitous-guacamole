import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as UI from '@/styles/ui';
import { FileText, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '@/config/navigation';

// Simple analytics stub to mirror Home page behaviour
function track(event: string, payload: Record<string, unknown> = {}) {
  console.log('[analytics]', event, payload);
}

export default function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle anchor links that need to work from any page
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Check if this is a hash link to the home page (e.g., /#for-councils)
    if (href.startsWith('/#')) {
      e.preventDefault();
      const hash = href.slice(1); // Get "#for-councils"
      const elementId = hash.slice(1); // Get "for-councils"

      if (location.pathname === '/') {
        // Already on home page - smooth scroll to the element
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Navigate to home page with hash using window.location for proper page load
        // This ensures the Home page's useEffect runs and scrolls to the hash
        window.location.href = '/' + hash;
      }
    }
  }, [location.pathname]);

  // Hysteresis-free compact mode using IntersectionObserver on a sentinel
  useEffect(() => {
    const sentinel = document.getElementById('header-sentinel');
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setCompact(!e.isIntersecting);
      },
      { rootMargin: '0px 0px 0px 0px', threshold: 1 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10"
      style={{
        height: 'var(--headerH)',
        background: 'linear-gradient(112deg, #d5dde8 0%, #e8ecf4 50%, #f4f6f9 100%)',
      }}
    >
      <div className={`${UI.container} h-full`}>
        <div className="h-full flex items-center justify-between">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center text-slate-900 font-extrabold tracking-tight" style={{ letterSpacing: '-0.5px' }}>
              <span className={`transition-all ${compact ? 'text-lg' : 'text-xl'}`}>CivicNotices</span>
            </a>
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm text-slate-600 hover:text-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right: ghost + primary */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className={`text-sm ${UI.btnSecondary} h-9 py-0`}>Sign in</a>
            <a href="/publish" onClick={() => track('publish_started', { audience: 'public' })} className={`${UI.btnPrimary} h-11 py-0 text-sm`}>
              Publish a notice
            </a>
          </div>

          {/* Mobile: Publish stays visible + hamburger for sheet */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href="/publish"
              onClick={() => track('publish_started', { audience: 'public' })}
              className={`${UI.btnPrimary} h-10 py-0 text-sm`}
              aria-label="Publish a notice"
            >
              <FileText className="w-4 h-4 mr-1" aria-hidden="true" /> Publish
            </a>
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="h-9 w-9 grid place-items-center rounded-lg ring-1 ring-slate-300 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href);
                    setMobileOpen(false);
                  }}
                  className="text-base text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex items-center gap-3">
              <a href="/login" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>Sign in</a>
              <a href="/publish" onClick={() => { setMobileOpen(false); track('publish_started', { audience: 'public' }); }} className={`${UI.btnPrimary} h-11 py-0 text-sm`}>
                Publish a notice
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
