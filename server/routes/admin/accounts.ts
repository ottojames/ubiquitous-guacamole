import { Router } from 'express';
import { requireAdmin, requireSuperAdmin, logAdminAction } from '../../middleware/adminAuth.js';
import { getServiceSupabaseClient } from '../../lib/supabase.js';

const router = Router();

// List endpoints with pagination and filters
// GET /api/admin/accounts/councils?page=1&limit=25&status=active
router.get('/councils', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('organizations')
      .select('*, councils!inner(*)', { count: 'exact' })
      .eq('type', 'council')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Execute with pagination
    const { data, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching councils:', error);
      return res.status(500).json({ error: 'Failed to fetch councils' });
    }

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in councils list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/accounts/firms?page=1&limit=25
router.get('/firms', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .eq('type', 'firm')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Execute with pagination
    const { data, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching firms:', error);
      return res.status(500).json({ error: 'Failed to fetch firms' });
    }

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in firms list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/accounts/users?organizationId=xxx
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { organizationId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get users for organization
    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in users list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Detail endpoints
// GET /api/admin/accounts/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;

    // Get organization details with related data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*, councils(*), departments(*), users(*)')
      .eq('id', id)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(org);
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/accounts/:id/activity
router.get('/:id/activity', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get activity logs (would need an activity table in production)
    // For now, return recent notices as activity
    const { data, count, error } = await supabase
      .from('notices')
      .select('*', { count: 'exact' })
      .eq('organization_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity:', error);
      return res.status(500).json({ error: 'Failed to fetch activity' });
    }

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in activity list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/accounts/:id/notices
router.get('/:id/notices', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('notices')
      .select('*', { count: 'exact' })
      .eq('organization_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notices:', error);
      return res.status(500).json({ error: 'Failed to fetch notices' });
    }

    res.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in notices list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/accounts/:id/billing
router.get('/:id/billing', requireAdmin, async (req, res) => {
  try {
    // In production, this would fetch from a billing/subscription table
    // For now, return mock data
    const { id } = req.params;

    res.json({
      organizationId: id,
      subscription: {
        plan: 'professional',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthlySpend: 299.00,
        noticesThisMonth: 45,
        noticesLimit: 100
      },
      invoices: [],
      paymentMethod: {
        type: 'card',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025
      }
    });
  } catch (error) {
    console.error('Error in billing info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Action endpoints
// PATCH /api/admin/accounts/:id/suspend
router.patch(
  '/:id/suspend',
  requireAdmin,
  logAdminAction('account.suspended', 'account_management', 'organization'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Suspension reason required' });
      }

      // Update organization status
      const { data, error } = await supabase
        .from('organizations')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_reason: reason
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error suspending account:', error);
        return res.status(500).json({ error: 'Failed to suspend account' });
      }

      // Log the action (middleware handles this)
      req.body.targetId = id;
      req.body.oldValues = { status: data.status };
      req.body.newValues = { status: 'suspended' };

      res.json({
        success: true,
        message: 'Account suspended successfully',
        data
      });
    } catch (error) {
      console.error('Error in suspend account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/admin/accounts/:id/activate
router.patch(
  '/:id/activate',
  requireAdmin,
  logAdminAction('account.activated', 'account_management', 'organization'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { id } = req.params;

      // Update organization status
      const { data, error } = await supabase
        .from('organizations')
        .update({
          status: 'active',
          suspended_at: null,
          suspended_reason: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error activating account:', error);
        return res.status(500).json({ error: 'Failed to activate account' });
      }

      // Log the action (middleware handles this)
      req.body.targetId = id;
      req.body.oldValues = { status: data.status };
      req.body.newValues = { status: 'active' };

      res.json({
        success: true,
        message: 'Account activated successfully',
        data
      });
    } catch (error) {
      console.error('Error in activate account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PATCH /api/admin/accounts/:id/update
router.patch(
  '/:id/update',
  requireAdmin,
  logAdminAction('account.updated', 'account_management', 'organization'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields
      delete updates.id;
      delete updates.created_at;
      delete updates.auth_user_id;

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return res.status(500).json({ error: 'Failed to update account' });
      }

      res.json({
        success: true,
        message: 'Account updated successfully',
        data
      });
    } catch (error) {
      console.error('Error in update account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/admin/accounts/:id
router.delete(
  '/:id',
  requireSuperAdmin, // Only super admins can delete
  logAdminAction('account.deleted', 'account_management', 'organization'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { id } = req.params;

      // Soft delete by setting status
      const { data, error } = await supabase
        .from('organizations')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
      }

      res.json({
        success: true,
        message: 'Account deleted successfully',
        data
      });
    } catch (error) {
      console.error('Error in delete account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Bulk operations
// POST /api/admin/accounts/bulk/suspend
router.post(
  '/bulk/suspend',
  requireAdmin,
  logAdminAction('accounts.bulk_suspended', 'account_management', 'organization'),
  async (req, res) => {
    try {
      const supabase = getServiceSupabaseClient();
      const { ids, reason } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Account IDs required' });
      }

      if (!reason) {
        return res.status(400).json({ error: 'Suspension reason required' });
      }

      const { data, error } = await supabase
        .from('organizations')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspended_reason: reason
        })
        .in('id', ids)
        .select();

      if (error) {
        console.error('Error in bulk suspend:', error);
        return res.status(500).json({ error: 'Failed to suspend accounts' });
      }

      res.json({
        success: true,
        message: `Successfully suspended ${data?.length || 0} accounts`,
        data
      });
    } catch (error) {
      console.error('Error in bulk suspend:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/admin/accounts/bulk/export
router.post('/bulk/export', requireAdmin, async (req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const { type, status } = req.body;

    let query = supabase
      .from('organizations')
      .select('*, councils(*), users(*)');

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting accounts:', error);
      return res.status(500).json({ error: 'Failed to export accounts' });
    }

    // Convert to CSV format
    const csv = convertToCSV(data || []);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="accounts-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error in bulk export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
  const csvHeaders = headers.join(',');

  // Convert each row
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export default router;