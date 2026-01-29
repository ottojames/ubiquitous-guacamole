import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { CreditCard, Download, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface ContextType {
  firm: Organization;
  userRole: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  period: string;
  pdf_url?: string;
}

interface Subscription {
  id: string;
  tier_name: string;
  tier_slug: string;
  billing_cycle: string;
  next_billing_date: string;
  current_period_start: string;
  current_period_end: string;
  price_per_month: number;
  status: string;
  notices_per_month: number;
  notices_used: number;
  additional_notice_price: number;
}

export default function FirmBilling() {
  const { firmSlug } = useParams<{ firmSlug: string }>();
  const { firm } = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<{
    type: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null>(null);

  useEffect(() => {
    if (firm?.id) {
      loadBillingData();
    }
  }, [firm?.id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subscription from firm_subscriptions table with tier details
      const { data: subData, error: subError } = await supabase
        .from('firm_subscriptions')
        .select(`
          id,
          status,
          billing_cycle,
          current_period_start,
          current_period_end,
          stripe_subscription_id,
          stripe_customer_id,
          tier:tier_id (
            name,
            slug,
            monthly_price_gbp,
            annual_price_gbp,
            notices_per_month,
            additional_notice_price_gbp
          )
        `)
        .eq('organization_id', firm.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Failed to load subscription:', subError);
      }

      if (subData) {
        // Get usage stats for current period
        const { data: usageData } = await supabase.rpc('get_subscription_usage', {
          p_subscription_id: subData.id
        });

        const tier = subData.tier as any;
        const usage = usageData?.[0] || { total_notices: 0 };

        setSubscription({
          id: subData.id,
          tier_name: tier?.name || 'Unknown',
          tier_slug: tier?.slug || '',
          billing_cycle: subData.billing_cycle,
          next_billing_date: subData.current_period_end,
          current_period_start: subData.current_period_start,
          current_period_end: subData.current_period_end,
          price_per_month: subData.billing_cycle === 'annual'
            ? (tier?.annual_price_gbp || 0) / 12
            : (tier?.monthly_price_gbp || 0),
          status: subData.status,
          notices_per_month: tier?.notices_per_month || 0,
          notices_used: usage.total_notices || 0,
          additional_notice_price: tier?.additional_notice_price_gbp || 0
        });

        // If there's a Stripe customer, try to get payment method from API
        if (subData.stripe_customer_id) {
          try {
            const response = await fetch(`/api/stripe/payment-method?customerId=${subData.stripe_customer_id}`);
            if (response.ok) {
              const pmData = await response.json();
              if (pmData?.card) {
                setPaymentMethod({
                  type: pmData.card.brand,
                  last4: pmData.card.last4,
                  exp_month: pmData.card.exp_month,
                  exp_year: pmData.card.exp_year
                });
              }
            }
          } catch {
            // Payment method fetch failed, leave as null
          }
        }
      }

      // Load invoices from monthly_invoices table
      const { data: invData, error: invError } = await supabase
        .from('monthly_invoices')
        .select('*')
        .eq('organization_id', firm.id)
        .order('billing_period_start', { ascending: false })
        .limit(12);

      if (invError && invError.code !== 'PGRST116') {
        console.error('Failed to load invoices:', invError);
      }

      if (invData && invData.length > 0) {
        const transformedInvoices: Invoice[] = invData.map((inv: any) => ({
          id: inv.invoice_number || inv.id,
          date: inv.created_at,
          amount: inv.total_inc_vat_gbp || inv.total_amount_gbp,
          status: inv.status === 'void' ? 'paid' : inv.status as 'paid' | 'pending' | 'overdue',
          period: formatPeriod(inv.billing_period_start, inv.billing_period_end),
          pdf_url: inv.stripe_invoice_id ? `/api/stripe/invoice/${inv.stripe_invoice_id}/pdf` : undefined
        }));

        setInvoices(transformedInvoices);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
      setLoading(false);
    }
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    return startDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleUpdatePayment = () => {
    alert('Payment method update coming soon');
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.pdf_url) {
      // If it's a Stripe invoice, open the PDF URL
      window.open(invoice.pdf_url, '_blank');
    } else {
      alert(`Invoice PDF not available for ${invoice.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription, invoices, and payment methods</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Current Subscription Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Current Subscription</h2>
              {subscription && (
                <p className="text-sm text-gray-600">
                  Period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
            {subscription ? (
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                subscription.status === 'active' ? 'bg-blue-100 text-blue-800' :
                subscription.status === 'trialing' ? 'bg-purple-100 text-purple-800' :
                subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {subscription.status === 'active' ? 'Active' :
                 subscription.status === 'trialing' ? 'Trial' :
                 subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            ) : (
              <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                No Subscription
              </span>
            )}
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">{subscription.tier_name}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-semibold text-gray-900 capitalize">{subscription.billing_cycle}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold text-gray-900">{formatAmount(subscription.price_per_month)}/month</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Notices Used</span>
                <span className="font-semibold text-gray-900">
                  {subscription.notices_used} / {subscription.notices_per_month}
                  {subscription.notices_used >= subscription.notices_per_month && (
                    <span className="ml-2 text-xs text-orange-600">
                      (+{formatAmount(subscription.additional_notice_price)} per extra)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Next Billing Date</span>
                <span className="font-semibold text-gray-900">{formatDate(subscription.next_billing_date)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No active subscription</p>
              <p className="text-sm text-gray-500">Contact us to set up your subscription plan</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => alert('Upgrade/change plan coming soon')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {subscription ? 'Change Plan' : 'Subscribe'}
            </button>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

          {paymentMethod ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{paymentMethod.type} •••• {paymentMethod.last4}</p>
                  <p className="text-sm text-gray-600">Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}</p>
                </div>
              </div>

              <button
                onClick={handleUpdatePayment}
                className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Update Payment Method
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No payment method on file</p>
              <button
                onClick={handleUpdatePayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Invoice History</h2>
          <button
            onClick={() => alert('Download all invoices coming soon')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{invoice.period}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(invoice.date)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">{formatAmount(invoice.amount)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 ml-auto"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Summary (optional for future) */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Need help with billing?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Contact our support team for any questions about your subscription or invoices.
            </p>
            <a
              href="mailto:billing@civicnotices.co.uk"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              billing@civicnotices.co.uk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
