import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PermissionName, RoleName } from '@/types/permissions';
import { PERMISSIONS, ROLES } from '@/types/permissions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissions: PermissionName[];
  role: RoleName | null;
  departmentId: string | null;
  signOut: () => Promise<void>;
  loadPermissions: (departmentId: string, demoRole?: RoleName) => Promise<void>;
  hasPermission: (permission: PermissionName) => boolean;
  hasAnyPermission: (...permissions: PermissionName[]) => boolean;
  hasAllPermissions: (...permissions: PermissionName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionName[]>([]);
  const [role, setRole] = useState<RoleName | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPermissions = async (deptId: string, demoRole?: RoleName) => {
    try {
      // If a demoRole is provided, bypass database and use mock permissions
      if (demoRole) {
        console.log('[AuthContext] Loading demo permissions for role:', demoRole);

        // Set role
        setRole(demoRole);

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

        console.log('[AuthContext] Loaded demo permissions:', permissionNames);
        return;
      }

      // Normal authenticated user flow - load from database
      if (!user) {
        console.warn('[AuthContext] Cannot load permissions without user');
        return;
      }

      // Load user's role for this department
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        p_user_id: user.id,
        p_department_id: deptId
      });

      if (roleError) {
        console.error('[AuthContext] Error loading role:', roleError);
        return;
      }

      if (roleData && roleData.length > 0) {
        setRole(roleData[0].role_name as RoleName);
      }

      // Load user's permissions for this department
      const { data: permsData, error: permsError } = await supabase.rpc('get_user_permissions', {
        p_user_id: user.id,
        p_department_id: deptId
      });

      if (permsError) {
        console.error('[AuthContext] Error loading permissions:', permsError);
        return;
      }

      const permissionNames = permsData?.map((p: any) => p.permission_name as PermissionName) || [];
      setPermissions(permissionNames);
      setDepartmentId(deptId);

      console.log('[AuthContext] Loaded permissions:', permissionNames);
    } catch (error) {
      console.error('[AuthContext] Error in loadPermissions:', error);
    }
  };

  const hasPermission = (permission: PermissionName): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...requiredPermissions: PermissionName[]): boolean => {
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (...requiredPermissions: PermissionName[]): boolean => {
    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPermissions([]);
    setRole(null);
    setDepartmentId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        permissions,
        role,
        departmentId,
        signOut,
        loadPermissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
