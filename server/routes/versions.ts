import express from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';

const router = express.Router();

/**
 * Get version history for a notice
 * GET /api/notices/:noticeId/versions
 */
router.get('/:noticeId/versions', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_notice_version_history', { p_notice_id: noticeId });

    if (error) throw error;

    res.json({
      notice_id: noticeId,
      versions: data || [],
      total_versions: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({
      error: 'Failed to fetch version history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get active version for a notice
 * GET /api/notices/:noticeId/versions/active
 */
router.get('/:noticeId/versions/active', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .rpc('get_active_notice_version', { p_notice_id: noticeId });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No active version found' });
    }

    res.json(data[0]);

  } catch (error) {
    console.error('Error fetching active version:', error);
    res.status(500).json({
      error: 'Failed to fetch active version',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create amendment request
 * POST /api/notices/:noticeId/amendments
 */
router.post('/:noticeId/amendments', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { requested_changes, reason, requested_by, requested_by_email } = req.body;

    if (!requested_changes || !reason) {
      return res.status(400).json({ error: 'Missing required fields: requested_changes, reason' });
    }

    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from('notice_amendments')
      .insert({
        notice_id: noticeId,
        requested_changes,
        reason,
        requested_by,
        requested_by_email,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);

  } catch (error) {
    console.error('Error creating amendment request:', error);
    res.status(500).json({
      error: 'Failed to create amendment request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get amendments for a notice
 * GET /api/notices/:noticeId/amendments
 */
router.get('/:noticeId/amendments', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { status } = req.query;

    const supabase = getServiceSupabaseClient();

    let query = supabase
      .from('notice_amendments')
      .select('*')
      .eq('notice_id', noticeId)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      notice_id: noticeId,
      amendments: data || [],
      total_amendments: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching amendments:', error);
    res.status(500).json({
      error: 'Failed to fetch amendments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Approve amendment and create new version
 * POST /api/notices/:noticeId/amendments/:amendmentId/approve
 */
router.post('/:noticeId/amendments/:amendmentId/approve', async (req, res) => {
  try {
    const { noticeId, amendmentId } = req.params;
    const {
      approved_by,
      approved_by_email,
      amendment_authority,
      version_type = 'amendment',
      statutory_basis
    } = req.body;

    const supabase = getServiceSupabaseClient();

    // Get amendment details
    const { data: amendment, error: amendmentError } = await supabase
      .from('notice_amendments')
      .select('*')
      .eq('id', amendmentId)
      .eq('notice_id', noticeId)
      .single();

    if (amendmentError || !amendment) {
      return res.status(404).json({ error: 'Amendment not found' });
    }

    if (amendment.status !== 'pending') {
      return res.status(400).json({ error: 'Amendment already processed' });
    }

    // Create new version
    const { data: versionId, error: versionError } = await supabase
      .rpc('create_notice_amendment_version', {
        p_notice_id: noticeId,
        p_changes: amendment.requested_changes,
        p_amendment_reason: amendment.reason,
        p_amendment_authority: amendment_authority || 'Department Head',
        p_version_type: version_type,
        p_statutory_basis: statutory_basis,
        p_created_by: approved_by
      });

    if (versionError) throw versionError;

    // Update amendment status
    const { error: updateError } = await supabase
      .from('notice_amendments')
      .update({
        status: 'approved',
        approved_by,
        approved_by_email,
        approved_at: new Date().toISOString(),
        resulting_version_id: versionId
      })
      .eq('id', amendmentId);

    if (updateError) throw updateError;

    res.json({
      message: 'Amendment approved and new version created',
      amendment_id: amendmentId,
      version_id: versionId
    });

  } catch (error) {
    console.error('Error approving amendment:', error);
    res.status(500).json({
      error: 'Failed to approve amendment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reject amendment
 * POST /api/notices/:noticeId/amendments/:amendmentId/reject
 */
router.post('/:noticeId/amendments/:amendmentId/reject', async (req, res) => {
  try {
    const { noticeId, amendmentId } = req.params;
    const { rejection_reason, approved_by, approved_by_email } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Missing rejection_reason' });
    }

    const supabase = getServiceSupabaseClient();

    // Update amendment status
    const { error } = await supabase
      .from('notice_amendments')
      .update({
        status: 'rejected',
        rejection_reason,
        approved_by,
        approved_by_email,
        approved_at: new Date().toISOString()
      })
      .eq('id', amendmentId)
      .eq('notice_id', noticeId)
      .eq('status', 'pending');

    if (error) throw error;

    res.json({
      message: 'Amendment rejected',
      amendment_id: amendmentId
    });

  } catch (error) {
    console.error('Error rejecting amendment:', error);
    res.status(500).json({
      error: 'Failed to reject amendment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
