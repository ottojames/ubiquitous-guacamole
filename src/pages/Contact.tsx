import { Link } from 'react-router-dom';
import * as UI from '@/styles/ui';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Contact() {
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
        <div className={`${UI.container} max-w-5xl`}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Contact Us</h1>
            <p className="text-xl text-slate-600">
              Get in touch with our team. We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Get in Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Email</p>
                    <a href="mailto:hello@civicnotices.uk" className="text-blue-600 hover:text-blue-700">
                      hello@civicnotices.uk
                    </a>
                    <p className="text-sm text-slate-500 mt-1">For general inquiries</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Support</p>
                    <a href="mailto:support@civicnotices.uk" className="text-blue-600 hover:text-blue-700">
                      support@civicnotices.uk
                    </a>
                    <p className="text-sm text-slate-500 mt-1">For technical support</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Phone</p>
                    <p className="text-slate-700">Coming soon</p>
                    <p className="text-sm text-slate-500 mt-1">Available during business hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Business Hours</p>
                    <p className="text-slate-700">Monday - Friday</p>
                    <p className="text-slate-700">9:00 AM - 5:00 PM GMT</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Address</p>
                    <p className="text-slate-700">London, United Kingdom</p>
                    <p className="text-sm text-slate-500 mt-1">Full address available soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Placeholder */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send a Message</h2>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                <p className="text-slate-700 font-medium mb-2">
                  Contact form coming soon
                </p>
                <p className="text-sm text-slate-600">
                  In the meantime, please reach out via email at{' '}
                  <a href="mailto:hello@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">
                    hello@civicnotices.uk
                  </a>
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-slate-900">What to include in your message:</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Your name and organization (if applicable)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Nature of your inquiry (support, sales, partnership, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>A brief description of your question or issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Preferred contact method for our response</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              Looking for quick answers? Check our documentation for common questions.
            </p>
            <Link to="/docs" className={`${UI.btnPrimary} inline-flex items-center gap-2 px-6 py-3`}>
              View Documentation
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
