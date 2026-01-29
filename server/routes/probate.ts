/**
 * Probate Notice Routes
 * 
 * Endpoints for Trustee Act 1925 s.27 deceased estate notices.
 * Handles:
 * - Multi-property estate management
 * - Creditor claims tracking
 * - London Gazette integration
 * - Newspaper mapping by property postcode
 */

import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { submitToGazette, checkGazetteStatus, getGazetteFeeEstimate } from '../services/gazette.js';

const router = Router();

/**
 * GET /api/probate/newspapers
 * Find newspapers that cover a given postcode
 */
router.get('/newspapers', async (req, res) => {
  try {
    const { postcode } = req.query;
    
    if (!postcode || typeof postcode !== 'string') {
      return res.status(400).json({ error: 'Postcode is required' });
    }
    
    const supabase = getServiceSupabaseClient();
    
    const { data, error } = await supabase
      .rpc('find_newspapers_for_postcode', { p_postcode: postcode });
    
    if (error) {
      console.error('[probate/newspapers] Error:', error);
      return res.status(500).json({ error: 'Failed to find newspapers' });
    }
    
    return res.json({
      postcode: postcode.toUpperCase(),
      newspapers: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('[probate/newspapers] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/probate/notices/:noticeId/properties
 * Get all properties associated with an estate
 */
router.get('/notices/:noticeId/properties', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();
    
    const { data, error } = await supabase
      .from('probate_estate_properties')
      .select('*')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[probate/properties] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }
    
    return res.json({ properties: data || [] });
  } catch (error: any) {
    console.error('[probate/properties] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/probate/notices/:noticeId/properties
 * Add a property to an estate
 */
router.post('/notices/:noticeId/properties', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const user = req.user;
    const {
      property_address,
      property_postcode,
      property_type,
      property_value,
      newspaper_name
    } = req.body;
    
    if (!property_address) {
      return res.status(400).json({ error: 'Property address is required' });
    }
    
    const supabase = getServiceSupabaseClient();
    
    const { data, error } = await supabase
      .from('probate_estate_properties')
      .insert({
        notice_id: noticeId,
        property_address,
        property_postcode,
        property_type,
        property_value,
        newspaper_name,
        created_by: user?.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('[probate/properties] Insert error:', error);
      return res.status(500).json({ error: 'Failed to add property' });
    }
    
    return res.status(201).json({ property: data });
  } catch (error: any) {
    console.error('[probate/properties] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/probate/notices/:noticeId/properties/:propertyId
 * Remove a property from an estate
 */
router.delete('/notices/:noticeId/properties/:propertyId', requireAuth, async (req, res) => {
  try {
    const { noticeId, propertyId } = req.params;
    const supabase = getServiceSupabaseClient();
    
    const { error } = await supabase
      .from('probate_estate_properties')
      .delete()
      .eq('id', propertyId)
      .eq('notice_id', noticeId);
    
    if (error) {
      console.error('[probate/properties] Delete error:', error);
      return res.status(500).json({ error: 'Failed to remove property' });
    }
    
    return res.json({ success: true });
  } catch (error: any) {
    console.error('[probate/properties] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/probate/notices/:noticeId/claims
 * Get all creditor claims for an estate
 */
router.get('/notices/:noticeId/claims', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { status } = req.query;
    const supabase = getServiceSupabaseClient();
    
    let query = supabase
      .from('probate_creditor_claims')
      .select('*')
      .eq('notice_id', noticeId)
      .order('received_at', { ascending: false });
    
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[probate/claims] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch claims' });
    }
    
    // Get counts by status
    const { data: counts } = await supabase
      .from('probate_creditor_claims')
      .select('status')
      .eq('notice_id', noticeId);
    
    const statusCounts = (counts || []).reduce((acc: Record<string, number>, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    return res.json({
      claims: data || [],
      total: data?.length || 0,
      statusCounts
    });
  } catch (error: any) {
    console.error('[probate/claims] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/probate/notices/:noticeId/claims
 * Submit a new creditor claim (public endpoint)
 */
router.post('/notices/:noticeId/claims', optionalAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const {
      claimant_name,
      claimant_address,
      claimant_email,
      claimant_phone,
      claimant_reference,
      claim_type,
      claim_description,
      claim_amount
    } = req.body;
    
    // Validation
    if (!claimant_name || !claim_type || !claim_description) {
      return res.status(400).json({ 
        error: 'Missing required fields: claimant_name, claim_type, claim_description' 
      });
    }
    
    const validClaimTypes = ['debt', 'charge', 'interest', 'beneficial_interest', 'other'];
    if (!validClaimTypes.includes(claim_type)) {
      return res.status(400).json({ 
        error: `Invalid claim_type. Must be one of: ${validClaimTypes.join(', ')}` 
      });
    }
    
    const supabase = getServiceSupabaseClient();
    
    // Verify notice exists and is a probate notice
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('id, notice_type, status, extras')
      .eq('id', noticeId)
      .single();
    
    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    
    if (!notice.notice_type?.includes('probate')) {
      return res.status(400).json({ error: 'Claims can only be submitted against probate notices' });
    }
    
    // Check if deadline has passed
    const tokens = notice.extras?.tokens || {};
    const deadlineDate = tokens.DEADLINE_DATE;
    if (deadlineDate && new Date(deadlineDate) < new Date()) {
      return res.status(400).json({ 
        error: 'The claims deadline has passed for this estate',
        deadline: deadlineDate
      });
    }
    
    // Insert claim
    const { data: claim, error: insertError } = await supabase
      .from('probate_creditor_claims')
      .insert({
        notice_id: noticeId,
        claimant_name,
        claimant_address,
        claimant_email,
        claimant_phone,
        claimant_reference,
        claim_type,
        claim_description,
        claim_amount: claim_amount ? parseFloat(claim_amount) : null,
        status: 'received'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('[probate/claims] Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to submit claim' });
    }
    
    console.log('[probate/claims] New claim submitted:', {
      noticeId,
      claimId: claim.id,
      claimantName: claimant_name,
      claimType: claim_type
    });
    
    // TODO: Send email notification to firm
    
    return res.status(201).json({
      success: true,
      claim: {
        id: claim.id,
        received_at: claim.received_at,
        status: claim.status
      },
      message: 'Claim submitted successfully. The personal representatives will review your claim.'
    });
  } catch (error: any) {
    console.error('[probate/claims] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/probate/notices/:noticeId/claims/:claimId
 * Update claim status (firm only)
 */
router.patch('/notices/:noticeId/claims/:claimId', requireAuth, async (req, res) => {
  try {
    const { noticeId, claimId } = req.params;
    const user = req.user;
    const { status, response_notes } = req.body;
    
    const validStatuses = ['received', 'under_review', 'verified', 'disputed', 'paid', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const supabase = getServiceSupabaseClient();
    
    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (response_notes !== undefined) updateData.response_notes = response_notes;
    if (status && status !== 'received') {
      updateData.responded_at = new Date().toISOString();
      updateData.responded_by = user?.id;
    }
    
    const { data, error } = await supabase
      .from('probate_creditor_claims')
      .update(updateData)
      .eq('id', claimId)
      .eq('notice_id', noticeId)
      .select()
      .single();
    
    if (error) {
      console.error('[probate/claims] Update error:', error);
      return res.status(500).json({ error: 'Failed to update claim' });
    }
    
    return res.json({ claim: data });
  } catch (error: any) {
    console.error('[probate/claims] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/probate/notices/:noticeId/gazette
 * Submit notice to London Gazette
 */
router.post('/notices/:noticeId/gazette', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { gazette_type = 'london' } = req.body;
    
    const supabase = getServiceSupabaseClient();
    
    // Get notice details
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .single();
    
    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    
    if (!notice.notice_type?.includes('probate')) {
      return res.status(400).json({ error: 'Only probate notices can be submitted to the Gazette' });
    }
    
    // Extract tokens from extras
    const tokens = notice.extras?.tokens || {};
    
    // Submit to Gazette
    const response = await submitToGazette({
      noticeId,
      gazetteType: gazette_type,
      noticeContent: {
        deceasedName: tokens.DECEASED_NAME || '',
        deceasedAlias: tokens.DECEASED_ALIAS,
        deceasedLastAddress: tokens.DECEASED_LAST_ADDRESS || '',
        dateOfDeath: tokens.DATE_OF_DEATH || '',
        personalRepresentative: tokens.PERSONAL_REPRESENTATIVE,
        solicitorName: tokens.SOLICITOR_NAME,
        solicitorAddress: tokens.SOLICITOR_ADDRESS || '',
        claimReference: tokens.CLAIM_REFERENCE,
        deadlineDate: tokens.DEADLINE_DATE || ''
      }
    });
    
    if (!response.success) {
      return res.status(400).json({ error: response.error });
    }
    
    return res.json({
      success: true,
      submission: {
        reference: response.submissionReference,
        estimatedPublicationDate: response.estimatedPublicationDate,
        feeAmount: response.feeAmount,
        feeNote: 'This is an estimated fee. Final fee will be confirmed by the Gazette.'
      },
      message: 'Notice submitted to The London Gazette. You will receive confirmation once published.'
    });
  } catch (error: any) {
    console.error('[probate/gazette] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/probate/notices/:noticeId/gazette
 * Get Gazette submission status
 */
router.get('/notices/:noticeId/gazette', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    
    const response = await checkGazetteStatus(noticeId);
    
    if (!response.success) {
      return res.status(404).json({ error: response.error });
    }
    
    return res.json({ gazette: response });
  } catch (error: any) {
    console.error('[probate/gazette] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/probate/notices/:noticeId/summary
 * Get comprehensive estate summary
 */
router.get('/notices/:noticeId/summary', requireAuth, async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();
    
    // Get notice with all related data
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .single();
    
    if (noticeError || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    
    // Get properties
    const { data: properties } = await supabase
      .from('probate_estate_properties')
      .select('*')
      .eq('notice_id', noticeId);
    
    // Get claims
    const { data: claims } = await supabase
      .from('probate_creditor_claims')
      .select('*')
      .eq('notice_id', noticeId);
    
    // Get gazette submission
    const { data: gazette } = await supabase
      .from('probate_gazette_submissions')
      .select('*')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Calculate dates
    const tokens = notice.extras?.tokens || {};
    const publicationDate = notice.published_at ? new Date(notice.published_at) : null;
    const deadlineDate = tokens.DEADLINE_DATE ? new Date(tokens.DEADLINE_DATE) : null;
    const safeDistributionDate = publicationDate
      ? new Date(publicationDate.getTime() + (60 + 7) * 24 * 60 * 60 * 1000) // 60 days + 7 buffer
      : null;
    
    // Calculate claim totals
    const totalClaimsAmount = (claims || []).reduce((sum, c) => sum + (c.claim_amount || 0), 0);
    const pendingClaims = (claims || []).filter(c => c.status === 'received' || c.status === 'under_review');
    
    return res.json({
      estate: {
        noticeId: notice.id,
        deceasedName: tokens.DECEASED_NAME,
        dateOfDeath: tokens.DATE_OF_DEATH,
        status: notice.status,
        publishedAt: notice.published_at
      },
      deadlines: {
        claimsDeadline: deadlineDate?.toISOString(),
        safeDistributionDate: safeDistributionDate?.toISOString(),
        daysUntilDeadline: deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
        deadlinePassed: deadlineDate ? deadlineDate < new Date() : false
      },
      properties: {
        count: properties?.length || 0,
        items: properties || [],
        publishedCount: (properties || []).filter(p => p.publication_status === 'published').length
      },
      claims: {
        total: claims?.length || 0,
        pending: pendingClaims.length,
        totalAmount: totalClaimsAmount,
        byStatus: (claims || []).reduce((acc: Record<string, number>, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {})
      },
      gazette: gazette ? {
        status: gazette.status,
        reference: gazette.submission_reference,
        url: gazette.gazette_url,
        submittedAt: gazette.submitted_at,
        publishedAt: gazette.published_at
      } : null,
      compliance: {
        gazettePublished: gazette?.status === 'published',
        localNewspaperPublished: (properties || []).every(p => p.publication_status === 'published'),
        claimsPeriodComplete: deadlineDate ? deadlineDate < new Date() : false,
        safeToDistribute: safeDistributionDate ? safeDistributionDate < new Date() && pendingClaims.length === 0 : false
      }
    });
  } catch (error: any) {
    console.error('[probate/summary] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/probate/gazette-fee
 * Estimate Gazette fee based on notice content
 */
router.get('/gazette-fee', async (req, res) => {
  try {
    const { wordCount } = req.query;
    
    const count = parseInt(wordCount as string) || 150; // Default notice ~150 words
    const estimate = getGazetteFeeEstimate(count);
    
    return res.json({
      wordCount: count,
      estimatedFee: estimate,
      currency: 'GBP',
      note: 'This is an estimate. Actual fee determined by The London Gazette.'
    });
  } catch (error: any) {
    console.error('[probate/gazette-fee] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
