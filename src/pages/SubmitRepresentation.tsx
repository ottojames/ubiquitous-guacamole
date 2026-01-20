import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Mail, FileText, AlertCircle, CheckCircle, User, Building2 } from 'lucide-react';
import * as UI from '@/styles/ui';

const NAV_LINKS = [
  { href: '/#notices', label: 'Find notices' },
  { href: '/#for-councils', label: 'For councils' },
  { href: '/pricing', label: 'Pricing' },
] as const;

type NoticeDetail = {
  id: string;
  noticeType: string;
  premisesName: string;
  premisesAddress: string;
  repsDeadline: string | null;
  publicationDate: string;
  applicantName: string | null;
  rawData?: {
    extras?: {
      tokens?: {
        AUTHORITY_NAME?: string;
        AUTHORITY_EMAIL?: string;
        REPRESENTATION_EMAIL?: string;
        REPRESENTATION_ADDRESS?: string;
      };
    };
  };
};

export default function SubmitRepresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    representationType: 'objection' as 'objection' | 'support',
    licensingObjectives: [] as string[],
    comments: '',
  });

  useEffect(() => {
    if (!id) return;

    fetch(`/api/notices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setNotice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load notice:', err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate licensing objectives for objections
    if (formData.representationType === 'objection' && formData.licensingObjectives.length === 0) {
      alert('Please select at least one licensing objective for your objection.');
      return;
    }

    setSubmitting(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5174' : '');

      const response = await fetch(`${API_BASE}/api/representations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noticeId: notice?.id,
          submitterName: formData.fullName,
          submitterEmail: formData.email,
          submitterAddress: formData.address || undefined,
          type: formData.representationType,
          licensingObjectives: formData.representationType === 'objection' ? formData.licensingObjectives : undefined,
          content: formData.comments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit representation' }));
        throw new Error(errorData.error || 'Failed to submit representation');
      }

      await response.json();

      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting representation:', error);
      setSubmitting(false);
      alert(`Failed to submit representation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-base text-slate-600">Loading notice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Notice Not Found</h2>
            <p className="text-slate-600 mb-6">Unable to load notice details.</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const authorityName = notice?.rawData?.extras?.tokens?.AUTHORITY_NAME || 'the Licensing Authority';
  const authorityEmail = notice?.rawData?.extras?.tokens?.REPRESENTATION_EMAIL
    || notice?.rawData?.extras?.tokens?.AUTHORITY_EMAIL
    || 'licensing@council.gov.uk';
  const representationAddress = notice?.rawData?.extras?.tokens?.REPRESENTATION_ADDRESS;

  return (
    <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400`}>
      {/* Gradient Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-16 -top-16 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg" style={{ height: 'var(--headerH)' }}>
        <div className={`${UI.container} h-full`}>
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.5px' }}>
                CivicNotices
              </a>
              <nav className="hidden items-center gap-6 md:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Notice
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-16 md:pb-16 md:pt-24">
        <div className={`${UI.container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:text-6xl">
              Submit Representation
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:text-xl">
              Make your voice heard on this licensing application
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={`${UI.container} pb-24 relative z-10 ${submitted ? '' : '-mt-8'}`}>
        <div className="mx-auto max-w-4xl">
          {submitted ? (
            /* Success State */
            <div className="rounded-3xl border border-white/70 bg-white p-12 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center">
                <CheckCircle className="mx-auto h-20 w-20 text-green-600 mb-6" />
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Representation Submitted</h2>
                <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                  Your representation has been successfully submitted to {authorityName}.
                  They will review your submission and may contact you if additional information is needed.
                </p>

                {/* Subscribe to Notices Banner */}
                <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Stay informed about your area
                      </h3>
                      <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                        Get weekly email updates about new planning applications, licensing notices, and traffic orders in your neighbourhood. Never miss an opportunity to have your say.
                      </p>
                      <button
                        onClick={() => navigate('/email-alerts')}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Subscribe to Notices in Your Area
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => navigate(`/notices/${id}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Notice
                  </button>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: '',
                        email: '',
                        address: '',
                        representationType: 'objection',
                        licensingObjectives: [],
                        comments: '',
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
                  >
                    Submit Another
                  </button>
                </div>
              </div>
          ) : (
            <div className="space-y-8">
              {/* Notice Info Card */}
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Notice Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Notice Type</p>
                    <p className="text-lg text-slate-900">{notice.noticeType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Premises</p>
                    <p className="text-lg text-slate-900">{notice.premisesName}</p>
                    <p className="text-sm text-slate-600">{notice.premisesAddress}</p>
                  </div>
                  {notice.applicantName && (
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Applicant</p>
                      <p className="text-lg text-slate-900">{notice.applicantName}</p>
                    </div>
                  )}
                  {notice.repsDeadline && (
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Deadline</p>
                      <p className="text-lg text-slate-900">
                        {new Date(notice.repsDeadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Authority Contact Info */}
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Licensing Authority</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Authority Name</p>
                    <p className="text-lg text-slate-900">{authorityName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contact Email</p>
                    <p className="text-lg text-slate-900">{authorityEmail}</p>
                  </div>
                  {representationAddress && (
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Postal Address</p>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{representationAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Representation Form */}
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Your Representation</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="full-name-field"
                      required
                      autoComplete="new-password"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email-field"
                      required
                      autoComplete="new-password"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Address *
                    </label>
                    <textarea
                      id="address"
                      name="address-field"
                      required
                      autoComplete="new-password"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Your full postal address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Type of Representation *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, representationType: 'objection' })}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          formData.representationType === 'objection'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold text-slate-900">Objection</p>
                        <p className="text-sm text-slate-600">I object to this application</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, representationType: 'support', licensingObjectives: [] })}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          formData.representationType === 'support'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold text-slate-900">Support</p>
                        <p className="text-sm text-slate-600">I support this application</p>
                      </button>
                    </div>
                  </div>

                  {/* Licensing Objectives - Only for Objections */}
                  {formData.representationType === 'objection' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Licensing Objectives *
                      </label>
                      <p className="text-sm text-slate-600 mb-4">
                        Select which licensing objectives your objection relates to (you must select at least one):
                      </p>
                      <div className="space-y-3">
                        {[
                          {
                            value: 'prevention-crime-disorder',
                            label: 'Prevention of crime and disorder',
                            description: 'Concerns about crime, anti-social behaviour, or public disorder'
                          },
                          {
                            value: 'public-safety',
                            label: 'Public safety',
                            description: 'Concerns about risks to public safety'
                          },
                          {
                            value: 'prevention-public-nuisance',
                            label: 'Prevention of public nuisance',
                            description: 'Concerns about noise, disturbance, or other nuisances'
                          },
                          {
                            value: 'protection-children-harm',
                            label: 'Protection of children from harm',
                            description: 'Concerns about risks to children under 18'
                          },
                        ].map((objective) => {
                          const isChecked = formData.licensingObjectives.includes(objective.value);
                          return (
                            <label
                              key={objective.value}
                              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
                                isChecked
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      licensingObjectives: [...formData.licensingObjectives, objective.value]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      licensingObjectives: formData.licensingObjectives.filter(v => v !== objective.value)
                                    });
                                  }
                                }}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{objective.label}</p>
                                <p className="text-sm text-slate-600">{objective.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {formData.licensingObjectives.length === 0 && (
                        <p className="mt-2 text-sm text-rose-600">
                          You must select at least one licensing objective for your objection
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="comments" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Comments * (minimum 10 characters)
                    </label>
                    <textarea
                      id="comments"
                      required
                      minLength={10}
                      rows={8}
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Explain your representation in detail. Include any relevant concerns or reasons for your position."
                    />
                    {formData.comments.length > 0 && formData.comments.length < 10 && (
                      <p className="mt-2 text-sm text-rose-600">
                        Please enter at least 10 characters ({formData.comments.length}/10)
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-2">How This Works</p>
                        <p className="text-sm text-blue-800">
                          When you submit this form, your representation will be sent directly to {authorityName}.
                          You'll receive a confirmation once your submission is complete. Make sure to submit before the deadline.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Submit Representation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-50 py-12">
        <div className={UI.container}>
          <div className="text-center text-sm text-slate-600">
            <p className="mb-2">© 2025 CivicNotices. Making local democracy transparent.</p>
            <p className="text-xs text-slate-500">
              Representations must be received by the licensing authority before the stated deadline.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
