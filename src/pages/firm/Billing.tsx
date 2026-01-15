import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { CreditCard, Download, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'firm' | 'council';
}

interface ContextType {
  organization: Organization;
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
  tier: string;
  billing_cycle: string;
  next_billing_date: string;
  price_per_month: number;
}

export default function FirmBilling() {
  const { firmSlug } = useParams<{ firmSlug: string }>();
  const { organization } = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<{
    type: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [organization.id]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Mock data for now - in production, fetch from API
      setSubscription({
        tier: 'Professional',
        billing_cycle: 'monthly',
        next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        price_per_month: 149.99
      });

      setPaymentMethod({
        type: 'Visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2026
      });

      // Mock invoices
      const mockInvoices: Invoice[] = [
        {
          id: 'inv_001',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149.99,
          status: 'paid',
          period: 'January 2026',
          pdf_url: '/api/invoices/inv_001/pdf'
        },
        {
          id: 'inv_002',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149.99,
          status: 'paid',
          period: 'December 2025',
          pdf_url: '/api/invoices/inv_002/pdf'
        },
        {
          id: 'inv_003',
          date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149.99,
          status: 'paid',
          period: 'November 2025',
          pdf_url: '/api/invoices/inv_003/pdf'
        }
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setLoading(false);
    }
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
    alert(`Downloading invoice ${invoice.id} for ${invoice.period}`);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Current Subscription Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Current Subscription</h2>
              <p className="text-sm text-gray-600">Active since November 2025</p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Active
            </span>
          </div>

          {subscription && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">{subscription.tier}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-semibold text-gray-900 capitalize">{subscription.billing_cycle}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold text-gray-900">{formatAmount(subscription.price_per_month)}/month</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Next Billing Date</span>
                <span className="font-semibold text-gray-900">{formatDate(subscription.next_billing_date)}</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => alert('Upgrade/change plan coming soon')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Change Plan
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
