import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Organization, Department } from '@/types';

interface UnifiedAuthContextType {
  // Core auth
  user: User | null;
  session: Session | null;
  loading: boolean;

  // Organization context - CRITICAL FOR FIXING NOTICES
  organization: Organization | null;
  department: Department | null;
  organizations: Organization[];
  departments: Department[];

  // User metadata
  role: string | null;
  isPlatformAdmin: boolean;
  adminRole: 'super_admin' | 'admin' | 'support' | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  switchDepartment: (deptId: string) => Promise<void>;
  refreshSession: () => Promise<void>;

  // Permissions
  hasPermission: (permission: string) => boolean;
  canAccessAdmin: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Extract metadata from JWT claims
  const appMetadata = session?.user?.app_metadata || {};
  const isPlatformAdmin = appMetadata.is_platform_admin || false;
  const adminRole = appMetadata.admin_role || null;
  const role = appMetadata.role || 'viewer';

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        loadUserContext(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          await loadUserContext(session.user);
        } else {
          clearContext();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserContext = async (user: User) => {
    try {
      const metadata = user.app_metadata || {};
      console.log('Loading context for user:', user.email, metadata);

      // Load organization from metadata or database
      if (metadata.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', metadata.organization_id)
          .single();

        if (org) {
          setOrganization(org);
          console.log('Loaded organization:', org.name);

          // Load departments for councils
          if (org.type === 'council') {
            const { data: depts } = await supabase
              .from('departments')
              .select('*')
              .eq('organization_id', org.id)
              .eq('status', 'active');

            setDepartments(depts || []);

            // Set current department
            if (metadata.department_id) {
              const currentDept = depts?.find(d => d.id === metadata.department_id);
              setDepartment(currentDept || depts?.[0] || null);
            } else if (depts && depts.length > 0) {
              setDepartment(depts[0]);
            }
          }
        }
      }

      // Load all user organizations
      const { data: userOrgs } = await supabase
        .from('organization_memberships')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id);

      if (userOrgs) {
        const orgs = userOrgs
          .map(om => om.organization)
          .filter(Boolean) as Organization[];
        setOrganizations(orgs);

        // If no org set yet, use first one
        if (!organization && orgs.length > 0) {
          setOrganization(orgs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const clearContext = () => {
    setOrganization(null);
    setDepartment(null);
    setOrganizations([]);
    setDepartments([]);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearContext();
  };

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setOrganization(org);
      // Reload departments if council
      if (org.type === 'council') {
        const { data: depts } = await supabase
          .from('departments')
          .select('*')
          .eq('organization_id', org.id)
          .eq('status', 'active');
        setDepartments(depts || []);
        setDepartment(depts?.[0] || null);
      }
    }
  };

  const switchDepartment = async (deptId: string) => {
    const newDept = departments.find(d => d.id === deptId);
    if (newDept) {
      setDepartment(newDept);
      // Update last accessed
      await supabase
        .from('department_memberships')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('department_id', deptId);
    }
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    setSession(session);
    if (session?.user) {
      await loadUserContext(session.user);
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Platform admins have all permissions
    if (isPlatformAdmin) return true;

    // Implement role-based permission checking
    const permissions: Record<string, string[]> = {
      'admin': ['manage_notices', 'manage_users', 'view_analytics', 'manage_departments'],
      'editor': ['create_notices', 'edit_notices', 'view_analytics'],
      'viewer': ['view_notices', 'view_analytics']
    };

    const userRole = role || 'viewer';
    return permissions[userRole]?.includes(permission) || false;
  };

  const canAccessAdmin = (): boolean => {
    return isPlatformAdmin;
  };

  const value = {
    user,
    session,
    loading,
    organization,
    department,
    organizations,
    departments,
    role,
    isPlatformAdmin,
    adminRole,
    signIn,
    signOut,
    switchOrganization,
    switchDepartment,
    refreshSession,
    hasPermission,
    canAccessAdmin,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within UnifiedAuthProvider');
  }
  return context;
}

// Export for backward compatibility during migration
export { UnifiedAuthContext };