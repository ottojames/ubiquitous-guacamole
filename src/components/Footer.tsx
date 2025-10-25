import * as UI from '@/styles/ui';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className={`${UI.container}`}>
        <div className="flex flex-col gap-8">
          {/* Main links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <a href="/about" className="transition hover:text-slate-900">
              About
            </a>
            <a href="/privacy" className="transition hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="/terms" className="transition hover:text-slate-900">
              Terms of Service
            </a>
            <a href="/accessibility" className="transition hover:text-slate-900">
              Accessibility Statement
            </a>
            <a href="/contact" className="transition hover:text-slate-900">
              Contact
            </a>
            <a href="/docs" className="transition hover:text-slate-900">
              Documentation
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} CivicNotices. Modernising statutory notices for the digital age.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
