import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Shield,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logout, sessionExpiresAt } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Navigation items configuration
  const adminNavItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and metrics'
    },
    {
      label: 'Accounts',
      path: '/admin/accounts',
      icon: Building2,
      description: 'Manage councils & firms'
    },
    {
      label: 'Notices',
      path: '/admin/notices',
      icon: FileText,
      description: 'Monitor all notices'
    },
    {
      label: 'Audit Log',
      path: '/admin/audit',
      icon: Shield,
      description: 'Security & activity logs'
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      icon: Settings,
      description: 'System configuration'
    },
  ];

  // Session timeout monitoring
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiresAt = new Date(sessionExpiresAt).getTime();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        clearInterval(interval);
        logout();
        navigate('/admin/login');
        return;
      }

      // Show warning when 10 minutes remain
      if (remaining < 10 * 60 * 1000) {
        setSessionWarning(true);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setSessionWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, logout, navigate]);

  // Check authentication
  useEffect(() => {
    if (!adminUser) {
      navigate('/admin/login');
    }
  }, [adminUser, navigate]);

  const handleSignOut = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Session Warning Banner */}
      {sessionWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                Session expires in {timeRemaining}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-black text-amber-500 rounded hover:bg-gray-800 transition-colors"
            >
              Refresh Session
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-black border-r border-red-900 transition-all duration-300 z-40 hidden lg:block ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-red-900">
          {sidebarOpen ? (
            <div>
              <h2 className="text-xl font-bold text-red-500">
                Admin Panel
              </h2>
              <div className="mt-3">
                <p className="text-sm text-gray-400">{adminUser.email}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-red-900 text-red-200">
                  {formatRole(adminUser.role)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {adminNavItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded transition-all group ${
                  isActive
                    ? 'bg-red-900 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    {isActive && (
                      <div className="text-xs text-red-300 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-red-900">
          {sidebarOpen ? (
            <div className="space-y-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:bg-gray-900 hover:text-white rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full p-2 text-gray-400 hover:bg-gray-900 hover:text-white rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-2 w-full flex items-center justify-center p-2 text-gray-400 hover:bg-gray-900 hover:text-white rounded transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-red-900 z-40">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="text-lg font-bold text-red-500">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {sessionWarning && (
              <div className="flex items-center gap-1 text-amber-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50 pt-16">
          <div className="bg-gray-900 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              <p className="text-sm text-gray-400">{adminUser.email}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-red-900 text-red-200">
                {formatRole(adminUser.role)}
              </span>
            </div>
            <nav className="p-4 space-y-2">
              {adminNavItems.map((item) => {
                const isActive = isActivePath(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded ${
                      isActive
                        ? 'bg-red-900 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`hidden lg:block fixed top-0 right-0 h-16 bg-gray-900 border-b border-gray-800 transition-all duration-300 ${
        sidebarOpen ? 'left-64' : 'left-20'
      }`}>
        <div className="h-full px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {adminNavItems.find(item => isActivePath(item.path))?.label || 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Session Timer */}
            {sessionWarning ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-900 rounded text-amber-200">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{timeRemaining}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Session Active</span>
              </div>
            )}

            {/* Notification Bell */}
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {adminUser.email.split('@')[0]}
                </div>
                <div className="text-xs text-gray-400">
                  {formatRole(adminUser.role)}
                </div>
              </div>
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {adminUser.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 lg:pt-16 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <div className="p-6 min-h-[calc(100vh-4rem)]">
          <Outlet context={{ adminUser }} />
        </div>
      </main>
    </div>
  );
}