import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from '../lib/supabase.js';
import crypto from 'crypto';
import { requireAuth, loadUserPermissions, requirePermission } from '../middleware/auth';
import { sendNoticeConfirmation, sendCouncilNotification } from '../services/email';

const router = Router();

// Helper to get authenticated Supabase client
function getAuthenticatedClient(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

// Helper to get current user from auth header
async function getCurrentUser(authHeader: string | undefined) {
  const client = getAuthenticatedClient(authHeader);
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  return data.user;
}

// Helper to generate secure token
function generateSecureToken(): string {
  const bytes = crypto.randomBytes(24);
  let token = bytes.toString('base64');
  token = token.replace(/\//g, '_').replace(/\+/g, '-');
  return token;
}

/**
 * POST /api/notices/publish
 * Direct publishing endpoint for firms - publishes notice that goes live immediately
 */
router.post('/notices/publish', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      target_council_id,
      target_department_id,
      notice_data,
      notice_type,
      title,
      client_id,
      billing_amount // Optional - calculated by database trigger if not provided
    } = req.body;

    // Validation
    if (!target_council_id || !target_department_id || !notice_data) {
      return res.status(400).json({ error: 'Missing required fields: target_council_id, target_department_id, notice_data' });
    }

    if (!title || !notice_type) {
      return res.status(400).json({ error: 'Missing required fields: title, notice_type' });
    }

    const supabase = getServiceSupabaseClient();

    // Get user's organization (must be a firm)
    const { data: memberships } = await supabase
      .from('organization_memberships')
      .select('organization_id, organization:organizations(type, name)')
      .eq('user_id', user.id)
      .single();

    if (!memberships || !(memberships as any).organization?.type) {
      return res.status(403).json({ error: 'Organization not found' });
    }

    const orgType = (memberships as any).organization.type;
    const firmName = (memberships as any).organization.name;
    if (orgType !== 'firm') {
      return res.status(403).json({ error: 'Only firms can publish via this endpoint' });
    }

    // Verify target council and department exist
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('id, organization_id, organizations(name)')
      .eq('id', target_department_id)
      .eq('organization_id', target_council_id)
      .single();

    if (deptError || !department) {
      console.error('[notice-publish] Department lookup error:', deptError);
      return res.status(404).json({ error: 'Department not found' });
    }

    // Fetch custom template for this department (if exists)
    const { data: template } = await supabase
      .from('templates')
      .select('template_text')
      .eq('department_id', target_department_id)
      .eq('notice_type', notice_type)
      .eq('is_active', true)
      .maybeSingle();

    // Helper to check if a value looks like a placeholder that shouldn't be saved
    const isPlaceholderValue = (val: unknown): boolean => {
      if (typeof val !== 'string') return true;
      const trimmed = val.trim();
      if (!trimmed) return true;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) return true;
      if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) return true;
      if (trimmed.toLowerCase().includes('placeholder')) return true;
      if (trimmed.toLowerCase().includes('missing:')) return true;
      if (trimmed.toLowerCase().includes('select activities')) return true;
      if (trimmed.toLowerCase().includes('auto-generate')) return true;
      return false;
    };

    // Sanitize tokens before rendering - ensure NATURE_OF_VARIATION has a valid value for variations
    const sanitizedTokens = { ...(notice_data.extras?.tokens || {}) };
    if (notice_type?.includes('variation')) {
      const currentNov = sanitizedTokens.NATURE_OF_VARIATION;
      if (isPlaceholderValue(currentNov)) {
        // Try to generate from activities
        const activities = typeof sanitizedTokens.LICENSABLE_ACTIVITIES === 'string'
          ? sanitizedTokens.LICENSABLE_ACTIVITIES.trim()
          : '';
        const schedule = typeof sanitizedTokens.ACTIVITY_SCHEDULE === 'string'
          ? sanitizedTokens.ACTIVITY_SCHEDULE.trim()
          : '';

        if (activities && !isPlaceholderValue(activities)) {
          sanitizedTokens.NATURE_OF_VARIATION = `To vary the licence to authorise: ${activities}`;
          console.log('[notice-publish] Server-side fix: Generated NATURE_OF_VARIATION from activities');
        } else if (schedule && !isPlaceholderValue(schedule)) {
          sanitizedTokens.NATURE_OF_VARIATION = `To vary the conditions of the premises licence to permit the following: ${schedule.split('\n')[0]}`;
          console.log('[notice-publish] Server-side fix: Generated NATURE_OF_VARIATION from schedule');
        } else {
          sanitizedTokens.NATURE_OF_VARIATION = 'Vary the conditions of the premises licence as described in the application';
          console.log('[notice-publish] Server-side fix: Using default NATURE_OF_VARIATION');
        }
      }
    }

    // Render template with tokens if custom template exists
    let renderedNoticeText = title || notice_data.description || null;
    if (template && template.template_text && Object.keys(sanitizedTokens).length > 0) {
      console.log('[notice-publish] Found custom template, rendering with tokens...');
      console.log('[notice-publish] Template preview:', template.template_text.substring(0, 200));
      console.log('[notice-publish] Tokens received:', Object.keys(sanitizedTokens));
      console.log('[notice-publish] NATURE_OF_VARIATION:', sanitizedTokens.NATURE_OF_VARIATION?.substring(0, 50));

      let rendered = template.template_text;

      // Replace all {{TOKEN}} placeholders with actual values
      for (const [key, value] of Object.entries(sanitizedTokens)) {
        const placeholder = `{{${key}}}`;
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value || ''));
      }

      renderedNoticeText = rendered;
      console.log('[notice-publish] Template rendered successfully');
      console.log('[notice-publish] Rendered preview:', renderedNoticeText.substring(0, 300));
    } else {
      console.log('[notice-publish] No custom template found or missing tokens', {
        hasTemplate: !!template,
        hasTemplateText: !!template?.template_text,
        hasTokens: Object.keys(sanitizedTokens).length > 0
      });
    }

    // Extract application_date from consultation data for database trigger
    // The trigger will automatically calculate reps_deadline as application_date + 28 days
    const consultation = notice_data.consultation || {};
    const applicationDate = consultation.applicationDate ? new Date(consultation.applicationDate) : new Date();

    // Create published notice (goes live immediately)
    const { data: notice, error: noticeError} = await supabase
      .from('notices')
      .insert({
        organization_id: target_council_id,
        department_id: target_department_id,
        created_by: user.id,
        notice_type,
        status: 'published', // Goes live immediately
        description: renderedNoticeText, // Use rendered template text
        premises: notice_data.premises || {},
        applicant: notice_data.applicant || {},
        consultation: notice_data.consultation || {},
        application_date: applicationDate.toISOString().split('T')[0], // Extract date part for database column
        // reps_deadline will be auto-calculated by database trigger (application_date + 28 days)
        extras: {
          ...notice_data.extras,
          published_by_organization_id: memberships.organization_id,
          published_by_user_id: user.id,
          client_id: client_id || null,
        },
        published_at: new Date().toISOString(),
        // representation_deadline no longer set here - using reps_deadline column instead
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (noticeError) {
      console.error('[notice-publish] Error creating notice:', noticeError);
      return res.status(500).json({ error: 'Failed to publish notice' });
    }

    // Generate magic link for firm to view their notice
    const magicToken = generateSecureToken();
    const { error: tokenError } = await supabase
      .from('notice_access_tokens')
      .insert({
        notice_id: notice.id,
        token: magicToken,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        created_for: user.id
      });

    if (tokenError) {
      console.error('[notice-publish] Error creating access token:', tokenError);
      // Don't fail the request if token creation fails
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const magicLink = `${appUrl}/notices/${notice.id}?token=${magicToken}`;

    // Send email notification to firm
    await sendNoticeConfirmation(user.email, {
      noticeTitle: notice.title,
      noticeType: notice.notice_type,
      councilName: (department as any).organizations?.name || 'Unknown Council',
      publishedDate: new Date(notice.published_at).toLocaleDateString('en-GB'),
      deadline: notice.reps_deadline ? new Date(notice.reps_deadline).toLocaleDateString('en-GB') : 'TBD',
      noticeUrl: magicLink,
      firmName: firmName
    });

    // Send notification to council department
    try {
      // Fetch council contact email
      const { data: councilOrg } = await supabase
        .from('organizations')
        .select('contact_email, name')
        .eq('id', target_council_id)
        .single();

      // Fetch department name
      const { data: deptData } = await supabase
        .from('departments')
        .select('name')
        .eq('id', target_department_id)
        .single();

      const councilEmail = councilOrg?.contact_email;
      const councilName = councilOrg?.name || 'Unknown Council';
      const departmentName = deptData?.name || 'Unknown Department';
      const premisesName = notice_data.premises?.name || '';
      const premisesAddress = notice_data.premises?.address || '';
      const noticeUrl = `${appUrl}/notices/${notice.id}`;

      if (councilEmail) {
        const subject = `New Notice Published: ${notice_type} - ${premisesName || premisesAddress || 'Application'}`;
        
        const bodyText = `
New Notice Published

A new ${notice_type} notice has been published by ${firmName}.

Notice Details:
- Type: ${notice_type}
${premisesName ? `- Premises: ${premisesName}` : ''}
${premisesAddress ? `- Address: ${premisesAddress}` : ''}
- Published: ${new Date(notice.published_at).toLocaleDateString('en-GB')}
- Deadline: ${notice.reps_deadline ? new Date(notice.reps_deadline).toLocaleDateString('en-GB') : 'TBD'}

View the notice: ${noticeUrl}

This notice was published via CivicNotices.
        `;

        const bodyHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>${subject}</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Notice Published</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
                <p>A new <strong>${notice_type}</strong> notice has been published by <strong>${firmName}</strong>.</p>
                
                <div style="background: #f9fafb; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px;">Notice Details</h3>
                  <p style="margin: 5px 0;"><strong>Type:</strong> ${notice_type}</p>
                  ${premisesName ? `<p style="margin: 5px 0;"><strong>Premises:</strong> ${premisesName}</p>` : ''}
                  ${premisesAddress ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${premisesAddress}</p>` : ''}
                  <p style="margin: 5px 0;"><strong>Published:</strong> ${new Date(notice.published_at).toLocaleDateString('en-GB')}</p>
                  <p style="margin: 5px 0;"><strong>Deadline:</strong> ${notice.reps_deadline ? new Date(notice.reps_deadline).toLocaleDateString('en-GB') : 'TBD'}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${noticeUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Notice</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">This notice was published via CivicNotices and requires your attention for the ${departmentName} department.</p>
              </div>
              <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                <p>CivicNotices - Public Notice Management</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendCouncilNotification({
          to: councilEmail,
          subject,
          bodyText,
          bodyHtml,
          councilName,
          departmentName
        });

        console.log('[notice-publish] Council notification sent to:', councilEmail);
      } else {
        console.log('[notice-publish] No council contact email found, skipping notification');
      }
    } catch (emailError) {
      // Log but don't fail the request if council notification fails
      console.error('[notice-publish] Failed to send council notification:', emailError);
    }

    console.log('[notice-publish] Notice published successfully:', {
      id: notice.id,
      firm: memberships.organization_id,
      council: target_council_id,
      department: target_department_id,
    });

    return res.json({
      notice: {
        id: notice.id,
        title: notice.description || title, // Use description field (title doesn't exist in schema)
        notice_type: notice.notice_type,
        status: notice.status,
        published_at: notice.published_at,
        application_date: notice.application_date,
        reps_deadline: notice.reps_deadline, // Auto-calculated by database trigger
        expires_at: notice.expires_at,
        council_name: (department as any).organizations?.name || 'Unknown Council',
        billing_amount: notice.billing_amount || null,
        billing_status: notice.billing_status || 'pending',
      },
      magicLink,
      message: 'Notice published successfully'
    });
  } catch (error: any) {
    console.error('[notice-publish] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/billing/account
 * Get account balance and recent transactions for authenticated firm
 */
router.get('/billing/account', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getServiceSupabaseClient();

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get account balance from view
    const { data: balanceData } = await supabase
      .from('organization_account_balances')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .single();

    // Get recent transactions (last 50)
    const { data: transactions } = await supabase
      .from('billing_transactions')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .limit(50);

    return res.json({
      balance: balanceData?.current_balance || 0,
      unpaid_charges: balanceData?.unpaid_charges || 0,
      last_transaction_date: balanceData?.last_transaction_date || null,
      transactions: transactions || []
    });
  } catch (error: any) {
    console.error('[billing-account] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/pay
 * Process payment for firm account (Stripe integration placeholder)
 */
router.post('/billing/pay', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, payment_method } = req.body;

    if (!amount || !payment_method) {
      return res.status(400).json({ error: 'Missing required fields: amount, payment_method' });
    }

    const supabase = getServiceSupabaseClient();

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, organization:organizations(name, contact_email)')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // TODO: Integrate with Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to pence
    //   currency: 'gbp',
    //   payment_method,
    //   confirm: true,
    //   metadata: {
    //     organization_id: membership.organization_id,
    //     user_id: user.id
    //   }
    // });

    // For now, simulate successful payment
    const mockPaymentIntentId = `pi_${generateSecureToken()}`;

    // Record payment in billing_transactions
    const { error: txError } = await supabase
      .from('billing_transactions')
      .insert({
        organization_id: membership.organization_id,
        type: 'payment',
        amount: -Math.abs(amount), // Negative for payment (reduces balance)
        payment_intent_id: mockPaymentIntentId,
        description: 'Payment received - Stripe',
        status: 'succeeded',
        created_by: user.id
      });

    if (txError) {
      console.error('[billing-pay] Error recording payment:', txError);
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    // Update pending notices to paid (oldest first)
    await supabase
      .from('notices')
      .update({ billing_status: 'paid' })
      .eq('published_by_organization_id', membership.organization_id)
      .eq('billing_status', 'pending')
      .lte('billing_amount', Math.abs(amount))
      .order('published_at', { ascending: true });

    return res.json({
      success: true,
      payment_intent_id: mockPaymentIntentId,
      amount: Math.abs(amount),
      message: 'Payment processed successfully'
    });
  } catch (error: any) {
    console.error('[billing-pay] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/representations/:noticeId
 * Get all representations for a notice (accessible by firm that published or council)
 */
router.get('/representations/:noticeId', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { noticeId } = req.params;

    if (!noticeId) {
      return res.status(400).json({ error: 'Notice ID required' });
    }

    const supabase = getServiceSupabaseClient();

    // Check if user has access to this notice
    const { data: notice } = await supabase
      .from('notices')
      .select('published_by_organization_id, organization_id, department_id')
      .eq('id', noticeId)
      .single();

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Get user's organizations
    const { data: memberships } = await supabase
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id);

    const userOrgIds = memberships?.map(m => m.organization_id) || [];

    // Check if user has access (either firm that published or council that received)
    const hasAccess =
      userOrgIds.includes(notice.published_by_organization_id) || // Firm that published
      userOrgIds.includes(notice.organization_id); // Target council

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get representations
    const { data: representations, error: repsError } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: false });

    if (repsError) {
      console.error('[representations] Error fetching representations:', repsError);
      return res.status(500).json({ error: 'Failed to fetch representations' });
    }

    return res.json({
      representations: representations || [],
      count: representations?.length || 0
    });
  } catch (error: any) {
    console.error('[representations] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
