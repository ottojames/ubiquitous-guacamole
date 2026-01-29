import React, { useState } from 'react';
import { AlertCircle, Bell, Mail, MapPin, CheckCircle } from 'lucide-react';

interface SubscriptionFormProps {
  postcode?: string;
  onSuccess?: () => void;
}

const RADIUS_OPTIONS = [
  { value: 0.5, label: '500m' },
  { value: 1.0, label: '1km' },
  { value: 2.0, label: '2km' },
  { value: 5.0, label: '5km' },
];

export function EmailAlertSubscriptionForm({ postcode: initialPostcode, onSuccess }: SubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState(initialPostcode || '');
  const [radius, setRadius] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          postcode: postcode.toUpperCase().replace(/\s+/g, ''),
          radius_km: radius,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Subscription Created!
        </h3>
        <p className="text-green-700">
          Please check your email to verify your subscription.
        </p>
        <p className="text-sm text-green-600 mt-2">
          You'll receive alerts when new notices are published within {radius}km of {postcode}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          <Mail className="inline h-4 w-4 mr-1" />
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
          <MapPin className="inline h-4 w-4 mr-1" />
          Postcode
        </label>
        <input
          type="text"
          id="postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          required
          pattern="^[A-Za-z]{1,2}[0-9][0-9A-Za-z]?\s?[0-9][A-Za-z]{2}$"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="E1 6EA"
        />
        <p className="mt-1 text-xs text-gray-500">
          We'll alert you about notices near this location
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Bell className="inline h-4 w-4 mr-1" />
          Alert Radius
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRadius(option.value)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                radius === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Receive alerts for notices within {radius}km of your postcode
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating subscription...
          </>
        ) : (
          'Subscribe to Alerts'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You can unsubscribe at any time. We'll never share your email address.
      </p>
    </form>
  );
}