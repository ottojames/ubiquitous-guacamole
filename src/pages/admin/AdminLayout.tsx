import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/sign-in');
        return;
      }

      // TODO: Add proper admin role checking in profiles table
      // For now, we'll just verify they're authenticated
      setUserEmail(session.user.email || 'Admin');
      setLoading(false);
    } catch (err) {
      console.error('Failed to verify admin access:', err);
      navigate('/auth/sign-in');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/sign-in');
  };

  const isActivePath = (path: string) => {
    return location.pathname.includes(path);
  };

  const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: 'organizations', label: 'Organizations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: 'submissions', label: 'All Submissions', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
    { path: 'analytics', label: 'System Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { path: 'settings', label: 'Platform Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
              <h2 className="text-lg font-bold text-gray-900">Platform Admin</h2>
              <p className="text-sm text-gray-600 truncate">{userEmail}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                Super Admin
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const fullPath = `/admin/${item.path}`;
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
                {sidebarOpen && <span className="font-semibold">{item.label}</span>}
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
                Exit Admin
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
                title="Exit Admin"
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
