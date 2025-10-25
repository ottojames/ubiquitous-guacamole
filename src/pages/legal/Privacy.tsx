import { Link } from 'react-router-dom';
import * as UI from '@/styles/ui';
import Footer from '@/components/Footer';

export default function Privacy() {
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
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: October 2025</p>

            <div className="prose prose-slate max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-lg text-slate-700 leading-relaxed">
                  CivicNotices ("we", "our", or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our statutory notice publication platform.
                </p>
                <p className="text-slate-700 mt-4">
                  We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. By using CivicNotices, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              {/* Data Controller */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Data Controller</h2>
                <p className="text-slate-700">
                  CivicNotices is the data controller responsible for your personal data. You can contact our Data Protection Officer at:
                </p>
                <div className="bg-slate-50 p-4 rounded-lg mt-3">
                  <p className="text-slate-700 mb-1"><strong>Email:</strong> privacy@civicnotices.uk</p>
                  <p className="text-slate-700 mb-1"><strong>Address:</strong> London, United Kingdom</p>
                  <p className="text-slate-700"><strong>ICO Registration:</strong> [To be assigned]</p>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold text-slate-900 mb-3">2.1 Information You Provide</h3>
                <ul className="space-y-2 text-slate-700 list-disc pl-6">
                  <li><strong>Account Information:</strong> Name, email address, job title, organization name (for council users)</li>
                  <li><strong>Notice Content:</strong> Statutory notices you publish, including applicant names, premises addresses, and legal details</li>
                  <li><strong>Representations:</strong> Public comments and objections submitted on notices, including name, email, and postal address</li>
                  <li><strong>Payment Information:</strong> Billing address and payment card details (processed securely by Stripe)</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
                <ul className="space-y-2 text-slate-700 list-disc pl-6">
                  <li><strong>Usage Data:</strong> Pages viewed, search queries, time spent on site, clickstream data</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Location Data:</strong> Approximate geographic location derived from IP address</li>
                  <li><strong>Cookies:</strong> Essential session cookies, analytics cookies (see Section 8)</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-slate-700 mb-4">We process your personal data for the following purposes:</p>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">Service Provision (Contractual Necessity)</p>
                    <ul className="mt-2 space-y-1 text-slate-700 list-disc pl-6">
                      <li>Publishing and displaying statutory notices</li>
                      <li>Processing representations and public comments</li>
                      <li>Managing user accounts and authentication</li>
                      <li>Processing payments and issuing receipts</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">Legal Obligations</p>
                    <ul className="mt-2 space-y-1 text-slate-700 list-disc pl-6">
                      <li>Maintaining audit trails for statutory compliance</li>
                      <li>Responding to legal requests and court orders</li>
                      <li>Preventing fraud and abuse</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">Legitimate Interests</p>
                    <ul className="mt-2 space-y-1 text-slate-700 list-disc pl-6">
                      <li>Improving platform performance and user experience</li>
                      <li>Analyzing usage patterns and trends</li>
                      <li>Sending service updates and important notifications</li>
                      <li>Detecting and preventing security threats</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-slate-700 mb-4">We share your personal data only in the following circumstances:</p>

                <ul className="space-y-3 text-slate-700">
                  <li>
                    <strong>Public Notices:</strong> Statutory notices and representations are published publicly as required by law. This includes applicant names, premises addresses, and submitter details.
                  </li>
                  <li>
                    <strong>Service Providers:</strong> We use trusted third-party services:
                    <ul className="mt-2 ml-6 space-y-1 list-disc">
                      <li>Supabase (database hosting) - EU data centers</li>
                      <li>Stripe (payment processing) - PCI DSS compliant</li>
                      <li>MapTiler (mapping services) - Switzerland-based</li>
                      <li>Sentry (error monitoring) - EU data residency option</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose information to comply with court orders, regulatory requests, or legal processes.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a merger or acquisition, your data may be transferred to the new entity.
                  </li>
                </ul>

                <p className="text-slate-700 mt-4 font-semibold">
                  We will never sell your personal data to third parties for marketing purposes.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-200 px-4 py-2 text-left">Data Type</th>
                        <th className="border border-slate-200 px-4 py-2 text-left">Retention Period</th>
                        <th className="border border-slate-200 px-4 py-2 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 px-4 py-2">Published Notices</td>
                        <td className="border border-slate-200 px-4 py-2">Indefinitely</td>
                        <td className="border border-slate-200 px-4 py-2">Legal requirement for public record</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-4 py-2">Representations</td>
                        <td className="border border-slate-200 px-4 py-2">Indefinitely</td>
                        <td className="border border-slate-200 px-4 py-2">Part of public consultation record</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-4 py-2">User Accounts</td>
                        <td className="border border-slate-200 px-4 py-2">Until deletion requested</td>
                        <td className="border border-slate-200 px-4 py-2">Service provision</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-4 py-2">Payment Records</td>
                        <td className="border border-slate-200 px-4 py-2">7 years</td>
                        <td className="border border-slate-200 px-4 py-2">Tax and accounting requirements</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-4 py-2">Usage Logs</td>
                        <td className="border border-slate-200 px-4 py-2">90 days</td>
                        <td className="border border-slate-200 px-4 py-2">Security and debugging</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights Under UK GDPR</h2>
                <p className="text-slate-700 mb-4">You have the following rights regarding your personal data:</p>

                <ul className="space-y-3 text-slate-700">
                  <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for optional processing activities</li>
                </ul>

                <p className="text-slate-700 mt-4">
                  To exercise these rights, email <a href="mailto:privacy@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">privacy@civicnotices.uk</a>. We will respond within 30 days.
                </p>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
                  <p className="text-amber-800 font-medium">Important Note:</p>
                  <p className="text-amber-700 mt-2">
                    Published statutory notices and representations cannot be deleted as they form part of the permanent public record required by law. You may request anonymization where legally permissible.
                  </p>
                </div>
              </section>

              {/* Security */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Security</h2>
                <p className="text-slate-700 mb-4">We implement industry-standard security measures to protect your personal data:</p>

                <ul className="space-y-2 text-slate-700 list-disc pl-6">
                  <li>TLS/SSL encryption for all data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Multi-factor authentication for council accounts</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and role-based permissions</li>
                  <li>Automated backup and disaster recovery procedures</li>
                  <li>Security incident response plan</li>
                </ul>

                <p className="text-slate-700 mt-4">
                  Despite our best efforts, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to promptly notifying affected users and the ICO of any data breaches.
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies and Tracking</h2>
                <p className="text-slate-700 mb-4">We use the following types of cookies:</p>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">Essential Cookies (Always Active)</p>
                    <p className="text-slate-700 mt-2">Required for authentication, security, and core functionality. Cannot be disabled.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-900">Analytics Cookies (Optional)</p>
                    <p className="text-slate-700 mt-2">Help us understand how users interact with the platform. You can opt out in your browser settings.</p>
                  </div>
                </div>

                <p className="text-slate-700 mt-4">
                  We do not use advertising or third-party tracking cookies. For more details, see our Cookie Policy.
                </p>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">9. International Data Transfers</h2>
                <p className="text-slate-700">
                  Your data is primarily stored in the UK and EU. Where we use service providers outside the UK/EU, we ensure adequate protection through:
                </p>
                <ul className="mt-3 space-y-2 text-slate-700 list-disc pl-6">
                  <li>Standard Contractual Clauses (SCCs) approved by the ICO</li>
                  <li>Data Processing Agreements with GDPR-compliant terms</li>
                  <li>Regular assessments of third-party security practices</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Children's Privacy</h2>
                <p className="text-slate-700">
                  CivicNotices is not intended for children under 16. We do not knowingly collect personal data from children. If you believe we have inadvertently collected data from a child, contact us immediately at <a href="mailto:privacy@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">privacy@civicnotices.uk</a>.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-slate-700">
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of material changes via email or prominent notice on the platform at least 30 days before the changes take effect.
                </p>
                <p className="text-slate-700 mt-3">
                  Continued use of CivicNotices after changes become effective constitutes acceptance of the updated policy.
                </p>
              </section>

              {/* Complaints */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">12. How to Complain</h2>
                <p className="text-slate-700 mb-4">
                  If you have concerns about how we handle your personal data, please contact us first at <a href="mailto:privacy@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">privacy@civicnotices.uk</a>. We aim to resolve all complaints within 30 days.
                </p>
                <p className="text-slate-700">
                  You also have the right to lodge a complaint with the Information Commissioner's Office (ICO):
                </p>
                <div className="bg-slate-50 p-4 rounded-lg mt-3">
                  <p className="text-slate-700"><strong>ICO Website:</strong> <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">ico.org.uk</a></p>
                  <p className="text-slate-700"><strong>Helpline:</strong> 0303 123 1113</p>
                  <p className="text-slate-700"><strong>Address:</strong> Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Contact Information</h2>
                <p className="text-slate-700 mb-4">
                  For any privacy-related questions, data access requests, or to exercise your rights:
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                  <p className="text-slate-700 mb-2"><strong>Data Protection Officer</strong></p>
                  <p className="text-slate-700">Email: <a href="mailto:privacy@civicnotices.uk" className="text-blue-600 hover:text-blue-700 underline">privacy@civicnotices.uk</a></p>
                  <p className="text-slate-700">Response time: Within 30 days of receipt</p>
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
