import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading, canAccessAdmin, session, isPlatformAdmin, adminRole, role } = useAuth();

  // Debug: Log all state on every render
  console.log('[AdminProtectedRoute] Render state:', {
    loading,
    hasUser: !!user,
    userEmail: user?.email,
    hasSession: !!session,
    isPlatformAdmin,
    adminRole,
    role,
    appMetadata: session?.user?.app_metadata,
  });

  useEffect(() => {
    console.log('[AdminProtectedRoute] useEffect triggered:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
    });

    // Don't redirect while still loading auth state
    if (loading) {
      console.log('[AdminProtectedRoute] Still loading, waiting...');
      return;
    }

    // No user - redirect to login
    if (!user) {
      console.log('[AdminProtectedRoute] No user found after loading complete, redirecting to login');
      navigate('/admin/login', { replace: true });
      return;
    }

    // Check admin access using UnifiedAuthContext
    const hasAdminAccess = canAccessAdmin();
    console.log('[AdminProtectedRoute] Admin access check:', {
      email: user.email,
      hasAdminAccess,
      isPlatformAdmin,
      adminRole,
      role,
      appMetadata: session?.user?.app_metadata,
    });

    if (!hasAdminAccess) {
      console.log('[AdminProtectedRoute] No admin access, redirecting to login');
      navigate('/admin/login', { replace: true });
    } else {
      console.log('[AdminProtectedRoute] Admin access granted, rendering children');
    }
  }, [loading, user, canAccessAdmin, navigate, session, isPlatformAdmin, adminRole, role]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not authorized yet - show loading while redirect happens
  if (!user || !canAccessAdmin()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
