import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/permissions';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
  };
}

interface ContextType {
  department: Department;
  userRole: string;
}

interface BillingInfo {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  notices_published_this_month: number;
  plan_notice_limit: number;
  amount: number;
  currency: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoice_url?: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Up to 10 notices per month',
      'Basic notice templates',
      'Email support',
      '7-day notice retention'
    ],
    limits: {
      notices_per_month: 10,
      users: 2,
      templates: 3
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    currency: 'GBP',
    interval: 'month',
    features: [
      'Up to 50 notices per month',
      'All notice templates',
      'Priority email support',
      'Unlimited notice retention',
      'Draft auto-save',
      'Team collaboration (up to 5 users)'
    ],
    limits: {
      notices_per_month: 50,
      users: 5,
      templates: 10
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    currency: 'GBP',
    interval: 'month',
    popular: true,
    features: [
      'Up to 200 notices per month',
      'All notice templates',
      'Priority phone & email support',
      'Unlimited notice retention',
      'Advanced analytics',
      'OCR document import',
      'Approval workflows',
      'Team collaboration (up to 20 users)',
      'Custom branding'
    ],
    limits: {
      notices_per_month: 200,
      users: 20,
      templates: -1 // unlimited
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    currency: 'GBP',
    interval: 'month',
    features: [
      'Unlimited notices',
      'All notice templates',
      'Dedicated account manager',
      'Unlimited notice retention',
      'Advanced analytics & reporting',
      'OCR document import',
      'Approval workflows',
      'Unlimited users',
      'Custom branding',
      'API access',
      'SLA guarantee',
      'Custom integrations'
    ],
    limits: {
      notices_per_month: -1, // unlimited
      users: -1, // unlimited
      templates: -1 // unlimited
    }
  }
];

export default function Billing() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [department.organization.id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // For now, use mock data since Stripe integration is not yet implemented
      // In production, this would fetch from /api/billing endpoint
      const mockBillingInfo: BillingInfo = {
        plan: 'professional',
        status: 'active',
        current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        notices_published_this_month: 47,
        plan_notice_limit: 200,
        amount: 14900,
        currency: 'gbp'
      };

      const mockInvoices: Invoice[] = [
        {
          id: 'inv_001',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 14900,
          currency: 'gbp',
          status: 'paid',
          invoice_url: '#'
        },
        {
          id: 'inv_002',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 14900,
          currency: 'gbp',
          status: 'paid',
          invoice_url: '#'
        },
        {
          id: 'inv_003',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 14900,
          currency: 'gbp',
          status: 'paid',
          invoice_url: '#'
        }
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_001',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          is_default: true
        }
      ];

      setBillingInfo(mockBillingInfo);
      setInvoices(mockInvoices);
      setPaymentMethods(mockPaymentMethods);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      setProcessing(true);
      setError(null);

      // TODO: Implement Stripe checkout session creation
      // const response = await fetch('/api/billing/create-checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ plan_id: planId, organization_id: department.organization.id })
      // });
      //
      // const { checkout_url } = await response.json();
      // window.location.href = checkout_url;

      setSuccess(`Plan upgrade to ${planId} initiated (Stripe integration pending)`);
      setShowPlanModal(false);
      setProcessing(false);
    } catch (err) {
      console.error('Failed to upgrade plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to upgrade plan');
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // TODO: Implement Stripe payment method setup
    setSuccess('Payment method setup (Stripe integration pending)');
    setShowPaymentModal(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };

    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE);

  if (!canManageBilling) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to manage billing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === billingInfo?.plan);
  const usagePercentage = billingInfo
    ? (billingInfo.notices_published_this_month / billingInfo.plan_notice_limit) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
            <p className="text-gray-600 mt-1">
              You are currently on the {currentPlan?.name} plan
            </p>
          </div>
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Change Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Plan</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(billingInfo?.status || 'active')}`}>
                {billingInfo?.status}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentPlan?.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {currentPlan?.price ? formatCurrency(currentPlan.price * 100, currentPlan.currency) : 'Custom pricing'}/month
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Usage This Month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {billingInfo?.notices_published_this_month || 0}
              <span className="text-lg text-gray-600">
                {' '}/ {billingInfo?.plan_notice_limit === -1 ? '∞' : billingInfo?.plan_notice_limit}
              </span>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <span className="text-sm font-medium text-gray-600">Next Billing Date</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {billingInfo ? formatDate(billingInfo.current_period_end) : '-'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {billingInfo ? formatCurrency(billingInfo.amount, billingInfo.currency) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            + Add Payment Method
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-gray-600">No payment methods added</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600 uppercase">{method.brand}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </p>
                  </div>
                </div>
                {method.is_default && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>

        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-sm text-gray-900">{formatDate(invoice.date)}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{formatCurrency(invoice.amount, invoice.currency)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {invoice.invoice_url && (
                        <a
                          href={invoice.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-2xl p-6 ${
                      plan.id === billingInfo?.plan
                        ? 'border-blue-600 bg-blue-50'
                        : plan.popular
                        ? 'border-purple-600'
                        : 'border-gray-200'
                    } relative`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-6 transform -translate-y-1/2">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white">
                          Popular
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      {plan.price !== null ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            £{plan.price}
                          </span>
                          <span className="text-gray-600">/month</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">Custom</span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgradePlan(plan.id)}
                      disabled={plan.id === billingInfo?.plan || processing}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        plan.id === billingInfo?.plan
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {plan.id === billingInfo?.plan ? 'Current Plan' : plan.price !== null ? 'Upgrade' : 'Contact Sales'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Payment Method</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Stripe payment integration will be implemented here. For now, this is a placeholder for the Stripe Elements card input form.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPaymentMethod}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
