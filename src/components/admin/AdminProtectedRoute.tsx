import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        // Get current session directly from Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          console.log('AdminProtectedRoute: No session, redirecting to login');
          navigate('/admin/login', { replace: true });
          return;
        }

        // Check admin access from session metadata
        const appMetadata = session.user?.app_metadata || {};
        const isPlatformAdmin = appMetadata.is_platform_admin === true;
        const adminRole = appMetadata.admin_role;
        const hasAdminAccess = isPlatformAdmin || adminRole === 'super_admin' || adminRole === 'admin';

        console.log('AdminProtectedRoute: Checking access', {
          email: session.user?.email,
          isPlatformAdmin,
          adminRole,
          hasAdminAccess
        });

        if (hasAdminAccess) {
          setIsAuthorized(true);
        } else {
          console.log('AdminProtectedRoute: No admin access, redirecting to login');
          navigate('/admin/login', { replace: true });
        }
      } catch (error) {
        console.error('AdminProtectedRoute: Error checking access', error);
        if (mounted) {
          navigate('/admin/login', { replace: true });
        }
      }
    }

    checkAccess();

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        navigate('/admin/login', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading while checking
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
