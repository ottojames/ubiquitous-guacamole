import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client for JWT verification
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Extend Express Request type to include user and permissions
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        departmentId?: string;
        permissions?: string[];
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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || user.app_metadata?.role,
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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || user.app_metadata?.role,
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
      const { data, error } = await supabaseAdmin.rpc('user_has_permission', {
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
    const { data: permissions, error } = await supabaseAdmin.rpc('get_user_permissions', {
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
