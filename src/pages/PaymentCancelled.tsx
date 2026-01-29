import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import * as UI from '@/styles/ui';

export default function PaymentCancelled() {
  const navigate = useNavigate();

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
          {/* Cancelled Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Payment cancelled
          </h1>

          <div className="space-y-4 text-left max-w-md mx-auto mb-8">
            <p className="text-slate-700">
              Your payment was cancelled. No charges have been made to your account.
            </p>
            <p className="text-slate-700">
              Your notice draft has been saved. You can return to complete your payment at any time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/publish')}
              className={UI.btnPrimary}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try again
            </button>
            <button
              onClick={() => navigate('/')}
              className={UI.btnSecondary}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Return home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
