import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Mail,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from 'lucide-react';

interface RepresentationFormProps {
  noticeId: string;
  noticeType: string;
  noticeCategory?: string;
  premisesName: string;
  premisesAddress: string;
  deadline: string | null;
}

// Define grounds for different notice types
const LICENSING_OBJECTIVES = [
  'The prevention of crime and disorder',
  'Public safety',
  'The prevention of public nuisance',
  'The protection of children from harm'
];

const PLANNING_CONSIDERATIONS = [
  'Loss of privacy/overlooking',
  'Noise and disturbance',
  'Highway safety and traffic',
  'Loss of daylight or sunlight',
  'Design and appearance',
  'Conservation of the natural/built environment',
  'Impact on listed buildings or conservation areas',
  'Trees and landscaping',
  'Nature conservation',
  'Flood risk',
  'Other material planning considerations'
];

const ENVIRONMENTAL_CONCERNS = [
  'Noise pollution',
  'Air quality',
  'Odour',
  'Light pollution',
  'Waste management',
  'Public health implications',
  'Environmental damage',
  'Water pollution',
  'Land contamination'
];

const TRAFFIC_CONCERNS = [
  'Traffic flow disruption',
  'Parking availability',
  'Access to properties',
  'Road safety',
  'Emergency vehicle access',
  'Pedestrian safety',
  'Cycle lane impacts',
  'Public transport disruption',
  'Environmental impact'
];

const GAMBLING_OBJECTIVES = [
  'Preventing gambling from being a source of crime or disorder',
  'Ensuring gambling is conducted in a fair and open way',
  'Protecting children and vulnerable persons from gambling harm'
];

const GVOL_CONCERNS = [
  'Traffic congestion',
  'Noise from vehicles and operations',
  'Environmental impact',
  'Road safety concerns',
  'Unsuitable site location',
  'Impact on residential amenity',
  'Operating hours concerns',
  'Vehicle numbers exceeding capacity'
];

export default function RepresentationForm({
  noticeId,
  noticeType,
  noticeCategory,
  premisesName,
  premisesAddress,
  deadline
}: RepresentationFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'comment' as 'support' | 'objection' | 'comment',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    isAnonymous: false,
    grounds: [] as string[],
    comments: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Determine which grounds/objectives to show based on notice type
  const getRelevantGrounds = () => {
    const category = noticeCategory || noticeType?.toLowerCase() || '';

    if (category.includes('licensing')) {
      return { title: 'Licensing Objectives', options: LICENSING_OBJECTIVES };
    } else if (category.includes('planning')) {
      return { title: 'Material Planning Considerations', options: PLANNING_CONSIDERATIONS };
    } else if (category.includes('environmental') || category.includes('noise') || category.includes('pollution')) {
      return { title: 'Environmental Concerns', options: ENVIRONMENTAL_CONCERNS };
    } else if (category.includes('traffic') || category.includes('tro') || category.includes('road')) {
      return { title: 'Traffic & Highway Concerns', options: TRAFFIC_CONCERNS };
    } else if (category.includes('gambling')) {
      return { title: 'Gambling Licensing Objectives', options: GAMBLING_OBJECTIVES };
    } else if (category.includes('gvol') || category.includes('goods vehicle') || category.includes('operating centre')) {
      return { title: 'Operating Centre Concerns', options: GVOL_CONCERNS };
    }

    // Default generic grounds
    return {
      title: 'Grounds for Representation',
      options: [
        'Impact on local area',
        'Public safety concerns',
        'Environmental impact',
        'Economic considerations',
        'Community impact',
        'Other concerns (please specify in comments)'
      ]
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName && !formData.isAnonymous) {
      newErrors.fullName = 'Full name is required unless submitting anonymously';
    }

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address && !formData.isAnonymous) {
      newErrors.address = 'Address is required unless submitting anonymously';
    }

    if (!formData.comments) {
      newErrors.comments = 'Comments are required - please explain your representation';
    }

    if (formData.type === 'objection' && formData.grounds.length === 0) {
      newErrors.grounds = 'Please select at least one ground for your objection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.text-red-600');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`/api/notices/${noticeId}/representations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notice_id: noticeId,
          type: formData.type,
          representor_name: formData.isAnonymous ? 'Anonymous' : formData.fullName,
          representor_email: formData.email,
          representor_phone: formData.phone || null,
          representor_address: formData.isAnonymous ? null : {
            line1: formData.address,
            postcode: formData.postcode
          },
          grounds: formData.grounds.length > 0 ? formData.grounds : null,
          representation_text: formData.comments,
          submitted_at: new Date().toISOString(),
          is_anonymous: formData.isAnonymous,
          reference_number: `REP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit representation');
      }

      const result = await response.json();
      setSubmitSuccess(true);

      // Redirect to notice page with success message after 3 seconds
      setTimeout(() => {
        navigate(`/notices/${noticeId}`, {
          state: { representationSubmitted: true, referenceNumber: result.reference_number }
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting representation:', error);
      setSubmitError('Failed to submit your representation. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroundToggle = (ground: string) => {
    setFormData(prev => ({
      ...prev,
      grounds: prev.grounds.includes(ground)
        ? prev.grounds.filter(g => g !== ground)
        : [...prev.grounds, ground]
    }));
  };

  const { title: groundsTitle, options: groundsOptions } = getRelevantGrounds();

  // Check if deadline has passed
  const isDeadlinePassed = deadline && new Date(deadline) < new Date();

  if (submitSuccess) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Representation Submitted Successfully
          </h2>
          <p className="text-lg text-slate-600 mb-2">
            Thank you for your submission. Your representation has been received and will be considered by the licensing authority.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            A confirmation email has been sent to {formData.email}
          </p>
          <p className="text-sm text-slate-400">
            Redirecting you back to the notice page...
          </p>
        </div>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Deadline Passed
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            The deadline for submitting representations for this notice has passed.
          </p>
          <button
            onClick={() => navigate(`/notices/${noticeId}`)}
            className="rounded-xl bg-slate-600 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            Back to Notice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Submit Your Representation</h1>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Regarding:</span> {premisesName}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {premisesAddress}
            </p>
            {deadline && (
              <p className="text-sm text-blue-900 mt-2">
                <span className="font-semibold">Deadline:</span> {new Date(deadline).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type of Representation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Type of Representation *
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'support' })}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition ${
                  formData.type === 'support'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
                <span className="font-semibold">Support</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'objection' })}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition ${
                  formData.type === 'objection'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="font-semibold">Object</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'comment' })}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition ${
                  formData.type === 'comment'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Comment</span>
              </button>
            </div>
          </div>

          {/* Grounds for Representation (only for objections) */}
          {formData.type === 'objection' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                {groundsTitle} *
              </label>
              <p className="text-sm text-slate-600 mb-4">
                Select all that apply to your objection:
              </p>
              <div className="space-y-2">
                {groundsOptions.map((ground) => (
                  <label
                    key={ground}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.grounds.includes(ground)}
                      onChange={() => handleGroundToggle(ground)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{ground}</span>
                  </label>
                ))}
              </div>
              {errors.grounds && (
                <p className="mt-2 text-sm text-red-600">{errors.grounds}</p>
              )}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Your Information
            </h3>

            {/* Anonymous submission option */}
            <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-slate-700">Submit Anonymously</p>
                <p className="text-xs text-slate-500">Your name and address will not be published (email still required)</p>
              </div>
            </label>

            {!formData.isAnonymous && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    placeholder="Enter your full address"
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      placeholder="e.g. SW1A 1AA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      placeholder="e.g. 020 1234 5678"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                We'll send a confirmation of your representation to this address
              </p>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Comments *
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={8}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
              placeholder="Please provide details of your representation. Be specific and include any evidence or reasoning to support your position..."
            />
            {errors.comments && (
              <p className="mt-2 text-sm text-red-600">{errors.comments}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Minimum 10 characters. Your comments will be made public and shared with the applicant.
            </p>
          </div>

          {/* Legal Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-2">Important Information</p>
                <ul className="space-y-1 ml-4">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Your representation will become a public document</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>It will be shared with the applicant and may be published online</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>You may be contacted for additional information</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>False or misleading statements may result in prosecution</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold">Submission Failed</p>
                  <p>{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/notices/${noticeId}`)}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Representation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}