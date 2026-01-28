import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';
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

// P0-003: Council portal usage stats (replaces mock billing)
interface UsageStats {
  notices_viewed_this_month: number;
  representations_managed: number;
  evidence_packs_downloaded: number;
  last_activity: string | null;
}

// P0-003: Complete rewrite - Council portal is FREE, show usage stats instead of mock billing
export default function Billing() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageStats();
  }, [department.id]);

  const loadUsageStats = async () => {
    try {
      setLoading(true);

      // Fetch real usage stats from database
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get notices viewed this month (notices in department's jurisdiction)
      const { count: noticesCount } = await supabase
        .from('notices')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', department.id);

      // Get representations managed
      const { count: repsCount } = await supabase
        .from('representations')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', department.id);

      // Get evidence packs downloaded (from audit logs if available)
      const { count: evidenceCount } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', department.id)
        .eq('action', 'evidence_pack_downloaded')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get last activity
      const { data: lastActivity } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('department_id', department.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUsageStats({
        notices_viewed_this_month: noticesCount || 0,
        representations_managed: repsCount || 0,
        evidence_packs_downloaded: evidenceCount || 0,
        last_activity: lastActivity?.created_at || null
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      // Don't show error for empty stats - just show zeros
      setUsageStats({
        notices_viewed_this_month: 0,
        representations_managed: 0,
        evidence_packs_downloaded: 0,
        last_activity: null
      });
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No activity yet';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canManageBilling = hasPermission(PERMISSIONS.BILLING_MANAGE);

  if (!canManageBilling) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to view billing information.</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portal Usage</h1>
        <p className="text-gray-600 mt-1">
          View your council portal usage and activity
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Free Portal Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold">Free Council Portal</h2>
            </div>
            <p className="text-green-100 max-w-lg">
              Your council has free access to view notices, manage representations, and download evidence packs.
              No subscription required.
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">£0</p>
            <p className="text-green-100">per month</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">Notices in Portal</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{usageStats?.notices_viewed_this_month || 0}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">Representations</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{usageStats?.representations_managed || 0}</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">Evidence Packs</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{usageStats?.evidence_packs_downloaded || 0}</p>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">Last Activity</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDate(usageStats?.last_activity || null)}</p>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What's Included</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'View all published notices in your jurisdiction',
            'Receive and manage public representations',
            'Internal commenting and collaboration',
            'Download evidence packs for hearings',
            'Audit trail and compliance logging',
            'Unlimited team members',
            'Email notifications',
            'Export data to CSV'
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Want to Publish Notices?</h3>
            <p className="text-gray-700 text-sm">
              If your council wants to publish notices directly through Civic Notices (rather than receiving them from applicants),
              publication is available at £19.99 per notice. Contact us at{' '}
              <a href="mailto:councils@civicnotices.co.uk" className="text-blue-600 hover:underline">
                councils@civicnotices.co.uk
              </a>{' '}
              to learn more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
