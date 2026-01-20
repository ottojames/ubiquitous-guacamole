import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/UnifiedAuthContext';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  notice_count: number;
  has_access: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface LocationState {
  error?: string;
}

export default function DepartmentSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading, isInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentOrg, setCurrentOrg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check for error from redirect
  const locationState = location.state as LocationState | null;

  useEffect(() => {
    if (locationState?.error) {
      setErrorMessage(locationState.error);
    }
  }, [locationState]);

  useEffect(() => {
    // Wait for auth to finish loading before loading department data
    if (!authLoading && isInitialized) {
      loadDepartments();
    }
  }, [authLoading, isInitialized, user]);

  const loadDepartments = async () => {
    try {
      // Demo mode accounts for testing
      const demoAccounts = [
        'licensing@westminster.gov.uk',
        'licensing@sampletonborough.gov.uk',
        'solicitor@wilsonpartners.com'
      ];

      const isAuthenticatedDemoAccount = session && session.user.email &&
        demoAccounts.includes(session.user.email.toLowerCase());

      // If no user and not demo mode, redirect to login
      if (!user && !isAuthenticatedDemoAccount) {
        navigate('/auth/council-login');
        return;
      }

      // For demo accounts or unauthenticated demo mode, show Westminster departments
      if (!user || isAuthenticatedDemoAccount) {
        await loadDemoDepartments();
        return;
      }

      // Authenticated user: Load departments from their memberships
      // First, check department_memberships
      const { data: deptMemberships, error: deptError } = await supabase
        .from('department_memberships')
        .select(`
          role,
          department:departments!inner(
            id,
            name,
            slug,
            type,
            organization:organizations!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id);

      if (deptError && deptError.code !== 'PGRST116') {
        console.error('Error loading department memberships:', deptError);
      }

      // Also check organization-level memberships (grants access to all departments in org)
      const { data: orgMemberships, error: orgError } = await supabase
        .from('organization_memberships')
        .select(`
          role,
          organization:organizations!inner(
            id,
            name,
            slug,
            type
          )
        `)
        .eq('user_id', user.id);

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('Error loading organization memberships:', orgError);
      }

      // Build a set of departments user has access to
      const accessibleDeptIds = new Set<string>();
      const departmentsList: Department[] = [];

      // Process direct department memberships
      if (deptMemberships && deptMemberships.length > 0) {
        for (const membership of deptMemberships) {
          const dept = membership.department as unknown as {
            id: string;
            name: string;
            slug: string;
            type: string;
            organization: { id: string; name: string; slug: string };
          };

          if (dept && dept.organization) {
            accessibleDeptIds.add(dept.id);

            // Get notice count for this department
            const { count } = await supabase
              .from('notices')
              .select('*', { count: 'exact', head: true })
              .eq('department_id', dept.id);

            departmentsList.push({
              id: dept.id,
              name: dept.name,
              slug: dept.slug,
              type: dept.type,
              notice_count: count || 0,
              has_access: true,
              organization: {
                id: dept.organization.id,
                name: dept.organization.name,
                slug: dept.organization.slug
              }
            });
          }
        }
      }

      // Process organization memberships - get all departments in those orgs
      if (orgMemberships && orgMemberships.length > 0) {
        for (const membership of orgMemberships) {
          const org = membership.organization as unknown as {
            id: string;
            name: string;
            slug: string;
            type: string;
          };

          // Only process council organizations
          if (org && org.type === 'council') {
            // Load all departments for this organization
            const { data: orgDepts } = await supabase
              .from('departments')
              .select('id, name, slug, type')
              .eq('organization_id', org.id)
              .order('name');

            if (orgDepts) {
              for (const dept of orgDepts) {
                // Skip if already added from department membership
                if (accessibleDeptIds.has(dept.id)) continue;

                accessibleDeptIds.add(dept.id);

                // Get notice count for this department
                const { count } = await supabase
                  .from('notices')
                  .select('*', { count: 'exact', head: true })
                  .eq('department_id', dept.id);

                departmentsList.push({
                  id: dept.id,
                  name: dept.name,
                  slug: dept.slug,
                  type: dept.type,
                  notice_count: count || 0,
                  has_access: true,
                  organization: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug
                  }
                });
              }
            }
          }
        }
      }

      // If user has no departments, show message
      if (departmentsList.length === 0) {
        setErrorMessage('You do not have access to any council departments. Please contact your administrator.');
        setLoading(false);
        return;
      }

      // Group by organization for display
      const orgNames = [...new Set(departmentsList.map(d => d.organization.name))];
      setCurrentOrg(orgNames.length === 1 ? orgNames[0] : `${orgNames.length} organizations`);
      setDepartments(departmentsList);
      setLoading(false);

    } catch (error) {
      console.error('Error loading departments:', error);
      setErrorMessage('Failed to load departments. Please try again.');
      setLoading(false);
    }
  };

  // Fallback for demo mode - shows Westminster departments
  const loadDemoDepartments = async () => {
    const westminsterOrg = {
      id: 'fb76a8aa-4e3d-40ac-9c61-e9217ed930a4',
      name: 'Westminster (City of) Council',
      slug: 'westminster-city-of-council'
    };

    const { data: depts } = await supabase
      .from('departments')
      .select('id, name, slug, type')
      .eq('organization_id', westminsterOrg.id)
      .order('name');

    if (depts) {
      const deptsWithAccess = await Promise.all(
        depts.map(async (dept) => {
          const { count } = await supabase
            .from('notices')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);

          // For demo: Allow access to Licensing and Planning departments
          const hasAccess = dept.slug === 'licensing' || dept.slug === 'planning' || dept.type === 'planning';

          return {
            ...dept,
            notice_count: count || 0,
            has_access: hasAccess,
            organization: westminsterOrg
          };
        })
      );

      setDepartments(deptsWithAccess);
      setCurrentOrg(westminsterOrg.name);
    }

    setLoading(false);
  };

  const handleSelectDepartment = (dept: Department) => {
    if (!dept.has_access) {
      // Show access denied message
      alert(`Access Denied\n\nYou do not have permission to access the ${dept.name} department.\n\nYour role: Licensing Officer\nYour department: Licensing\n\nContact your administrator if you need access to other departments.`);
      return;
    }

    // Navigate to the department
    navigate(`/c/${dept.organization.slug}/${dept.slug}/dashboard`);
  };

  const getDepartmentIcon = (type: string) => {
    switch (type) {
      case 'licensing':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'traffic':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'planning':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Show loading while auth or data is loading
  if (authLoading || !isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Switch Department</h1>
          {currentOrg && <p className="text-gray-600 mt-2">{currentOrg}</p>}
          {departments.length > 1 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold">Multi-Department Access</span>
            </div>
          )}
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleSelectDepartment(dept)}
              disabled={!dept.has_access}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                dept.has_access
                  ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-lg cursor-pointer'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Access Badge */}
              {dept.has_access ? (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access
                  </span>
                </div>
              ) : (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    No Access
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 ${dept.has_access ? 'text-blue-600' : 'text-gray-400'}`}>
                {getDepartmentIcon(dept.type)}
              </div>

              {/* Department Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{dept.name}</h3>

              {/* Notice Count */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{dept.notice_count} active notices</span>
              </div>

              {/* Access Message */}
              {!dept.has_access && (
                <p className="mt-4 text-xs text-gray-500">
                  Contact your administrator for access
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Info Box */}
        {departments.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Department Access Control</h4>
                <p className="text-sm text-gray-700">
                  You have access to <strong>{departments.filter(d => d.has_access).length} department{departments.filter(d => d.has_access).length !== 1 ? 's' : ''}</strong>.
                  This ensures proper separation of duties and data security across different council functions.
                  If you need access to additional departments, please contact your department administrator or IT support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Departments Message */}
        {departments.length === 0 && !errorMessage && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Departments Available</h3>
            <p className="text-gray-600 mb-4">
              You haven't been assigned to any council departments yet.
            </p>
            <button
              onClick={() => navigate('/auth/council-login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
