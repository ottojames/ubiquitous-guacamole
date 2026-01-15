import express from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * GET /api/analytics/council/:councilId
 * Get comprehensive analytics for a council
 * Query params: startDate, endDate (ISO timestamps)
 */
router.get('/council/:councilId', async (req, res) => {
  try {
    const { councilId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 90 days if no dates provided
    const end = endDate
      ? new Date(String(endDate))
      : new Date();
    const start = startDate
      ? new Date(String(startDate))
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Use the database function to get analytics
    const { data: analyticsData, error: analyticsError } = await getServiceSupabaseClient().rpc(
      'get_analytics_for_period',
      {
        p_organization_id: councilId,
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      }
    );

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Calculate cost savings
    const traditionalCostPerNotice = 280.0;
    const digitalCostPerNotice = 49.99;
    const savingsPerNotice = traditionalCostPerNotice - digitalCostPerNotice;
    const totalNotices = analyticsData?.total_notices || 0;
    const totalSavings = savingsPerNotice * totalNotices;
    const percentageReduction = ((savingsPerNotice / traditionalCostPerNotice) * 100).toFixed(1);

    // Enhance with cost savings data
    const enhancedAnalytics = {
      ...analyticsData,
      cost_savings: {
        traditional_cost_per_notice: traditionalCostPerNotice,
        digital_cost_per_notice: digitalCostPerNotice,
        savings_per_notice: savingsPerNotice,
        total_savings: totalSavings,
        percentage_reduction: parseFloat(percentageReduction),
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    res.json(enhancedAnalytics);
  } catch (err) {
    console.error('Error in /analytics/council/:councilId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/council/:councilId/monthly-trends
 * Get month-by-month notice publication trends
 */
router.get('/council/:councilId/monthly-trends', async (req, res) => {
  try {
    const { councilId } = req.params;
    const { months = 12 } = req.query;

    const supabase = getServiceSupabaseClient();

    // Get notices grouped by month
    const { data, error } = await supabase
      .from('notices')
      .select('published_at, notice_type, status')
      .eq('council_id', councilId)
      .eq('status', 'published')
      .gte(
        'published_at',
        new Date(Date.now() - Number(months) * 30 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('published_at', { ascending: true });

    if (error) {
      console.error('Error fetching monthly trends:', error);
      return res.status(500).json({ error: 'Failed to fetch monthly trends' });
    }

    // Group by month
    const monthlyData: Record<
      string,
      { month: string; total: number; byType: Record<string, number> }
    > = {};

    (data || []).forEach((notice) => {
      const date = new Date(notice.published_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          byType: {},
        };
      }

      monthlyData[monthKey].total += 1;
      monthlyData[monthKey].byType[notice.notice_type] =
        (monthlyData[monthKey].byType[notice.notice_type] || 0) + 1;
    });

    // Convert to array and sort
    const trends = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    res.json({ trends });
  } catch (err) {
    console.error('Error in /analytics/council/:councilId/monthly-trends:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/council/:councilId/department-comparison
 * Get performance comparison across departments
 */
router.get('/council/:councilId/department-comparison', async (req, res) => {
  try {
    const { councilId } = req.params;

    const supabase = getServiceSupabaseClient();

    // Get all departments for this council
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('council_id', councilId);

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }

    // Get comparison data for each department
    const comparison = await Promise.all(
      (departments || []).map(async (dept) => {
        // Total published notices
        const { count: totalNotices } = await supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', dept.id)
          .eq('status', 'published');

        // Average approval time (days)
        const { data: approvalData } = await supabase
          .from('notices')
          .select('submitted_at, reviewed_at')
          .eq('department_id', dept.id)
          .eq('approval_status', 'approved')
          .not('submitted_at', 'is', null)
          .not('reviewed_at', 'is', null);

        let avgApprovalDays = 0;
        if (approvalData && approvalData.length > 0) {
          const totalDays = approvalData.reduce((sum, notice) => {
            const submitted = new Date(notice.submitted_at);
            const reviewed = new Date(notice.reviewed_at);
            const days = (reviewed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0);
          avgApprovalDays = totalDays / approvalData.length;
        }

        // Deadline adherence
        const { data: deadlineData } = await supabase
          .from('notices')
          .select('published_at, application_date')
          .eq('department_id', dept.id)
          .eq('status', 'published')
          .not('published_at', 'is', null)
          .not('application_date', 'is', null);

        let adherenceRate = 0;
        if (deadlineData && deadlineData.length > 0) {
          const withinDeadline = deadlineData.filter((notice) => {
            const published = new Date(notice.published_at);
            const applied = new Date(notice.application_date);
            const daysDiff = (published.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 28; // Within 28 days
          }).length;
          adherenceRate = (withinDeadline / deadlineData.length) * 100;
        }

        // Representations count
        const { data: noticeIds } = await supabase
          .from('notices')
          .select('id')
          .eq('department_id', dept.id)
          .eq('status', 'published');

        const ids = (noticeIds || []).map((n) => n.id);
        let repsCount = 0;

        if (ids.length > 0) {
          const { count } = await supabase
            .from('representations')
            .select('id', { count: 'exact', head: true })
            .in('notice_id', ids);
          repsCount = count || 0;
        }

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalNotices: totalNotices || 0,
          avgApprovalDays: Math.round(avgApprovalDays * 10) / 10,
          deadlineAdherenceRate: Math.round(adherenceRate * 10) / 10,
          totalRepresentations: repsCount,
        };
      })
    );

    res.json({ departments: comparison });
  } catch (err) {
    console.error('Error in /analytics/council/:councilId/department-comparison:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/council/:councilId/compliance
 * Get compliance metrics (deadline adherence, pending reviews, etc.)
 */
router.get('/council/:councilId/compliance', async (req, res) => {
  try {
    const { councilId } = req.params;

    const supabase = getServiceSupabaseClient();

    // Get all published notices
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('id, published_at, application_date, reps_deadline, approval_status')
      .eq('council_id', councilId)
      .eq('status', 'published');

    if (noticesError) {
      console.error('Error fetching notices for compliance:', noticesError);
      return res.status(500).json({ error: 'Failed to fetch compliance data' });
    }

    const now = new Date();

    // Calculate deadline adherence
    const noticesWithDates = (notices || []).filter(
      (n) => n.published_at && n.application_date
    );

    const withinDeadline = noticesWithDates.filter((notice) => {
      const published = new Date(notice.published_at);
      const applied = new Date(notice.application_date);
      const daysDiff = (published.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 28;
    }).length;

    const adherenceRate =
      noticesWithDates.length > 0
        ? (withinDeadline / noticesWithDates.length) * 100
        : 0;

    // Find overdue representation reviews
    const overdueReps = (notices || []).filter((notice) => {
      if (!notice.reps_deadline) return false;
      const deadline = new Date(notice.reps_deadline);
      return deadline < now;
    });

    // Get unreviewed representations for overdue consultations
    const overdueNoticeIds = overdueReps.map((n) => n.id);
    let unreadOverdueReps = 0;

    if (overdueNoticeIds.length > 0) {
      const { data: reps } = await supabase
        .from('representations')
        .select('id, read_by')
        .in('notice_id', overdueNoticeIds);

      unreadOverdueReps = (reps || []).filter(
        (rep) => !rep.read_by || rep.read_by.length === 0
      ).length;
    }

    // Pending submissions count
    const { count: pendingCount } = await supabase
      .from('notices')
      .select('id', { count: 'exact', head: true })
      .eq('council_id', councilId)
      .eq('approval_status', 'pending');

    res.json({
      deadlineAdherenceRate: Math.round(adherenceRate * 10) / 10,
      totalNotices: notices?.length || 0,
      withinDeadline,
      overDeadline: noticesWithDates.length - withinDeadline,
      overdueConsultations: overdueReps.length,
      unreadOverdueRepresentations: unreadOverdueReps,
      pendingSubmissions: pendingCount || 0,
    });
  } catch (err) {
    console.error('Error in /analytics/council/:councilId/compliance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/council/:councilId/engagement
 * Get public engagement metrics
 */
router.get('/council/:councilId/engagement', async (req, res) => {
  try {
    const { councilId } = req.params;

    const supabase = getServiceSupabaseClient();

    // Get all published notices
    const { data: notices } = await supabase
      .from('notices')
      .select('id')
      .eq('council_id', councilId)
      .eq('status', 'published');

    const noticeIds = (notices || []).map((n) => n.id);

    if (noticeIds.length === 0) {
      return res.json({
        totalNotices: 0,
        totalRepresentations: 0,
        noticesWithRepresentations: 0,
        engagementRate: 0,
      });
    }

    // Get all representations
    const { data: reps } = await supabase
      .from('representations')
      .select('id, notice_id')
      .in('notice_id', noticeIds);

    const totalReps = reps?.length || 0;
    const uniqueNoticesWithReps = new Set(reps?.map((r) => r.notice_id) || []).size;
    const engagementRate = (uniqueNoticesWithReps / noticeIds.length) * 100;

    res.json({
      totalNotices: noticeIds.length,
      totalRepresentations: totalReps,
      noticesWithRepresentations: uniqueNoticesWithReps,
      engagementRate: Math.round(engagementRate * 10) / 10,
    });
  } catch (err) {
    console.error('Error in /analytics/council/:councilId/engagement:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/audit-log
 * Get audit log entries
 * Query params: organizationId, startDate, endDate, actionType, resourceType, limit, offset
 */
router.get('/audit-log', async (req, res) => {
  try {
    const {
      organizationId,
      startDate,
      endDate,
      actionType,
      resourceType,
      limit = 50,
      offset = 0,
    } = req.query;

    const supabase = getServiceSupabaseClient();

    let query = supabase
      .from('audit_actions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (organizationId) {
      query = query.eq('organization_id', String(organizationId));
    }

    if (startDate) {
      query = query.gte('created_at', String(startDate));
    }

    if (endDate) {
      query = query.lte('created_at', String(endDate));
    }

    if (actionType) {
      query = query.eq('action_type', String(actionType));
    }

    if (resourceType) {
      query = query.eq('resource_type', String(resourceType));
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit log:', error);
      return res.status(500).json({ error: 'Failed to fetch audit log' });
    }

    res.json({
      entries: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('Error in /analytics/audit-log:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
