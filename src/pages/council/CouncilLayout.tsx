import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
    slug?: string;
  };
}

interface UserMembership {
  role: string;
  department_id: string;
}

export default function CouncilLayout() {
  const { orgSlug, deptSlug } = useParams<{ orgSlug: string; deptSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadDepartmentData();
  }, [orgSlug, deptSlug]);

  const loadDepartmentData = async () => {
    try {
      // Check for demo mode first
      const isDemoSampleBorough = orgSlug === 'sample-borough' && deptSlug === 'licensing';
      const isDemoWestminster = orgSlug === 'westminster' && deptSlug === 'licensing';

      if (isDemoSampleBorough || isDemoWestminster) {
        // Set mock department data for demo
        const mockDepartment = {
          id: isDemoSampleBorough ? 'demo-sample-borough-id' : 'demo-westminster-id',
          name: isDemoSampleBorough ? 'Licensing Department' : 'Westminster Licensing',
          slug: deptSlug!,
          type: 'licensing',
          organization: {
            id: isDemoSampleBorough ? 'sample-borough-org-id' : 'westminster-org-id',
            name: isDemoSampleBorough ? 'Sample Borough Council' : 'Westminster Council',
            slug: orgSlug
          }
        };

        setDepartment(mockDepartment as Department);
        setUserRole('org_admin');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/sign-in');
        return;
      }

      // Query department with organization data
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          slug,
          type,
          organization:organizations (
            id,
            name
          )
        `)
        .eq('slug', deptSlug)
        .single();

      if (deptError) throw deptError;
      if (!deptData) throw new Error('Department not found');

      // Check user has access to this department
      const { data: membership, error: membershipError } = await supabase
        .from('department_memberships')
        .select('role, department_id')
        .eq('user_id', session.user.id)
        .eq('department_id', deptData.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      // Also check org-level access
      const { data: orgMembership } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('organization_id', deptData.organization.id)
        .single();

      if (!membership && !orgMembership) {
        throw new Error('You do not have access to this department');
      }

      const role = orgMembership?.role || membership?.role || 'viewer';

      setDepartment(deptData as Department);
      setUserRole(role);
      setLoading(false);

      // Update last accessed
      if (membership) {
        await supabase
          .from('department_memberships')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .eq('department_id', deptData.id);
      }
    } catch (err) {
      console.error('Failed to load department:', err);
      navigate('/switch-context');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/sign-in');
  };

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isActivePath = (path: string) => {
    return location.pathname.includes(path);
  };

  const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: 'notices', label: 'Notices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: 'templates', label: 'Templates', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { path: 'team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!department) {
    return null;
  }

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {department.name}
              </h2>
              <p className="text-sm text-gray-600 truncate">
                {department.organization.name}
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {formatRoleName(userRole)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {department.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const fullPath = `${basePath}/${item.path}`;
            const isActive = isActivePath(item.path);

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d={item.icon} />
                </svg>
                {sidebarOpen && (
                  <span className="font-semibold">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="space-y-2">
              <Link
                to="/switch-context"
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl text-center font-semibold"
              >
                Switch Department
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/switch-context"
                className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-xl"
                title="Switch Department"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-xl w-full"
                title="Sign Out"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-2 w-full flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100 rounded-xl"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-6">
          <Outlet context={{ department, userRole }} />
        </div>
      </main>
    </div>
  );
}
