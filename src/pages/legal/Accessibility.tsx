import { Link } from 'react-router-dom';
import * as UI from '@/styles/ui';
import Footer from '@/components/Footer';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Accessibility() {
  return (
    <div className={`${UI.pageWrap} min-h-screen bg-slate-50 flex flex-col`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg bg-white/80">
        <div className={`${UI.container} h-16`}>
          <div className="h-full flex items-center justify-between">
            <Link to="/" className="flex items-center text-slate-900 font-extrabold tracking-tight text-xl">
              CivicNotices
            </Link>
            <Link to="/" className={`${UI.btnSecondary} h-9 py-0 text-sm`}>
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className={`${UI.container} max-w-4xl`}>
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Accessibility Statement</h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: October 2025</p>

            <div className="prose prose-slate max-w-none">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
                <p className="text-slate-700 font-medium">
                  This is a placeholder page. The full Accessibility Statement will be published before the platform goes live.
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Commitment</h2>
                <p className="text-slate-700 mb-4">
                  CivicNotices is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Conformance Status</h2>
                <p className="text-slate-700 mb-4">
                  We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Implemented Features</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>Semantic HTML structure</li>
                        <li>Keyboard navigation support</li>
                        <li>Screen reader compatibility</li>
                        <li>Skip-to-main-content link</li>
                        <li>Sufficient color contrast ratios</li>
                        <li>Alternative text for images</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">In Progress</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>Full ARIA landmark implementation</li>
                        <li>Form validation and error messaging</li>
                        <li>PDF accessibility improvements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Technical Specifications</h2>
                <p className="text-slate-700 mb-4">
                  Accessibility of CivicNotices relies on the following technologies:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li>HTML5</li>
                  <li>WAI-ARIA</li>
                  <li>CSS3</li>
                  <li>JavaScript (with graceful degradation)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Limitations and Alternatives</h2>
                <p className="text-slate-700">
                  Despite our best efforts to ensure accessibility, some limitations may exist. If you encounter any barriers, please contact us and we will provide alternative formats or assistance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Feedback and Contact</h2>
                <p className="text-slate-700 mb-4">
                  We welcome your feedback on the accessibility of CivicNotices. Please let us know if you encounter any accessibility barriers.
                </p>
                <p className="text-slate-700">
                  Contact us at{' '}
                  <a href="mailto:accessibility@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">
                    accessibility@civicnotices.uk
                  </a>
                </p>
                <p className="text-slate-700 mt-4 text-sm">
                  We aim to respond to accessibility feedback within 5 business days.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
