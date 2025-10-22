import { Link } from 'react-router-dom';

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h1>

        <p className="text-lg text-gray-600 mb-8">
          Your licensing application has been submitted to the council for review.
        </p>

        {/* Check Email Card */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-blue-900 mb-2">📧 Check Your Email</h3>
              <p className="text-sm text-blue-700 mb-3">
                We've sent you a <strong>magic link</strong> to track your application status. Click the link in the email to access your application dashboard.
              </p>
              <p className="text-xs text-blue-600">
                The link will expire in 1 hour. You can request a new one anytime from the tracking page.
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What Happens Next?</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <p className="font-semibold text-gray-900">Council Review</p>
                <p className="text-sm text-gray-600">The licensing department will review your application (typically within 5-10 working days)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <p className="font-semibold text-gray-900">You'll Receive Feedback</p>
                <p className="text-sm text-gray-600">You'll be notified if your application is approved, requires changes, or is rejected</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <p className="font-semibold text-gray-900">Publication</p>
                <p className="text-sm text-gray-600">If approved, your notice will be published for public representations</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/applicant/sign-in"
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Track Application
          </Link>
          <Link
            to="/apply"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Submit Another
          </Link>
          <Link
            to="/"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Need help?</strong> The council will contact you directly if they have any questions about your application.
          </p>
        </div>
      </div>
    </div>
  );
}
