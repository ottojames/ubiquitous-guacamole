import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, X, Calendar, Building2 } from 'lucide-react';

interface PublishSuccessModalProps {
  notice: {
    id: string;
    title: string;
    notice_type: string;
    status: string;
    published_at: string;
    representation_deadline: string;
    expires_at: string;
    council_name: string;
    billing_amount: number;
    billing_status: string;
  };
  magicLink: string;
  onClose: () => void;
}

export default function PublishSuccessModal({ notice, magicLink, onClose }: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  function copyMagicLink() {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function daysRemaining(deadline: string): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const daysLeft = daysRemaining(notice.representation_deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success Icon */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>

          {/* Title */}
          <h2 className="mb-2 text-3xl font-bold text-white">
            Notice Published!
          </h2>
          <p className="text-lg text-blue-100">
            Your notice is now live on the public portal
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 p-8">
          {/* Notice Details Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="font-semibold text-slate-900">{notice.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{notice.notice_type}</p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Council</p>
                  <p className="text-sm font-medium text-slate-900">{notice.council_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Published</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(notice.published_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Representation Deadline</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(notice.representation_deadline)}</p>
                  {daysLeft > 0 && (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      {daysLeft} days remaining
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Expires</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(notice.expires_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Magic Link Section */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-900">
              <ExternalLink className="h-5 w-5" />
              Your Access Link
            </h3>
            <p className="mb-4 text-sm text-blue-800">
              Save this link to view your notice status and representations. We've also emailed it to you.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={magicLink}
                readOnly
                className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={copyMagicLink}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-blue-700">
              🔒 This link expires in 90 days
            </p>
          </div>

          {/* Billing Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-semibold text-slate-900">Billing</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Publication cost</p>
                <p className="text-2xl font-bold text-slate-900">£{notice.billing_amount.toFixed(2)}</p>
              </div>
              <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800">
                Payment pending
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              This charge has been added to your account. You can view and pay your balance in the billing dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`/notices/${notice.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-5 w-5" />
              View Public Notice
            </a>
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Next Steps */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="mb-3 font-semibold text-emerald-900">✅ What happens next?</h3>
            <ul className="space-y-2 text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>Your notice is now visible to the public at /notices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>The council will be able to see it in their department dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>You'll receive notifications when representations are submitted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                <span>Use your magic link to check status and view responses anytime</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
