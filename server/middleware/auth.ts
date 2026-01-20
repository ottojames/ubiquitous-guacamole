import { Request, Response, NextFunction } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

// Extend Express Request type to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        organizationId?: string;
        departmentIds?: string[];
        departmentId?: string;  // Current department (set by loadUserPermissions)
        permissions?: string[];
        isPlatformAdmin?: boolean;
      };
    }
  }
}

/**
 * Middleware to validate Supabase JWT tokens
 * Extracts token from Authorization header and verifies it
 * Populates req.user with authenticated user info
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token using Supabase
    const { data: { user }, error } = await getServiceSupabaseClient().auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Extract organization/department info from JWT claims (app_metadata)
    const appMetadata = user.app_metadata || {};
    const organizationId = appMetadata.organization_id as string | undefined;
    const departmentIds = appMetadata.department_ids as string[] | undefined;
    const isPlatformAdmin = appMetadata.is_platform_admin === true;

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || appMetadata.role,
      organizationId,
      departmentIds,
      isPlatformAdmin,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error verifying token:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to verify authentication token'
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Populates req.user if valid token exists, otherwise continues without user
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await getServiceSupabaseClient().auth.getUser(token);

    if (!error && user) {
      const appMetadata = user.app_metadata || {};
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || appMetadata.role,
        organizationId: appMetadata.organization_id as string | undefined,
        departmentIds: appMetadata.department_ids as string[] | undefined,
        isPlatformAdmin: appMetadata.is_platform_admin === true,
      };
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error in optional auth:', error);
    // Continue without user on error
    next();
  }
}

/**
 * Helper function to extract user info from Supabase user object
 * Used by multiple middleware functions to ensure consistent user context
 */
function extractUserContext(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): NonNullable<Express.Request['user']> {
  const appMetadata = user.app_metadata || {};
  return {
    id: user.id,
    email: user.email,
    role: (user.user_metadata?.role || appMetadata.role) as string | undefined,
    organizationId: appMetadata.organization_id as string | undefined,
    departmentIds: appMetadata.department_ids as string[] | undefined,
    isPlatformAdmin: appMetadata.is_platform_admin === true,
  };
}

/**
 * Middleware to set user context from Supabase session
 * Supports both Authorization header (Bearer token) and cookie-based sessions
 * This is the recommended middleware for browser-based requests that may use cookies
 * Populates req.user if valid session exists, otherwise continues without user
 */
export async function setUserContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header first (standard for API calls)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // Fall back to cookie-based token (for browser-based requests)
    else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    // Also check sb-access-token cookie (Supabase's default cookie name)
    else if (req.cookies?.['sb-access-token']) {
      token = req.cookies['sb-access-token'];
    }

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Verify the token using Supabase
    const { data: { user }, error } = await getServiceSupabaseClient().auth.getUser(token);

    if (!error && user) {
      req.user = extractUserContext(user);
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error in setUserContext:', error);
    // Continue without user on error
    next();
  }
}

/**
 * Role-based access control middleware
 * Requires user to have one of the specified roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 * Requires user to have specific permission for a department
 * Department ID should be in req.params.deptId or req.query.departmentId
 */
export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      // Extract department ID from params or query
      const departmentId = req.params.deptId || req.query.departmentId as string;

      if (!departmentId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Department ID required for permission check'
        });
        return;
      }

      // Check if user has the required permission
      const { data, error } = await getServiceSupabaseClient().rpc('user_has_permission', {
        p_user_id: req.user.id,
        p_department_id: departmentId,
        p_permission_name: permissionName
      });

      if (error) {
        console.error('[Permission Middleware] Error checking permission:', error);
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to verify permissions'
        });
        return;
      }

      if (!data) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Permission denied. Required permission: ${permissionName}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('[Permission Middleware] Error in permission check:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify permissions'
      });
    }
  };
}

/**
 * Middleware to load user permissions for a department
 * Populates req.user.permissions with array of permission names
 * Department ID should be in req.params.deptId or req.query.departmentId
 */
export async function loadUserPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next();
      return;
    }

    // Extract department ID from params or query
    const departmentId = req.params.deptId || req.query.departmentId as string;

    if (!departmentId) {
      next();
      return;
    }

    // Load all permissions for user in this department
    const { data: permissions, error } = await getServiceSupabaseClient().rpc('get_user_permissions', {
      p_user_id: req.user.id,
      p_department_id: departmentId
    });

    if (error) {
      console.error('[Permission Middleware] Error loading permissions:', error);
      next();
      return;
    }

    // Attach permissions to user object
    req.user.permissions = permissions?.map((p: any) => p.permission_name) || [];
    req.user.departmentId = departmentId;

    next();
  } catch (error) {
    console.error('[Permission Middleware] Error loading permissions:', error);
    next();
  }
}

/**
 * Helper function to check if user has any of the specified permissions
 * Use after loadUserPermissions middleware
 */
export function hasAnyPermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.permissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Permissions not loaded or user not authenticated'
      });
      return;
    }

    const hasPermission = requiredPermissions.some(perm =>
      req.user!.permissions!.includes(perm)
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Permission denied. Required one of: ${requiredPermissions.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Helper function to check if user has all of the specified permissions
 * Use after loadUserPermissions middleware
 */
export function hasAllPermissions(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.permissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Permissions not loaded or user not authenticated'
      });
      return;
    }

    const hasAllPerms = requiredPermissions.every(perm =>
      req.user!.permissions!.includes(perm)
    );

    if (!hasAllPerms) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Permission denied. Required all of: ${requiredPermissions.join(', ')}`
      });
      return;
    }

    next();
  };
}
