import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading, isInitialized, canAccessAdmin, session, isPlatformAdmin, adminRole, role } = useAuth();

  // Debug: Log all state on every render
  console.log('[AdminProtectedRoute] Render state:', {
    loading,
    isInitialized, // Task 2.3: Key flag to prevent premature redirects
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
      isInitialized, // Task 2.3: Key flag to prevent premature redirects
      hasUser: !!user,
      userEmail: user?.email,
    });

    // Task 2.3: Don't redirect until auth is fully initialized
    // This prevents race condition where loading=false but onAuthStateChange hasn't fired yet
    if (loading || !isInitialized) {
      console.log('[AdminProtectedRoute] Still loading or not initialized, waiting...', { loading, isInitialized });
      return;
    }

    // No user - redirect to login
    if (!user) {
      console.log('[AdminProtectedRoute] No user found after initialization complete, redirecting to login');
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
  }, [loading, isInitialized, user, canAccessAdmin, navigate, session, isPlatformAdmin, adminRole, role]);

  // Task 2.3: Show loading while checking auth state OR while not yet initialized
  // This prevents the redirect loop by ensuring we wait for auth to be fully stable
  if (loading || !isInitialized) {
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
