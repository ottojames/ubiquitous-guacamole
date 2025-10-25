import { Link } from 'react-router-dom';
import * as UI from '@/styles/ui';
import Footer from '@/components/Footer';

export default function Terms() {
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: October 2025</p>

            <div className="prose prose-slate max-w-none space-y-8">
              <section>
                <p className="text-lg text-slate-700 leading-relaxed">
                  These Terms of Service ("Terms") govern your use of the CivicNotices platform. By accessing or using our service, you agree to be bound by these Terms. Please read them carefully.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-700 mb-3">
                  By creating an account, publishing a notice, or submitting a representation, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
                <p className="text-slate-700">
                  If you do not agree to these Terms, you must not use CivicNotices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Eligibility and Account Registration</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">2.1 Age Requirement</h3>
                <p className="text-slate-700 mb-4">
                  You must be at least 18 years old to use CivicNotices. By using the platform, you represent that you meet this age requirement.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">2.2 Council Accounts</h3>
                <p className="text-slate-700 mb-3">
                  Council users must be authorized representatives of their local authority with the legal authority to publish statutory notices on behalf of their organization.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">2.3 Account Security</h3>
                <p className="text-slate-700">
                  You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized access or security breach.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Use of Service</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">3.1 Permitted Use</h3>
                <p className="text-slate-700 mb-3">CivicNotices is intended for:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Publishing legally compliant statutory notices</li>
                  <li>Searching and viewing public notices</li>
                  <li>Submitting representations on published notices</li>
                  <li>Managing notice lifecycle and consultation responses</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">3.2 Prohibited Activities</h3>
                <p className="text-slate-700 mb-3">You must not:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Publish false, misleading, or fraudulent notices</li>
                  <li>Submit abusive, defamatory, or harassing representations</li>
                  <li>Attempt to circumvent security measures or access controls</li>
                  <li>Use automated tools to scrape or harvest data without permission</li>
                  <li>Interfere with the platform's operation or other users' access</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Impersonate another person or organization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Content and Intellectual Property</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">4.1 Your Content</h3>
                <p className="text-slate-700 mb-3">
                  You retain ownership of the content you publish (notices, representations, comments). By publishing content, you grant CivicNotices a perpetual, worldwide, royalty-free license to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Display, distribute, and store your content</li>
                  <li>Make it available to the public as required by statutory notice requirements</li>
                  <li>Create backups and archives for legal compliance</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">4.2 Platform Rights</h3>
                <p className="text-slate-700">
                  CivicNotices and its original content, features, and functionality are owned by us and protected by UK and international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Payment Terms</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">5.1 Pricing</h3>
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <p className="text-slate-700 mb-2"><strong>Individual Notices:</strong> £49.99 per notice (one-time payment)</p>
                  <p className="text-slate-700"><strong>Council Subscriptions:</strong> From £299/month (unlimited notices)</p>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">5.2 Payment Processing</h3>
                <p className="text-slate-700 mb-3">
                  All payments are processed securely through Stripe. We do not store your payment card details.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">5.3 Refund Policy</h3>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                  <p className="text-amber-800 font-medium mb-2">Important Notice:</p>
                  <p className="text-amber-700">
                    Once a notice is published, payments are non-refundable due to the permanent nature of the public record. Refunds may be issued if a notice fails to publish due to technical errors on our end.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Service Availability</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">6.1 Uptime</h3>
                <p className="text-slate-700 mb-3">
                  We aim for 99.9% uptime but do not guarantee uninterrupted access. We may suspend the service for maintenance with advance notice where possible.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">6.2 Modifications</h3>
                <p className="text-slate-700">
                  We reserve the right to modify, suspend, or discontinue any part of the service with 30 days' notice to active users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">7. User Responsibilities</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">7.1 Accuracy</h3>
                <p className="text-slate-700 mb-3">
                  You are solely responsible for ensuring that all notices you publish are accurate, complete, and legally compliant with relevant UK legislation (Licensing Act 2003, Town and Country Planning regulations, etc.).
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">7.2 Legal Compliance</h3>
                <p className="text-slate-700">
                  You must comply with all applicable laws, including but not limited to data protection regulations, licensing laws, and planning regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Limitation of Liability</h2>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-700 mb-3">
                    <strong>To the maximum extent permitted by UK law:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>CivicNotices is provided "as is" without warranties of any kind</li>
                    <li>We are not liable for indirect, incidental, or consequential damages</li>
                    <li>Our total liability is limited to the amount paid for the service in the 12 months preceding the claim</li>
                    <li>We do not warrant that the service will meet your specific requirements or be error-free</li>
                  </ul>
                  <p className="text-slate-700 mt-3">
                    <em>Nothing in these Terms excludes our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under UK law.</em>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Indemnification</h2>
                <p className="text-slate-700">
                  You agree to indemnify and hold CivicNotices harmless from any claims, damages, losses, or expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 mt-3">
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any law or regulation</li>
                  <li>Content you publish or submit</li>
                  <li>Your negligence or willful misconduct</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Termination</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">10.1 By You</h3>
                <p className="text-slate-700 mb-3">
                  You may close your account at any time by contacting us at support@civicnotices.uk. Published notices will remain in the public record.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">10.2 By Us</h3>
                <p className="text-slate-700">
                  We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or for other serious violations. We will provide notice where legally required.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Dispute Resolution</h2>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">11.1 Informal Resolution</h3>
                <p className="text-slate-700 mb-3">
                  Before pursuing formal legal action, please contact us at legal@civicnotices.uk to attempt to resolve the dispute informally.
                </p>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">11.2 Governing Law</h3>
                <p className="text-slate-700 mb-3">
                  These Terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Changes to Terms</h2>
                <p className="text-slate-700 mb-3">
                  We may update these Terms from time to time. Material changes will be notified via email at least 30 days in advance. Continued use after changes take effect constitutes acceptance.
                </p>
                <p className="text-slate-700">
                  The "Last updated" date at the top of this page shows when the Terms were last modified.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Severability</h2>
                <p className="text-slate-700">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Contact Information</h2>
                <p className="text-slate-700 mb-4">
                  For questions about these Terms:
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <p className="text-slate-700 mb-2"><strong>Legal Inquiries</strong></p>
                  <p className="text-slate-700">Email: <a href="mailto:legal@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">legal@civicnotices.uk</a></p>
                  <p className="text-slate-700 mt-2">General Support: <a href="mailto:support@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">support@civicnotices.uk</a></p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
