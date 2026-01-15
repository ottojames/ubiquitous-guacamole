import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface UserMembership {
  role: string;
  organization_id: string;
}

export default function FirmLayout() {
  const { firmSlug } = useParams<{ firmSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut: authSignOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firm, setFirm] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadFirmData();
  }, [firmSlug]);

  const loadFirmData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/auth/sign-in');
        return;
      }

      // Look up firm by slug
      const { data: firmData, error: firmError } = await supabase
        .from('organizations')
        .select('id, name, slug, type')
        .eq('slug', firmSlug)
        .eq('type', 'firm')
        .single();

      if (firmError || !firmData) {
        throw new Error(`Firm not found: ${firmSlug}`);
      }

      // Check user has access to this firm
      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('role, organization_id')
        .eq('user_id', session.user.id)
        .eq('organization_id', firmData.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (!membership) {
        throw new Error('You do not have access to this firm');
      }

      const role = membership.role || 'viewer';

      setFirm(firmData as Organization);
      setUserRole(role);
      setLoading(false);

      // Save firm context for publish flow
      sessionStorage.setItem('lastAccessedFirm', JSON.stringify({ slug: firmData.slug }));

      // Update last accessed
      await supabase
        .from('organization_memberships')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('organization_id', firmData.id);
    } catch (err) {
      console.error('Failed to load firm:', err);
      navigate('/switch-context');
    }
  };

  const handleSignOut = async () => {
    await authSignOut();
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
    { path: 'clients', label: 'Clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: 'notices', label: 'Notices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: 'bulk-upload', label: 'Bulk Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { path: 'billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
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

  if (!firm) {
    return null;
  }

  const basePath = `/f/${firmSlug}`;

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
                {firm.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Law Firm Portal
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                {formatRoleName(userRole)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {firm.name.charAt(0)}
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
                    ? 'bg-purple-600 text-white shadow-lg'
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
                Switch Organization
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
                title="Switch Organization"
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
          <Outlet context={{ firm, userRole }} />
        </div>
      </main>
    </div>
  );
}
