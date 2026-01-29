import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Organization, Department } from '@/types';
import type { PermissionName, RoleName } from '@/types/permissions';
import { PERMISSIONS, ROLES } from '@/types/permissions';
import { getAuthErrorMessage } from '@/lib/authErrors';

// User type based on authentication status and organization membership
export type UserType = 'anonymous' | 'council_staff' | 'firm_staff' | 'platform_admin';

// Organization type for the current user's organization
export type OrganizationType = 'council' | 'firm' | null;

interface UnifiedAuthContextType {
  // Core auth
  user: User | null;
  session: Session | null;
  loading: boolean;
  isInitialized: boolean; // True after initial auth state is fully loaded (Task 2.3)

  // Organization context - CRITICAL FOR FIXING NOTICES
  organization: Organization | null;
  department: Department | null;
  organizations: Organization[];
  departments: Department[];

  // User metadata
  role: string | null;
  isPlatformAdmin: boolean;
  adminRole: 'super_admin' | 'admin' | 'support' | null;

  // New user type fields (Task 1.2)
  userType: UserType;
  organizationType: OrganizationType;

  // Department-level permissions (from legacy AuthContext)
  permissions: PermissionName[];
  departmentId: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  switchDepartment: (deptId: string) => Promise<void>;
  refreshSession: () => Promise<void>;

  // Permission loading (from legacy AuthContext)
  loadPermissions: (departmentId: string, demoRole?: RoleName) => Promise<void>;

  // Permissions
  hasPermission: (permission: string | PermissionName) => boolean;
  hasAnyPermission: (...permissions: PermissionName[]) => boolean;
  hasAllPermissions: (...permissions: PermissionName[]) => boolean;
  canAccessAdmin: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Task 2.3: Prevents premature redirects
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Department-level permissions state (from legacy AuthContext)
  const [permissions, setPermissions] = useState<PermissionName[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  // Extract metadata from JWT claims
  const appMetadata = session?.user?.app_metadata || {};
  const isPlatformAdmin = appMetadata.is_platform_admin || false;
  const adminRole = appMetadata.admin_role || null;
  const role = appMetadata.role || 'viewer';

  // Compute userType based on auth state and organization
  const userType: UserType = (() => {
    if (!user) return 'anonymous';
    if (isPlatformAdmin) return 'platform_admin';
    if (organization?.type === 'council') return 'council_staff';
    if (organization?.type === 'firm') return 'firm_staff';
    return 'anonymous';
  })();

  // Compute organizationType from current organization
  const organizationType: OrganizationType = organization?.type === 'council' || organization?.type === 'firm'
    ? organization.type
    : null;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        await loadUserContext(session.user);
      }
      setLoading(false);
      setIsInitialized(true); // Task 2.3: Mark as initialized after initial load
      console.log('[UnifiedAuthContext] Initial auth state loaded:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        isInitialized: true,
      });
    }).catch((error) => {
      // Task 7.1: Handle auth initialization errors gracefully
      console.error('[UnifiedAuthContext] Failed to get initial session:', error);
      setLoading(false);
      setIsInitialized(true);
      // User will be in logged-out state; any subsequent auth actions will work normally
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[UnifiedAuthContext v2] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        // IMPORTANT: Don't await - let this run in background so signInWithPassword can return
        if (session) {
          // Fire and forget - don't block the auth state change
          loadUserContext(session.user).catch(err => {
            console.error('[UnifiedAuthContext] Error loading user context:', err);
          });
        } else {
          clearContext();
        }

        setLoading(false);
        setIsInitialized(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserContext = async (user: User) => {
    try {
      const metadata = user.app_metadata || {};
      console.log('[UnifiedAuthContext] Loading context for user:', user.email, metadata);

      // Load organization from metadata or database
      if (metadata.organization_id) {
        console.log('[UnifiedAuthContext] Fetching org from metadata.organization_id:', metadata.organization_id);
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', metadata.organization_id)
          .single();

        if (orgErr) {
          console.error('[UnifiedAuthContext] Error fetching org:', orgErr);
        } else if (org) {
          setOrganization(org);
          console.log('[UnifiedAuthContext] Loaded organization:', org.name);

          // Load departments for councils
          if (org.type === 'council') {
            console.log('[UnifiedAuthContext] Fetching departments for council:', org.id);
            const { data: depts, error: deptErr } = await supabase
              .from('departments')
              .select('*')
              .eq('organization_id', org.id)
              .eq('status', 'active');

            if (deptErr) {
              console.error('[UnifiedAuthContext] Error fetching departments:', deptErr);
            }
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
      } else {
        console.log('[UnifiedAuthContext] No organization_id in metadata, skipping org load from metadata');
      }

      // Load all user organizations
      console.log('[UnifiedAuthContext] Fetching all user organizations for user_id:', user.id);
      const { data: userOrgs, error: userOrgsErr } = await supabase
        .from('organization_memberships')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id);

      if (userOrgsErr) {
        console.error('[UnifiedAuthContext] Error fetching user orgs:', userOrgsErr);
      }

      console.log('[UnifiedAuthContext] User orgs result:', userOrgs?.length || 0, 'memberships');

      if (userOrgs) {
        const orgs = userOrgs
          .map(om => om.organization)
          .filter(Boolean) as Organization[];
        setOrganizations(orgs);
        console.log('[UnifiedAuthContext] Set organizations:', orgs.length);

        // If no org set yet, use first one
        if (!organization && orgs.length > 0) {
          setOrganization(orgs[0]);
          console.log('[UnifiedAuthContext] Set default organization:', orgs[0]?.name);
        }
      }

      console.log('[UnifiedAuthContext] loadUserContext completed successfully');
    } catch (error) {
      console.error('[UnifiedAuthContext] Error loading user context:', error);
    }
  };

  const clearContext = () => {
    setOrganization(null);
    setDepartment(null);
    setOrganizations([]);
    setDepartments([]);
    // Clear department-level permissions
    setPermissions([]);
    setDepartmentId(null);
  };

  // Handle post-login redirect based on stored portal type
  const handleLoginRedirect = async (user: User) => {
    console.log('[UnifiedAuthContext] handleLoginRedirect called for user:', user.email);

    const portalType = sessionStorage.getItem('login_portal_type');
    console.log('[UnifiedAuthContext] Portal type from sessionStorage:', portalType);

    // Clear the stored portal type immediately to prevent redirect loops
    sessionStorage.removeItem('login_portal_type');
    sessionStorage.removeItem('login_remember_me');

    if (!portalType) {
      console.log('[UnifiedAuthContext] No portal type stored, skipping redirect');
      return;
    }

    console.log('[UnifiedAuthContext] Handling login redirect for portal:', portalType);

    try {
      if (portalType === 'council') {
        // Council portal: Get user's department membership
        const { data: membership, error: membershipError } = await supabase
          .from('department_memberships')
          .select('department_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (membershipError || !membership) {
          console.error('[UnifiedAuthContext] No council access found:', membershipError);
          // Sign out and let user know
          await supabase.auth.signOut();
          window.location.href = '/login?error=no_council_access';
          return;
        }

        // Get department details
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('slug, organization_id')
          .eq('id', membership.department_id)
          .single();

        if (deptError || !department) {
          console.error('[UnifiedAuthContext] Department not found:', deptError);
          await supabase.auth.signOut();
          window.location.href = '/login?error=department_not_found';
          return;
        }

        // Get organization details
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .select('slug, type')
          .eq('id', department.organization_id)
          .single();

        if (orgError || !organization || organization.type !== 'council') {
          console.error('[UnifiedAuthContext] Council organization not found:', orgError);
          await supabase.auth.signOut();
          window.location.href = '/login?error=not_council_account';
          return;
        }

        console.log('[UnifiedAuthContext] Redirecting to council dashboard:', organization.slug, department.slug);
        window.location.href = `/c/${organization.slug}/${department.slug}/dashboard`;

      } else if (portalType === 'professional') {
        // Professional portal: Get user's firm membership
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('organization_id')
          .eq('user_id', user.id);

        if (membershipError || !memberships || memberships.length === 0) {
          console.error('[UnifiedAuthContext] No firm access found:', membershipError);
          await supabase.auth.signOut();
          window.location.href = '/login?error=no_firm_access';
          return;
        }

        // Find a firm organization (user might have both council and firm memberships)
        let firmOrg = null;
        for (const membership of memberships) {
          const { data: org } = await supabase
            .from('organizations')
            .select('slug, type')
            .eq('id', membership.organization_id)
            .single();

          if (org && org.type === 'firm') {
            firmOrg = org;
            break;
          }
        }

        if (!firmOrg) {
          console.error('[UnifiedAuthContext] No firm organization found for user');
          await supabase.auth.signOut();
          window.location.href = '/login?error=not_firm_account';
          return;
        }

        console.log('[UnifiedAuthContext] Redirecting to firm dashboard:', firmOrg.slug);
        window.location.href = `/f/${firmOrg.slug}/dashboard`;
      }
    } catch (error) {
      console.error('[UnifiedAuthContext] Error during login redirect:', error);
      // Don't sign out on unexpected errors - just log and let user retry
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Throw with user-friendly error message
      throw new Error(getAuthErrorMessage(error));
    }
  };

  // Admin-specific sign in that checks admin access immediately and signs out if not authorized
  const signInAsAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      if (!data.session) {
        return { success: false, error: 'No session returned' };
      }

      // Check admin access directly from the session we just got
      const appMetadata = data.session.user?.app_metadata || {};
      const isPlatformAdminCheck = appMetadata.is_platform_admin === true;
      const adminRoleCheck = appMetadata.admin_role;
      const hasAdminAccess = isPlatformAdminCheck || adminRoleCheck === 'super_admin' || adminRoleCheck === 'admin';

      console.log('Admin login check:', {
        email: data.session.user?.email,
        appMetadata,
        hasAdminAccess
      });

      if (hasAdminAccess) {
        return { success: true };
      } else {
        // Sign out since they don't have admin access
        await supabase.auth.signOut();
        return { success: false, error: 'This account does not have admin access. Please contact support.' };
      }
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      return { success: false, error: getAuthErrorMessage(err) };
    }
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

  // Load permissions for a specific department (from legacy AuthContext)
  const loadPermissions = async (deptId: string, demoRole?: RoleName) => {
    try {
      // If a demoRole is provided, bypass database and use mock permissions
      if (demoRole) {
        console.log('[UnifiedAuthContext] Loading demo permissions for role:', demoRole);

        // Get all permissions for this role
        let permissionNames: PermissionName[];

        if (demoRole === ROLES.ORG_ADMIN || demoRole === ROLES.DEPT_ADMIN) {
          // Admins get all permissions
          permissionNames = Object.values(PERMISSIONS);
        } else if (demoRole === ROLES.OFFICER) {
          permissionNames = [
            PERMISSIONS.NOTICES_CREATE,
            PERMISSIONS.NOTICES_READ,
            PERMISSIONS.NOTICES_UPDATE,
            PERMISSIONS.NOTICES_PUBLISH,
            PERMISSIONS.NOTICES_EXPORT,
            PERMISSIONS.REPRESENTATIONS_READ,
            PERMISSIONS.REPRESENTATIONS_UPDATE,
            PERMISSIONS.REPRESENTATIONS_COMMENT,
            PERMISSIONS.REPRESENTATIONS_EXPORT,
            PERMISSIONS.TEAM_READ,
            PERMISSIONS.TEMPLATES_READ,
            PERMISSIONS.SETTINGS_READ,
          ];
        } else {
          // Viewer gets read-only permissions
          permissionNames = [
            PERMISSIONS.NOTICES_READ,
            PERMISSIONS.REPRESENTATIONS_READ,
            PERMISSIONS.TEAM_READ,
            PERMISSIONS.TEMPLATES_READ,
          ];
        }

        setPermissions(permissionNames);
        setDepartmentId(deptId);

        console.log('[UnifiedAuthContext] Loaded demo permissions:', permissionNames);
        return;
      }

      // Normal authenticated user flow - load from database
      if (!user) {
        console.warn('[UnifiedAuthContext] Cannot load permissions without user');
        return;
      }

      // Load user's role for this department
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        p_user_id: user.id,
        p_department_id: deptId
      });

      if (roleError) {
        console.error('[UnifiedAuthContext] Error loading role:', roleError);
        return;
      }

      if (roleData && roleData.length > 0) {
        // Note: role state is managed by the session metadata, this is for permissions
        console.log('[UnifiedAuthContext] Loaded department role:', roleData[0].role_name);
      }

      // Load user's permissions for this department
      const { data: permsData, error: permsError } = await supabase.rpc('get_user_permissions', {
        p_user_id: user.id,
        p_department_id: deptId
      });

      if (permsError) {
        console.error('[UnifiedAuthContext] Error loading permissions:', permsError);
        return;
      }

      const permissionNames = permsData?.map((p: { permission_name: string }) => p.permission_name as PermissionName) || [];
      setPermissions(permissionNames);
      setDepartmentId(deptId);

      console.log('[UnifiedAuthContext] Loaded permissions:', permissionNames);
    } catch (error) {
      console.error('[UnifiedAuthContext] Error in loadPermissions:', error);
    }
  };

  const hasPermission = (permission: string | PermissionName): boolean => {
    // Platform admins have all permissions
    if (isPlatformAdmin) return true;

    // Check department-level permissions first (if loaded)
    if (permissions.length > 0) {
      return permissions.includes(permission as PermissionName);
    }

    // Fallback to role-based permission checking
    const rolePermissions: Record<string, string[]> = {
      'admin': ['manage_notices', 'manage_users', 'view_analytics', 'manage_departments'],
      'editor': ['create_notices', 'edit_notices', 'view_analytics'],
      'viewer': ['view_notices', 'view_analytics']
    };

    const userRole = role || 'viewer';
    return rolePermissions[userRole]?.includes(permission) || false;
  };

  const hasAnyPermission = (...requiredPermissions: PermissionName[]): boolean => {
    // Platform admins have all permissions
    if (isPlatformAdmin) return true;

    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (...requiredPermissions: PermissionName[]): boolean => {
    // Platform admins have all permissions
    if (isPlatformAdmin) return true;

    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  const canAccessAdmin = (): boolean => {
    console.log('[UnifiedAuthContext.canAccessAdmin] Checking admin access:', {
      hasUser: !!user,
      userEmail: user?.email,
      isPlatformAdmin,
      adminRole,
      role,
      appMetadata: session?.user?.app_metadata,
    });

    // Check multiple conditions for admin access
    // 1. Platform admin flag in metadata
    if (isPlatformAdmin) {
      console.log('[UnifiedAuthContext.canAccessAdmin] Access granted: isPlatformAdmin=true');
      return true;
    }

    // 2. Admin role in metadata
    if (adminRole === 'super_admin' || adminRole === 'admin') {
      console.log('[UnifiedAuthContext.canAccessAdmin] Access granted: adminRole=', adminRole);
      return true;
    }

    // 3. Check email for known admin (fallback for migration period)
    if (user?.email === 'admin@civic') {
      console.log('[UnifiedAuthContext.canAccessAdmin] Access granted: known admin email');
      return true;
    }

    // 4. Check if user has admin role
    if (role === 'admin' || role === 'super_admin') {
      console.log('[UnifiedAuthContext.canAccessAdmin] Access granted: role=', role);
      return true;
    }

    console.log('[UnifiedAuthContext.canAccessAdmin] Access DENIED - no conditions met');
    return false;
  };

  const value: UnifiedAuthContextType = {
    // Core auth
    user,
    session,
    loading,
    isInitialized, // Task 2.3: Prevents premature redirects
    // Organization context
    organization,
    department,
    organizations,
    departments,
    // User metadata
    role,
    isPlatformAdmin,
    adminRole,
    // New user type fields (Task 1.2)
    userType,
    organizationType,
    // Department-level permissions (from legacy AuthContext)
    permissions,
    departmentId,
    // Actions
    signIn,
    signInAsAdmin,
    signOut,
    switchOrganization,
    switchDepartment,
    refreshSession,
    // Permission loading
    loadPermissions,
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
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