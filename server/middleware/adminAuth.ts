import { Request, Response, NextFunction } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

// Extend Express Request type to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        userId: string;
        email: string;
        role: 'super_admin' | 'admin' | 'support';
        twoFactorEnabled: boolean;
        sessionId: string;
      };
    }
  }
}

/**
 * Main admin authentication middleware
 * Validates admin session token and populates req.adminUser
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract JWT token from Authorization header or cookie
    let token: string | undefined;

    // Check Authorization header first (standard for API calls)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    // Fall back to cookie (for browser-based admin panel)
    else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
      return;
    }

    // Verify the JWT token using Supabase
    const supabase = getServiceSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[Admin Auth] Token validation failed:', error);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Check if user has platform admin privileges
    const isPlatformAdmin = user.app_metadata?.is_platform_admin === true;
    const userRole = user.app_metadata?.role || 'user';

    if (!isPlatformAdmin) {
      console.warn(`[Admin Auth] Access denied for user ${user.email} - not a platform admin`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Platform admin access required'
      });
      return;
    }

    // Check for admin role in platform_admin_settings table
    const { data: adminSettings, error: adminError } = await supabase
      .from('platform_admin_settings')
      .select('admin_role')
      .eq('user_id', user.id)
      .single();

    const adminRole = adminSettings?.admin_role || 'admin';

    // Attach admin user to request
    req.adminUser = {
      id: user.id,
      userId: user.id,
      email: user.email || '',
      role: adminRole as 'super_admin' | 'admin' | 'support',
      twoFactorEnabled: user.app_metadata?.two_factor_enabled || false,
      sessionId: token
    };

    console.log(`[Admin Auth] Authorized admin access for ${user.email} with role: ${adminRole}`);
    next();
  } catch (error) {
    console.error('[Admin Auth] Middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate admin authentication'
    });
  }
}

/**
 * Middleware to require super admin role
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.adminUser) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
    return;
  }

  if (req.adminUser.role !== 'super_admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Super admin access required'
    });
    return;
  }

  next();
}

/**
 * Middleware factory to log admin actions
 * @param action - Action identifier (e.g., 'account.suspended')
 * @param category - Action category (e.g., 'account_management')
 * @param targetType - Type of target resource (e.g., 'organization')
 * @returns Express middleware function
 */
export function logAdminAction(
  action: string,
  category: 'account_management' | 'notice_moderation' | 'user_management' | 'system_config' | 'security' | 'billing',
  targetType: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original send functions
    const originalSend = res.send;
    const originalJson = res.json;

    // Function to log the action
    const logAction = async (responseBody?: any) => {
      if (!req.adminUser) return;

      try {
        const supabase = getServiceSupabaseClient();

        // Extract target ID from params or body
        const targetId = req.params.id || req.body?.id || req.params.accountId || req.params.noticeId;
        const targetIdentifier = req.body?.name || req.body?.email || req.params.slug;

        // Determine severity based on action
        let severity: 'info' | 'warning' | 'critical' = 'info';
        if (action.includes('delete') || action.includes('suspend') || action.includes('revoke')) {
          severity = 'warning';
        }
        if (action.includes('security') || action.includes('credential')) {
          severity = 'critical';
        }

        // Log the action
        await supabase.rpc('log_admin_action', {
          p_admin_user_id: req.adminUser.id,
          p_action: action,
          p_action_category: category,
          p_target_type: targetType,
          p_target_id: targetId,
          p_target_identifier: targetIdentifier,
          p_old_values: req.body?.oldValues || null,
          p_new_values: req.body?.newValues || responseBody || null,
          p_reason: req.body?.reason || null,
          p_ip_address: req.ip || req.connection.remoteAddress,
          p_session_id: req.adminUser.sessionId,
          p_severity: severity
        });
      } catch (error) {
        console.error('[Admin Action Log] Failed to log action:', error);
        // Don't fail the request if logging fails
      }
    };

    // Override response methods to capture response data
    res.json = function(body: any) {
      logAction(body).then(() => {
        originalJson.call(this, body);
      });
      return res;
    };

    res.send = function(body: any) {
      logAction(body).then(() => {
        originalSend.call(this, body);
      });
      return res;
    };

    next();
  };
}

/**
 * Middleware to enforce IP allowlist for admin access
 */
export async function enforceIPAllowlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.adminUser) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();

    // Get admin user's IP allowlist
    const { data, error } = await supabase
      .from('admin_users')
      .select('ip_allowlist')
      .eq('id', req.adminUser.id)
      .single();

    if (error) {
      console.error('[IP Allowlist] Error fetching allowlist:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify IP access'
      });
      return;
    }

    // If no allowlist configured, allow all IPs
    if (!data.ip_allowlist || data.ip_allowlist.length === 0) {
      next();
      return;
    }

    // Get client IP
    const clientIP = req.ip ||
                    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                    req.connection.remoteAddress;

    if (!clientIP) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Could not determine client IP address'
      });
      return;
    }

    // Normalize IP (remove IPv6 prefix for IPv4 addresses)
    const normalizedIP = clientIP.replace(/^::ffff:/, '');

    // Check if IP is in allowlist
    const isAllowed = data.ip_allowlist.some((allowedIP: string) => {
      // Support wildcards (e.g., 192.168.1.*)
      if (allowedIP.includes('*')) {
        const pattern = allowedIP.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(normalizedIP);
      }
      return allowedIP === normalizedIP;
    });

    if (!isAllowed) {
      // Log security event
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: req.adminUser.id,
        p_action: 'access.denied.ip_not_allowed',
        p_action_category: 'security',
        p_target_type: 'admin_session',
        p_target_id: req.adminUser.sessionId,
        p_old_values: { attempted_ip: normalizedIP },
        p_ip_address: normalizedIP,
        p_session_id: req.adminUser.sessionId,
        p_severity: 'critical'
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied from this IP address'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[IP Allowlist] Middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify IP access'
    });
  }
}

/**
 * Optional admin auth - doesn't fail if no admin session
 */
export async function optionalAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session token
    let sessionToken: string | undefined;

    if (req.cookies?.adminSessionToken) {
      sessionToken = req.cookies.adminSessionToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      sessionToken = req.headers.authorization.substring(7);
    } else if (req.headers['x-admin-session']) {
      sessionToken = req.headers['x-admin-session'] as string;
    }

    if (!sessionToken) {
      // No admin session, continue without admin user
      next();
      return;
    }

    // Try to validate session
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.rpc('validate_admin_session', {
      p_session_token: sessionToken
    });

    if (!error && data && data.length > 0) {
      const adminData = data[0];
      req.adminUser = {
        id: adminData.admin_user_id,
        userId: adminData.user_id,
        email: adminData.email,
        role: adminData.role,
        twoFactorEnabled: adminData.two_factor_enabled,
        sessionId: sessionToken
      };
    }

    next();
  } catch (error) {
    console.error('[Optional Admin Auth] Error:', error);
    // Continue without admin user on error
    next();
  }
}

/**
 * Middleware to check if admin has specific role
 */
export function requireAdminRole(...allowedRoles: ('super_admin' | 'admin' | 'support')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
}