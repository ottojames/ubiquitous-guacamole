import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import * as UI from '@/styles/ui';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const noticeId = searchParams.get('noticeId');
  const sessionId = searchParams.get('session_id');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(112deg, #192650 0%, #3866af 50%, #ffffff 100%)',
      }}
    >
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-white/95 rounded-2xl ring-1 ring-slate-200 shadow-lg p-10">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Payment successful
          </h1>

          <div className="space-y-4 text-left max-w-md mx-auto mb-8">
            <p className="text-slate-700">
              Your payment has been processed successfully. Your notice will be published shortly.
            </p>
            <p className="text-slate-700">
              A confirmation email with your receipt has been sent to your email address.
            </p>
            {noticeId && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="font-semibold">Notice ID:</span>{' '}
                <code className="text-blue-600">{noticeId}</code>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {noticeId && (
              <button
                onClick={() => navigate(`/notices/${noticeId}`)}
                className={UI.btnPrimary}
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                View notice
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className={UI.btnSecondary}
            >
              <Home className="h-5 w-5 mr-2" />
              Return home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
