import express from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * Get all available subscription tiers
 * GET /api/firm-subscriptions/tiers
 */
router.get('/tiers', async (_req, res) => {
  try {
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    res.json({
      tiers: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription tiers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get subscription for organization
 * GET /api/firm-subscriptions/organization/:orgId
 */
router.get('/organization/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from('firm_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json(data);

  } catch (error) {
    console.error('Error fetching organization subscription:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create subscription for organization
 * POST /api/firm-subscriptions/organization/:orgId
 */
router.post('/organization/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { tier_id, billing_cycle = 'monthly', trial_days = 0 } = req.body;

    if (!tier_id) {
      return res.status(400).json({ error: 'Missing required field: tier_id' });
    }

    const supabase = getServiceSupabaseClient();

    // Check if organization already has active subscription
    const { data: existing } = await supabase
      .from('firm_subscriptions')
      .select('id')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Organization already has active subscription' });
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now);

    if (billing_cycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscriptionData: any = {
      organization_id: orgId,
      tier_id,
      status: trial_days > 0 ? 'trialing' : 'active',
      billing_cycle,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString()
    };

    if (trial_days > 0) {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + trial_days);
      subscriptionData.trial_ends_at = trialEnd.toISOString();
    }

    const { data, error } = await supabase
      .from('firm_subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .single();

    if (error) throw error;

    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get subscription usage
 * GET /api/firm-subscriptions/:subscriptionId/usage
 */
router.get('/:subscriptionId/usage', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_subscription_usage', { p_subscription_id: subscriptionId });

    if (error) throw error;

    res.json(data?.[0] || {
      total_notices: 0,
      notices_in_allowance: 0,
      notices_overage: 0,
      overage_amount_gbp: 0
    });

  } catch (error) {
    console.error('Error fetching subscription usage:', error);
    res.status(500).json({
      error: 'Failed to fetch usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check if organization can publish notice
 * GET /api/firm-subscriptions/organization/:orgId/can-publish
 */
router.get('/organization/:orgId/can-publish', async (req, res) => {
  try {
    const { orgId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .rpc('can_publish_notice', { p_organization_id: orgId });

    if (error) throw error;

    res.json(data?.[0] || {
      can_publish: false,
      reason: 'No active subscription',
      notices_remaining: 0,
      overage_cost_gbp: 0
    });

  } catch (error) {
    console.error('Error checking publish eligibility:', error);
    res.status(500).json({
      error: 'Failed to check eligibility',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get invoices for organization
 * GET /api/firm-subscriptions/organization/:orgId/invoices
 */
router.get('/organization/:orgId/invoices', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const supabase = getServiceSupabaseClient();

    let query = supabase
      .from('monthly_invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('billing_period_start', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      invoices: data || [],
      total: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cancel subscription
 * POST /api/firm-subscriptions/:subscriptionId/cancel
 */
router.post('/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelled_by, reason } = req.body;

    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from('firm_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Subscription cancelled',
      subscription: data
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
