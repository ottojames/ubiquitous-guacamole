import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface DepartmentMembership {
  department_id: string;
  role: string;
  last_accessed_at: string | null;
  department: {
    id: string;
    slug: string;
    name: string;
    type: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  };
}

interface OrganizationMembership {
  organization_id: string;
  role: string;
  organization: {
    id: string;
    name: string;
    type: string;
  };
}

export default function SwitchContext() {
  const [loading, setLoading] = useState(true);
  const [deptMemberships, setDeptMemberships] = useState<DepartmentMembership[]>([]);
  const [orgMemberships, setOrgMemberships] = useState<OrganizationMembership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/sign-in');
        return;
      }

      const userId = session.user.id;

      // Load department memberships
      const { data: deptData, error: deptError } = await supabase
        .from('department_memberships')
        .select(`
          department_id,
          role,
          last_accessed_at,
          department:departments (
            id,
            slug,
            name,
            type,
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

      // Load organization memberships
      const { data: orgData, error: orgError } = await supabase
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

      setDeptMemberships(deptData || []);
      setOrgMemberships(orgData || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load memberships:', err);
      setError(err instanceof Error ? err.message : 'Failed to load memberships');
      setLoading(false);
    }
  };

  const selectDepartment = async (membership: DepartmentMembership) => {
    try {
      // Update last_accessed_at
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from('department_memberships')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('department_id', membership.department_id);

      // Navigate to department dashboard
      const org = membership.department.organization;
      const dept = membership.department;
      navigate(`/c/${org.name.toLowerCase().replace(/\s+/g, '-')}/${dept.slug}/dashboard`);
    } catch (err) {
      console.error('Failed to select department:', err);
    }
  };

  const selectOrganization = (membership: OrganizationMembership) => {
    const org = membership.organization;
    if (org.type === 'firm') {
      navigate(`/f/${org.id}/dashboard`);
    } else {
      // Council org-wide view
      navigate(`/c/${org.id}/all-departments/dashboard`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'org_admin':
      case 'department_admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/auth/sign-in')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Workspace
          </h1>
          <p className="text-gray-600">
            You have access to multiple departments and organizations
          </p>
        </div>

        <div className="space-y-6">
          {/* Organization-Level Access */}
          {orgMemberships && orgMemberships.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Organization Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgMemberships.map((membership) => (
                  <button
                    key={membership.organization_id}
                    onClick={() => selectOrganization(membership)}
                    className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {membership.organization.name}
                        </h3>
                        <p className="text-sm text-purple-600 font-semibold">
                          All Departments
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(membership.role)}`}>
                        {formatRoleName(membership.role)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Department-Level Access */}
          {deptMemberships && deptMemberships.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Department Access
                {deptMemberships.some(m => m.last_accessed_at) && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (most recent first)
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deptMemberships.map((membership) => (
                  <button
                    key={membership.department_id}
                    onClick={() => selectDepartment(membership)}
                    className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left relative"
                  >
                    {membership.last_accessed_at && (
                      <div className="absolute top-4 right-4">
                        <span className="text-xs text-amber-600 font-semibold">★ Recent</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-16">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {membership.department.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {membership.department.organization.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(membership.role)}`}>
                        {formatRoleName(membership.role)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Access */}
          {(!deptMemberships || deptMemberships.length === 0) &&
           (!orgMemberships || orgMemberships.length === 0) && (
            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
              <p className="text-gray-600 mb-4">
                You don't have access to any departments or organizations yet.
              </p>
              <button
                onClick={() => navigate('/onboarding/create-organization')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Organization
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="mt-8 text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth/sign-in');
            }}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
