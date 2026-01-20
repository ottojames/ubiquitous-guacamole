import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading, canAccessAdmin } = useAuth();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (loading) return;

    // No user - redirect to login
    if (!user) {
      console.log('AdminProtectedRoute: No user, redirecting to login');
      navigate('/admin/login', { replace: true });
      return;
    }

    // Check admin access using UnifiedAuthContext
    const hasAdminAccess = canAccessAdmin();
    console.log('AdminProtectedRoute: Checking access', {
      email: user.email,
      hasAdminAccess
    });

    if (!hasAdminAccess) {
      console.log('AdminProtectedRoute: No admin access, redirecting to login');
      navigate('/admin/login', { replace: true });
    }
  }, [loading, user, canAccessAdmin, navigate]);

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
