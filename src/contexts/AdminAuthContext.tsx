import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';

interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  twoFactorEnabled: boolean;
  sessionId: string;
  ipAllowlist?: string[];
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  twoFactorRequired: boolean;
  sessionExpiresAt: Date | null;
  sessionTimeLeft: number; // minutes remaining
  login: (email: string, password: string) => Promise<{ success: boolean; twoFactorRequired?: boolean; error?: string }>;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Session timeout warning thresholds (in minutes)
const SESSION_DURATION = 120; // 2 hours
const WARNING_THRESHOLD = 10; // Show warning when 10 minutes left

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(SESSION_DURATION);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingLoginEmail = useRef<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem('adminSession');
        if (!storedSession) {
          setLoading(false);
          return;
        }

        const sessionData = JSON.parse(storedSession);
        const response = await fetch('/api/admin/auth/session', {
          headers: {
            'Authorization': `Bearer ${sessionData.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdminUser(data.user);
          setSessionExpiresAt(new Date(data.expiresAt));
          localStorage.setItem('adminSession', JSON.stringify({
            token: sessionData.token,
            expiresAt: data.expiresAt,
          }));
        } else {
          // Session invalid, clear it
          localStorage.removeItem('adminSession');
        }
      } catch (error) {
        console.error('[AdminAuthContext] Error loading session:', error);
        localStorage.removeItem('adminSession');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (!sessionExpiresAt) {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((sessionExpiresAt.getTime() - now.getTime()) / 60000));
      setSessionTimeLeft(timeLeft);

      // Auto-logout when session expires
      if (timeLeft === 0 && adminUser) {
        console.log('[AdminAuthContext] Session expired, logging out');
        logout();
      }

      // Show warning when approaching timeout
      if (timeLeft === WARNING_THRESHOLD) {
        // In a real app, this would trigger a modal/notification
        console.warn(`[AdminAuthContext] Session expires in ${WARNING_THRESHOLD} minutes`);
      }
    };

    // Update immediately
    updateTimeLeft();

    // Update every minute
    sessionCheckInterval.current = setInterval(updateTimeLeft, 60000);

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [sessionExpiresAt, adminUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.twoFactorRequired) {
          // Store email for 2FA verification
          pendingLoginEmail.current = email;
          setTwoFactorRequired(true);
          return { success: true, twoFactorRequired: true };
        }

        // Login successful
        setAdminUser(data.user);
        setSessionExpiresAt(new Date(data.expiresAt));

        // Store session
        localStorage.setItem('adminSession', JSON.stringify({
          token: data.sessionToken,
          expiresAt: data.expiresAt,
        }));

        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Login failed'
      };
    } catch (error) {
      console.error('[AdminAuthContext] Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    try {
      if (!pendingLoginEmail.current) {
        return { success: false, error: 'No pending login' };
      }

      const response = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingLoginEmail.current,
          code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminUser(data.user);
        setSessionExpiresAt(new Date(data.expiresAt));
        setTwoFactorRequired(false);
        pendingLoginEmail.current = null;

        // Store session
        localStorage.setItem('adminSession', JSON.stringify({
          token: data.sessionToken,
          expiresAt: data.expiresAt,
        }));

        return { success: true };
      }

      return {
        success: false,
        error: data.error || '2FA verification failed'
      };
    } catch (error) {
      console.error('[AdminAuthContext] 2FA verification error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);

        // Call logout endpoint
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.token}`,
          },
        });
      }
    } catch (error) {
      console.error('[AdminAuthContext] Logout error:', error);
    } finally {
      // Clear state regardless of API call success
      setAdminUser(null);
      setSessionExpiresAt(null);
      setTwoFactorRequired(false);
      pendingLoginEmail.current = null;
      localStorage.removeItem('adminSession');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      if (!storedSession) return;

      const sessionData = JSON.parse(storedSession);
      const response = await fetch('/api/admin/auth/session', {
        headers: {
          'Authorization': `Bearer ${sessionData.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionExpiresAt(new Date(data.expiresAt));

        // Update stored session
        localStorage.setItem('adminSession', JSON.stringify({
          token: sessionData.token,
          expiresAt: data.expiresAt,
        }));
      }
    } catch (error) {
      console.error('[AdminAuthContext] Session refresh error:', error);
    }
  }, []);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      if (!storedSession) return false;

      const sessionData = JSON.parse(storedSession);
      const response = await fetch('/api/admin/auth/session', {
        headers: {
          'Authorization': `Bearer ${sessionData.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[AdminAuthContext] Session check error:', error);
      return false;
    }
  }, []);

  // IP allowlist check (client-side validation only, real enforcement is server-side)
  useEffect(() => {
    if (!adminUser?.ipAllowlist || adminUser.ipAllowlist.length === 0) return;

    // This is a simplified check - real IP validation happens server-side
    const checkIPAccess = async () => {
      try {
        // In production, you'd get the client IP from a service or header
        // This is just a placeholder for the client-side check
        console.log('[AdminAuthContext] IP allowlist configured:', adminUser.ipAllowlist);
      } catch (error) {
        console.error('[AdminAuthContext] IP check error:', error);
      }
    };

    checkIPAccess();
  }, [adminUser]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        twoFactorRequired,
        sessionExpiresAt,
        sessionTimeLeft,
        login,
        verify2FA,
        logout,
        refreshSession,
        checkSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}