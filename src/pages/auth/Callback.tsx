import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Membership {
  department_id: string;
  department: {
    id: string;
    slug: string;
    name: string;
    organization_id: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  };
  role: string;
  last_accessed_at: string | null;
}

export default function Callback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Verify authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No session found');
      }

      const userId = session.user.id;

      // Get department memberships
      const { data: deptMemberships, error: deptError } = await supabase
        .from('department_memberships')
        .select(`
          department_id,
          role,
          last_accessed_at,
          department:departments (
            id,
            slug,
            name,
            organization_id,
            organization:organizations (
              id,
              name,
              type
            )
          )
        `)
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false, nullsFirst: false });

      if (deptError) throw deptError;

      // Get organization memberships (for org-level admin access)
      const { data: orgMemberships, error: orgError } = await supabase
        .from('organization_memberships')
        .select(`
          organization_id,
          role,
          organization:organizations (
            id,
            name,
            type
          )
        `)
        .eq('user_id', userId);

      if (orgError) throw orgError;

      // Routing logic based on memberships
      if (!deptMemberships || deptMemberships.length === 0) {
        if (!orgMemberships || orgMemberships.length === 0) {
          // No memberships - redirect to create organization
          navigate('/onboarding/create-organization');
          return;
        }

        // Has org membership but no dept membership
        // Check if org is a firm (firms don't have departments)
        const org = orgMemberships[0].organization;
        if (org.type === 'firm') {
          navigate(`/f/${org.id}/dashboard`);
          return;
        }

        // Council with no departments - show org overview
        navigate(`/c/${org.id}/all-departments/dashboard`);
        return;
      }

      // Has department memberships
      if (deptMemberships.length === 1) {
        // Single department - go directly to dashboard
        const dept = deptMemberships[0].department;
        const org = dept.organization;
        navigate(`/c/${org.name.toLowerCase().replace(/\s+/g, '-')}/${dept.slug}/dashboard`);
        return;
      }

      // Multiple departments - show context switcher
      navigate('/switch-context');

    } catch (err) {
      console.error('Callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>

              <button
                onClick={() => navigate('/auth/sign-in')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
