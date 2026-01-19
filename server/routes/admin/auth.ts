import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getServiceSupabaseClient } from '../../lib/supabase.js';
import { requireAdmin, logAdminAction } from '../../middleware/adminAuth.js';
import crypto from 'crypto';

const router = Router();

// Extended Request type for admin routes
interface AdminRequest extends Request {
  adminUser?: {
    id: string;
    userId: string;
    email: string;
    role: 'super_admin' | 'admin' | 'support';
    twoFactorEnabled: boolean;
    sessionId: string;
  };
}

/**
 * POST /api/admin/auth/login
 * Email/password login with failed attempt tracking
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const supabase = getServiceSupabaseClient();

    // Check admin user exists and get details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (adminError || !adminUser) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
      const lockoutMinutes = Math.ceil(
        (new Date(adminUser.locked_until).getTime() - Date.now()) / 60000
      );
      return res.status(403).json({
        error: `Account locked. Please try again in ${lockoutMinutes} minutes.`
      });
    }

    // Check if account is active
    if (adminUser.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active. Please contact system administrator.'
      });
    }

    // Verify password using Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      // Increment failed login attempts
      const newFailedAttempts = (adminUser.failed_login_attempts || 0) + 1;
      const updateData: any = {
        failed_login_attempts: newFailedAttempts
      };

      // Lock account after 5 failed attempts
      if (newFailedAttempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 30 * 60000).toISOString(); // 30 minute lockout
      }

      await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', adminUser.id);

      // Log failed login attempt
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUser.id,
        p_action: 'login.failed',
        p_action_category: 'security',
        p_target_type: 'admin_user',
        p_target_id: adminUser.id,
        p_reason: `Failed login attempt ${newFailedAttempts}/5`,
        p_ip_address: req.ip,
        p_severity: newFailedAttempts >= 3 ? 'warning' : 'info'
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: Math.max(0, 5 - newFailedAttempts)
      });
    }

    // Reset failed attempts on successful auth
    await supabase
      .from('admin_users')
      .update({
        failed_login_attempts: 0,
        last_login_at: new Date().toISOString(),
        last_login_ip: req.ip
      })
      .eq('id', adminUser.id);

    // Check if 2FA is enabled
    if (adminUser.two_factor_enabled) {
      // Create temporary session for 2FA verification
      const tempToken = crypto.randomBytes(32).toString('hex');

      // Store temp session (expires in 5 minutes)
      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          admin_user_id: adminUser.id,
          session_token: tempToken,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
          termination_reason: null // Will be null until 2FA verified
        });

      if (sessionError) {
        console.error('Failed to create temp session:', sessionError);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      return res.json({
        requiresTwoFactor: true,
        tempToken,
        message: 'Please provide your 2FA code'
      });
    }

    // Create full session (no 2FA)
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Log successful login
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: adminUser.id,
      p_action: 'login.success',
      p_action_category: 'security',
      p_target_type: 'admin_user',
      p_target_id: adminUser.id,
      p_ip_address: req.ip,
      p_session_id: sessionToken,
      p_severity: 'info'
    });

    res.json({
      success: true,
      sessionToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        twoFactorEnabled: adminUser.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/auth/verify-2fa
 * Verify 2FA code after initial login
 */
router.post('/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        error: 'Temporary token and 2FA code are required'
      });
    }

    const supabase = getServiceSupabaseClient();

    // Get temp session
    const { data: tempSession, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admin_users!inner(*)')
      .eq('session_token', tempToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !tempSession) {
      return res.status(401).json({
        error: 'Invalid or expired temporary token'
      });
    }

    const adminUser = tempSession.admin_users;

    // Verify 2FA code
    const isValid = speakeasy.totp.verify({
      secret: adminUser.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    // Also check backup codes if main code fails
    let usedBackupCode = null;
    if (!isValid && adminUser.backup_codes) {
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      if (adminUser.backup_codes.includes(hashedCode)) {
        usedBackupCode = hashedCode;
      }
    }

    if (!isValid && !usedBackupCode) {
      // Log failed 2FA attempt
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: adminUser.id,
        p_action: '2fa.failed',
        p_action_category: 'security',
        p_target_type: 'admin_user',
        p_target_id: adminUser.id,
        p_ip_address: req.ip,
        p_severity: 'warning'
      });

      return res.status(401).json({
        error: 'Invalid 2FA code'
      });
    }

    // Remove used backup code if applicable
    if (usedBackupCode) {
      const updatedBackupCodes = adminUser.backup_codes.filter(
        (c: string) => c !== usedBackupCode
      );

      await supabase
        .from('admin_users')
        .update({ backup_codes: updatedBackupCodes })
        .eq('id', adminUser.id);
    }

    // Delete temp session
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', tempSession.id);

    // Create full session
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const { error: newSessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      });

    if (newSessionError) {
      console.error('Failed to create session:', newSessionError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Log successful 2FA
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: adminUser.id,
      p_action: '2fa.success',
      p_action_category: 'security',
      p_target_type: 'admin_user',
      p_target_id: adminUser.id,
      p_ip_address: req.ip,
      p_session_id: sessionToken,
      p_severity: 'info'
    });

    res.json({
      success: true,
      sessionToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        twoFactorEnabled: adminUser.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Terminate admin session
 */
router.post('/logout', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const supabase = getServiceSupabaseClient();

    // Terminate session
    await supabase
      .from('admin_sessions')
      .update({
        terminated_at: new Date().toISOString(),
        termination_reason: 'logout'
      })
      .eq('id', req.adminUser!.sessionId);

    // Log logout
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: req.adminUser!.id,
      p_action: 'logout',
      p_action_category: 'security',
      p_target_type: 'admin_user',
      p_target_id: req.adminUser!.id,
      p_ip_address: req.ip,
      p_severity: 'info'
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/auth/session
 * Check current session status
 */
router.get('/session', requireAdmin, async (req: AdminRequest, res: Response) => {
  res.json({
    valid: true,
    user: req.adminUser
  });
});

/**
 * POST /api/admin/auth/setup-2fa
 * Enable 2FA for admin account
 */
router.post('/setup-2fa', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const supabase = getServiceSupabaseClient();

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Civic Notices Admin (${req.adminUser!.email})`
    });

    // Generate QR code URL
    const otpauth = secret.otpauth_url;

    const qrCodeDataUrl = otpauth ? await QRCode.toDataURL(otpauth) : null;

    // Generate backup codes
    const backupCodes = Array(6).fill(null).map(() =>
      crypto.randomBytes(4).toString('hex')
    );

    const hashedBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Save secret and backup codes (but don't enable yet)
    await supabase
      .from('admin_users')
      .update({
        two_factor_secret: secret.base32,
        backup_codes: hashedBackupCodes
      })
      .eq('id', req.adminUser!.id);

    res.json({
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
      backupCodes,
      message: 'Please scan the QR code with your authenticator app and verify with a code'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

/**
 * POST /api/admin/auth/enable-2fa
 * Verify and enable 2FA after setup
 */
router.post('/enable-2fa', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: '2FA code is required' });
    }

    const supabase = getServiceSupabaseClient();

    // Get user's secret
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('two_factor_secret')
      .eq('id', req.adminUser!.id)
      .single();

    if (error || !adminUser?.two_factor_secret) {
      return res.status(400).json({
        error: 'Please setup 2FA first'
      });
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: adminUser.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid 2FA code'
      });
    }

    // Enable 2FA
    await supabase
      .from('admin_users')
      .update({ two_factor_enabled: true })
      .eq('id', req.adminUser!.id);

    // Log 2FA enablement
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: req.adminUser!.id,
      p_action: '2fa.enabled',
      p_action_category: 'security',
      p_target_type: 'admin_user',
      p_target_id: req.adminUser!.id,
      p_ip_address: req.ip,
      p_severity: 'info'
    });

    res.json({
      success: true,
      message: '2FA has been enabled successfully'
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

/**
 * POST /api/admin/auth/disable-2fa
 * Disable 2FA (requires current 2FA code)
 */
router.post('/disable-2fa', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: '2FA code is required' });
    }

    const supabase = getServiceSupabaseClient();

    // Get user's secret
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('two_factor_secret, two_factor_enabled')
      .eq('id', req.adminUser!.id)
      .single();

    if (error || !adminUser?.two_factor_enabled) {
      return res.status(400).json({
        error: '2FA is not enabled'
      });
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: adminUser.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid 2FA code'
      });
    }

    // Disable 2FA and clear secret
    await supabase
      .from('admin_users')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null
      })
      .eq('id', req.adminUser!.id);

    // Log 2FA disablement
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: req.adminUser!.id,
      p_action: '2fa.disabled',
      p_action_category: 'security',
      p_target_type: 'admin_user',
      p_target_id: req.adminUser!.id,
      p_ip_address: req.ip,
      p_severity: 'warning'
    });

    res.json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

export default router;