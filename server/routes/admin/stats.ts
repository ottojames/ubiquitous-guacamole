import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth';
import { getServiceSupabaseClient } from '../../lib/supabase';

const router = Router();

/**
 * GET /api/admin/stats
 * Returns comprehensive dashboard statistics for admin users
 * Includes growth percentages, revenue calculations, and system health
 */
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const supabase = getServiceSupabaseClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all statistics in parallel for performance
    const [
      // Current totals
      councilsResult,
      activeCouncilsResult,
      firmsResult,
      noticesResult,
      usersResult,
      pendingResult,
      // This month's new registrations (for growth calculation)
      firmsThisMonthResult,
      // Last month's registrations (for growth calculation)
      firmsLastMonthResult,
      // This month's notices for revenue calculation
      noticesThisMonthResult,
      // Council-published notices this month
      councilNoticesThisMonthResult,
    ] = await Promise.all([
      // Total councils
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'council'),
      // Active councils
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'council')
        .eq('status', 'active'),
      // Total firms
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'firm'),
      // Total notices
      supabase
        .from('notices')
        .select('*', { count: 'exact', head: true }),
      // Total users
      supabase
        .from('organization_memberships')
        .select('user_id', { count: 'exact', head: true }),
      // Pending verifications
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_verification'),
      // Firms created this month
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'firm')
        .gte('created_at', startOfMonth.toISOString()),
      // Firms created last month
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'firm')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString()),
      // Notices created this month (for revenue)
      supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      // Council-published notices this month (councils pay £19.99/notice)
      supabase
        .from('notices')
        .select('organization_id!inner(type)', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .eq('organization_id.type', 'council'),
    ]);

    // Extract counts
    const totalCouncils = councilsResult.count || 0;
    const activeCouncils = activeCouncilsResult.count || 0;
    const totalFirms = firmsResult.count || 0;
    const totalNotices = noticesResult.count || 0;
    const totalUsers = usersResult.count || 0;
    const pendingVerifications = pendingResult.count || 0;
    const firmsThisMonth = firmsThisMonthResult.count || 0;
    const firmsLastMonth = firmsLastMonthResult.count || 0;
    const noticesThisMonth = noticesThisMonthResult.count || 0;
    const councilNoticesThisMonth = councilNoticesThisMonthResult.count || 0;

    // Calculate firm growth percentage
    let firmGrowthPercent = 0;
    if (firmsLastMonth > 0) {
      firmGrowthPercent = Math.round(((firmsThisMonth - firmsLastMonth) / firmsLastMonth) * 100);
    } else if (firmsThisMonth > 0) {
      firmGrowthPercent = 100; // 100% growth if we went from 0 to some
    }

    // Calculate monthly revenue based on correct pricing model:
    // - Firms: £49/month subscription + £50/notice
    // - Councils: Free portal + £19.99/notice when publishing
    // - Public: £50/notice (non-firm/council notices)
    const firmSubscriptionRevenue = totalFirms * 49; // £49/month per firm
    const nonCouncilNoticesThisMonth = noticesThisMonth - councilNoticesThisMonth;
    const noticeRevenue = (nonCouncilNoticesThisMonth * 50) + (councilNoticesThisMonth * 19.99);
    const monthlyRevenue = firmSubscriptionRevenue + noticeRevenue;

    // System health metrics
    // In a real production system, these would come from monitoring tools
    // For now, we'll calculate based on database responsiveness
    const healthCheckStart = Date.now();
    await supabase.from('notices').select('id', { count: 'exact', head: true });
    const apiResponseTime = Date.now() - healthCheckStart;

    // Determine overall health status
    let systemHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (apiResponseTime > 1000) {
      systemHealth = 'degraded';
    } else if (apiResponseTime > 5000) {
      systemHealth = 'down';
    }

    res.json({
      ok: true,
      data: {
        // Core counts
        totalCouncils,
        activeCouncils,
        totalFirms,
        totalNotices,
        totalUsers,
        pendingVerifications,
        // Growth metrics
        firmGrowthPercent,
        firmsThisMonth,
        firmsLastMonth,
        // Revenue (in GBP)
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        firmSubscriptionRevenue,
        noticeRevenue: Math.round(noticeRevenue * 100) / 100,
        noticesThisMonth,
        // System health
        systemHealth,
        apiResponseTime,
        // Note: Database load and uptime require external monitoring
        // These are placeholders until real monitoring is set up
        databaseLoad: null,
        uptime: null,
      },
    });
  } catch (err) {
    console.error('Admin stats endpoint error:', err);
    res.status(500).json({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch admin stats' },
    });
  }
});

export default router;
