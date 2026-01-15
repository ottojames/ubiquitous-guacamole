import { useEffect, useState } from 'react';
import { useOutletContext, Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import QuickPublishWidget from '@/components/firm/QuickPublishWidget';

interface FirmContext {
  firm: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  tier: {
    name: string;
    slug: string;
    notices_per_month: number;
    additional_notice_price_gbp: number;
    monthly_price_gbp: number;
    annual_price_gbp: number;
  };
}

interface UsageInfo {
  total_notices: number;
  notices_in_allowance: number;
  notices_overage: number;
  overage_amount_gbp: number;
}

interface DashboardStats {
  totalNotices: number;
  activeNotices: number;
  outstandingBalance: number;
  pendingPayment: number;
}

interface RecentNotice {
  id: string;
  notice_type: string;
  premises: any;
  published_at: string;
  payment_status: string;
  billing_amount: number;
  council: {
    name: string;
  } | null;
}

export default function FirmDashboard() {
  const { firm } = useOutletContext<FirmContext>();
  const { firmSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalNotices: 0,
    activeNotices: 0,
    outstandingBalance: 0,
    pendingPayment: 0,
  });
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);

  // Save firm context to session storage for publish flow
  useEffect(() => {
    if (firm.slug) {
      sessionStorage.setItem('lastAccessedFirm', JSON.stringify({ slug: firm.slug }));
    }
  }, [firm.slug]);

  useEffect(() => {
    loadDashboardData();
    loadSubscriptionData();
  }, [firm.id]);

  const loadSubscriptionData = async () => {
    try {
      // Fetch subscription info
      const subResponse = await fetch(`/api/firm-subscriptions/organization/${firm.id}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);

        // Fetch usage info if subscription exists
        if (subData && subData.id) {
          const usageResponse = await fetch(`/api/firm-subscriptions/${subData.id}/usage`);
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsage(usageData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Get all-time notice count
      const { count: totalCount } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('published_by_organization_id', firm.id);

      // Get active notices (published status)
      const { count: activeCount } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('published_by_organization_id', firm.id)
        .eq('status', 'published');

      // Get pending payment count
      const { count: pendingCount } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('published_by_organization_id', firm.id)
        .in('payment_status', ['pending', 'overdue']);

      // Calculate outstanding balance from billing transactions (only pending)
      const { data: transactions } = await supabase
        .from('billing_transactions')
        .select('amount, type, status')
        .eq('organization_id', firm.id);

      let balance = 0;
      if (transactions) {
        transactions.forEach(t => {
          if (t.type === 'charge' && t.status === 'pending') {
            balance += Number(t.amount);
          }
          if (t.type === 'payment' && t.status === 'pending') {
            balance -= Number(t.amount);
          }
        });
      }

      // Get recent notices with council info
      const { data: notices } = await supabase
        .from('notices')
        .select(`
          id,
          notice_type,
          premises,
          published_at,
          payment_status,
          billing_amount,
          council:councils (
            name
          )
        `)
        .eq('published_by_organization_id', firm.id)
        .order('published_at', { ascending: false })
        .limit(10);

      setStats({
        totalNotices: totalCount || 0,
        activeNotices: activeCount || 0,
        outstandingBalance: balance,
        pendingPayment: pendingCount || 0,
      });

      setRecentNotices(notices as any || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to {firm.name}</p>
        </div>
        <Link
          to={`/f/${firmSlug}/publish`}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
        >
          Publish Notice
        </Link>
      </div>

      {/* Subscription Allowance Card */}
      {subscription && usage && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{subscription.tier.name} Plan</h2>
              <p className="text-purple-100">
                {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} Billing
                {subscription.status === 'trialing' && subscription.trial_ends_at && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">
                    Trial until {new Date(subscription.trial_ends_at).toLocaleDateString('en-GB')}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                £{subscription.billing_cycle === 'monthly'
                  ? subscription.tier.monthly_price_gbp.toFixed(0)
                  : (subscription.tier.annual_price_gbp / 12).toFixed(0)}
              </div>
              <div className="text-purple-100 text-sm">/month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Notices Used */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-purple-100 text-sm mb-1">Notices This Month</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{usage.notices_in_allowance}</div>
                <div className="text-purple-200">/ {subscription.tier.notices_per_month}</div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (usage.notices_in_allowance / subscription.tier.notices_per_month) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Remaining */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-purple-100 text-sm mb-1">Notices Remaining</div>
              <div className="text-3xl font-bold">
                {Math.max(0, subscription.tier.notices_per_month - usage.notices_in_allowance)}
              </div>
              <div className="text-purple-200 text-sm mt-1">
                {usage.notices_in_allowance >= subscription.tier.notices_per_month
                  ? `Overage: £${subscription.tier.additional_notice_price_gbp.toFixed(2)}/notice`
                  : 'Within allowance'
                }
              </div>
            </div>

            {/* Overage */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-purple-100 text-sm mb-1">Overage This Month</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{usage.notices_overage}</div>
                <div className="text-purple-200">notices</div>
              </div>
              <div className="text-purple-200 text-sm mt-1">
                {formatCurrency(usage.overage_amount_gbp)} additional
              </div>
            </div>
          </div>

          {usage.notices_in_allowance >= subscription.tier.notices_per_month * 0.8 && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-white mb-1">Notice Allowance Alert</p>
                <p className="text-purple-100 text-sm">
                  You've used {Math.round((usage.notices_in_allowance / subscription.tier.notices_per_month) * 100)}% of your monthly allowance.
                  {usage.notices_in_allowance >= subscription.tier.notices_per_month
                    ? ' Additional notices will incur overage charges.'
                    : ' Consider upgrading your plan if you need more notices.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalNotices}</div>
          <div className="text-sm text-gray-600 mt-1">Total Notices</div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.activeNotices}</div>
          <div className="text-sm text-gray-600 mt-1">Active Notices</div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.outstandingBalance)}</div>
          <div className="text-sm text-gray-600 mt-1">Outstanding Balance</div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingPayment}</div>
          <div className="text-sm text-gray-600 mt-1">Pending Payment</div>
        </div>
      </div>

      {/* Quick Publish Widget and Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Publish Widget */}
        <div className="lg:col-span-1">
          <QuickPublishWidget firmId={firm.id} firmSlug={firmSlug} />
        </div>

        {/* Quick Actions - now spans 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 border border-gray-100 h-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={`/f/${firmSlug}/publish`}
            className="flex items-center gap-4 p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Publish Notice</div>
              <div className="text-sm text-gray-600">Create new notice</div>
            </div>
          </Link>

          <Link
            to={`/f/${firmSlug}/billing`}
            className="flex items-center gap-4 p-4 border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Make Payment</div>
              <div className="text-sm text-gray-600">View billing & pay</div>
            </div>
          </Link>

          <Link
            to={`/f/${firmSlug}/notices`}
            className="flex items-center gap-4 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">View All Notices</div>
              <div className="text-sm text-gray-600">Manage notices</div>
            </div>
          </Link>
        </div>
      </div>
        </div>
      </div>

      {/* Recent Notices */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Notices</h2>
            <Link
              to={`/f/${firmSlug}/notices`}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Premises
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Council
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentNotices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No notices yet. Publish your first notice to get started!
                  </td>
                </tr>
              ) : (
                recentNotices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {notice.notice_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notice.premises?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notice.council?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(notice.published_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {notice.billing_amount ? formatCurrency(Number(notice.billing_amount)) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(notice.payment_status)}`}>
                        {notice.payment_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
