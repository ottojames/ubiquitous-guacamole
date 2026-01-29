import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { isDemoModeEnabled, DEMO_ACCOUNTS } from '@/lib/demoMode';

interface CouncilProtectedRouteProps {
  children: React.ReactNode;
}

interface DepartmentMembership {
  department_id: string;
  role: string;
  department: {
    id: string;
    slug: string;
    organization: {
      id: string;
      slug: string;
      type: string;
    };
  };
}

interface OrganizationMembership {
  organization_id: string;
  role: string;
  organization: {
    id: string;
    slug: string;
    type: string;
  };
}

/**
 * CouncilProtectedRoute - Protects council portal routes
 *
 * Ensures:
 * 1. User is authenticated
 * 2. User has department membership OR organization membership for the requested council
 * 3. Loading states don't cause redirect loops (uses isInitialized)
 *
 * Handles:
 * - User with org membership but no department membership → shows department picker
 * - User with department membership → allows access
 * - User without any access → redirects to council login
 */
export default function CouncilProtectedRoute({ children }: CouncilProtectedRouteProps) {
  const navigate = useNavigate();
  const { orgSlug, deptSlug } = useParams<{ orgSlug: string; deptSlug: string }>();
  const { user, loading: authLoading, isInitialized, session } = useAuth();

  // Local state for membership verification
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Debug logging
  console.log('[CouncilProtectedRoute] Render state:', {
    authLoading,
    isInitialized,
    hasUser: !!user,
    userEmail: user?.email,
    orgSlug,
    deptSlug,
    membershipLoading,
    hasAccess,
    accessError,
  });

  useEffect(() => {
    console.log('[CouncilProtectedRoute] useEffect triggered:', {
      authLoading,
      isInitialized,
      hasUser: !!user,
      hasSession: !!session,
    });

    // Don't check membership until auth is fully initialized
    if (authLoading || !isInitialized) {
      console.log('[CouncilProtectedRoute] Auth still loading or not initialized, waiting...');
      return;
    }

    // No user - redirect to council login
    if (!user || !session) {
      console.log('[CouncilProtectedRoute] No user found, redirecting to council login');
      navigate('/auth/council-login', { replace: true });
      return;
    }

    // Check membership for this council
    checkMembership();
  }, [authLoading, isInitialized, user, session, orgSlug, deptSlug]);

  const checkMembership = async () => {
    if (!session?.user?.id || !orgSlug) {
      setMembershipLoading(false);
      setAccessError('Invalid session or organization');
      return;
    }

    console.log('[CouncilProtectedRoute] Checking membership for:', {
      userId: session.user.id,
      orgSlug,
      deptSlug,
    });

    try {
      // Demo mode check - allow demo accounts through ONLY when demo mode is enabled
      if (isDemoModeEnabled()) {
        const demoAccountEmails = DEMO_ACCOUNTS.council.map(acc => acc.email.toLowerCase());
        if (demoAccountEmails.includes(session.user.email?.toLowerCase() || '')) {
          console.log('[CouncilProtectedRoute] Demo mode active + demo account detected, granting access');
          setHasAccess(true);
          setMembershipLoading(false);
          return;
        }
      }

      // First, look up the organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, type')
        .eq('slug', orgSlug)
        .eq('type', 'council')
        .single();

      if (orgError || !orgData) {
        console.log('[CouncilProtectedRoute] Organization not found:', orgSlug);
        setAccessError(`Council "${orgSlug}" not found`);
        setMembershipLoading(false);
        return;
      }

      // Check organization membership
      const { data: orgMembership, error: orgMembershipError } = await supabase
        .from('organization_memberships')
        .select('organization_id, role')
        .eq('user_id', session.user.id)
        .eq('organization_id', orgData.id)
        .single();

      const hasOrgMembership = !orgMembershipError && !!orgMembership;
      console.log('[CouncilProtectedRoute] Org membership check:', { hasOrgMembership, orgMembership });

      // If we have a department slug, check department membership
      if (deptSlug) {
        // Look up department
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, slug')
          .eq('organization_id', orgData.id)
          .eq('slug', deptSlug)
          .single();

        if (deptError || !deptData) {
          console.log('[CouncilProtectedRoute] Department not found:', deptSlug);

          // If user has org membership but department doesn't exist, redirect to department picker
          if (hasOrgMembership) {
            console.log('[CouncilProtectedRoute] User has org access but dept not found, redirecting to picker');
            navigate('/switch-department', {
              replace: true,
              state: { orgId: orgData.id, orgSlug, message: `Department "${deptSlug}" not found` }
            });
            return;
          }

          setAccessError(`Department "${deptSlug}" not found`);
          setMembershipLoading(false);
          return;
        }

        // Check department membership
        const { data: deptMembership, error: deptMembershipError } = await supabase
          .from('department_memberships')
          .select('department_id, role')
          .eq('user_id', session.user.id)
          .eq('department_id', deptData.id)
          .single();

        const hasDeptMembership = !deptMembershipError && !!deptMembership;
        console.log('[CouncilProtectedRoute] Dept membership check:', { hasDeptMembership, deptMembership });

        // Access granted if user has org membership OR department membership
        if (hasOrgMembership || hasDeptMembership) {
          console.log('[CouncilProtectedRoute] Access granted via:', hasOrgMembership ? 'org membership' : 'dept membership');
          setHasAccess(true);
          setMembershipLoading(false);
          return;
        }

        // No access to this specific department
        console.log('[CouncilProtectedRoute] No membership found for user');
        setAccessError('You do not have access to this department');
        setMembershipLoading(false);
        return;
      }

      // No department slug - just checking org access
      if (hasOrgMembership) {
        console.log('[CouncilProtectedRoute] Access granted via org membership (no dept slug)');
        setHasAccess(true);
        setMembershipLoading(false);
        return;
      }

      // Check if user has ANY department membership in this org
      const { data: anyDeptMembership, error: anyDeptError } = await supabase
        .from('department_memberships')
        .select(`
          department_id,
          role,
          departments!inner (
            id,
            slug,
            organization_id
          )
        `)
        .eq('user_id', session.user.id);

      if (!anyDeptError && anyDeptMembership) {
        // Filter to departments in this organization
        const orgDeptMemberships = anyDeptMembership.filter((m: any) =>
          m.departments?.organization_id === orgData.id
        );

        if (orgDeptMemberships.length > 0) {
          console.log('[CouncilProtectedRoute] User has dept membership in this org, redirecting to department picker');
          navigate('/switch-department', {
            replace: true,
            state: { orgId: orgData.id, orgSlug }
          });
          return;
        }
      }

      // No access at all
      setAccessError('You do not have access to this council');
      setMembershipLoading(false);

    } catch (err) {
      console.error('[CouncilProtectedRoute] Error checking membership:', err);
      setAccessError('Error verifying access. Please try again.');
      setMembershipLoading(false);
    }
  };

  // Show loading while checking auth state OR membership
  if (authLoading || !isInitialized || membershipLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying council access...</p>
        </div>
      </div>
    );
  }

  // Show error if access denied
  if (accessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{accessError}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/council-login', { replace: true })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign in to a different account
            </button>
            <button
              onClick={() => navigate('/switch-department')}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Switch department
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authorized yet - show loading while redirect happens
  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
