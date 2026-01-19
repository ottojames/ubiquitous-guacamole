import express from 'express';
import { supabase, getServiceSupabaseClient } from '../../lib/supabase.js';
import { requireAdmin, logAdminAction } from '../../middleware/adminAuth.js';

const router = express.Router();

// Get audit logs with filters and pagination
router.get('/', requireAdmin, async (req, res) => {
  try {
    const serviceClient = getServiceSupabaseClient();

    const {
      page = '1',
      limit = '50',
      dateFrom,
      dateTo,
      adminUser,
      category,
      severity,
      targetType,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = serviceClient
      .from('admin_actions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Apply filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDate.toISOString());
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    if (adminUser) {
      query = query.eq('admin_user_id', adminUser);
    }

    if (category) {
      query = query.eq('action_category', category);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,target_identifier.ilike.%${search}%,reason.ilike.%${search}%`
      );
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      logs: logs || [],
      page: pageNum,
      totalPages,
      totalCount: count || 0
    });
  } catch (error) {
    console.error('Error in audit log endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity for dashboard
router.get('/recent', requireAdmin, async (req, res) => {
  try {
    const serviceClient = getServiceSupabaseClient();

    const { data: recentActions, error } = await serviceClient
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent actions:', error);
      return res.status(500).json({ error: 'Failed to fetch recent actions' });
    }

    res.json({ actions: recentActions || [] });
  } catch (error) {
    console.error('Error in recent actions endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export audit logs as CSV
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const serviceClient = getServiceSupabaseClient();

    const {
      dateFrom,
      dateTo,
      adminUser,
      category,
      severity,
      targetType,
      search
    } = req.query;

    // Build query
    let query = serviceClient
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters (same as main endpoint)
    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      fromDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', fromDate.toISOString());
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    if (adminUser) {
      query = query.eq('admin_user_id', adminUser);
    }

    if (category) {
      query = query.eq('action_category', category);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,target_identifier.ilike.%${search}%,reason.ilike.%${search}%`
      );
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error exporting audit logs:', error);
      return res.status(500).json({ error: 'Failed to export audit logs' });
    }

    // Generate CSV
    const csv = generateCSV(logs || []);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(csv);

    // Log the export action
    if (req.adminUser) {
      await serviceClient.rpc('log_admin_action', {
        p_admin_user_id: req.adminUser.id,
        p_action: 'audit.exported',
        p_action_category: 'system_config',
        p_target_type: 'audit_log',
        p_target_id: null,
        p_target_identifier: `Exported ${logs?.length || 0} records`,
        p_reason: 'Audit log export',
        p_ip_address: req.ip,
        p_session_id: req.adminUser.sessionId,
        p_severity: 'info'
      });
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate CSV
function generateCSV(logs: any[]): string {
  if (logs.length === 0) {
    return 'No data to export';
  }

  const headers = [
    'Timestamp',
    'Admin Email',
    'Admin Role',
    'Action',
    'Category',
    'Target Type',
    'Target ID',
    'Target Identifier',
    'Severity',
    'Reason',
    'IP Address',
    'Session ID'
  ];

  const rows = logs.map(log => [
    log.created_at,
    log.admin_email,
    log.admin_role,
    log.action,
    log.action_category,
    log.target_type,
    log.target_id || '',
    log.target_identifier || '',
    log.severity,
    log.reason || '',
    log.ip_address,
    log.session_id || ''
  ]);

  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(',')
    )
  ];

  return csvRows.join('\n');
}

export default router;