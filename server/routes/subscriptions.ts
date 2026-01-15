import { Router } from 'express';
import { z } from 'zod';
import { getServiceSupabaseClient } from '../lib/supabase';
import { sendSubscriptionVerification, sendAlertEmail } from '../services/email';

const router = Router();

// Subscription request schema
const createSubscriptionSchema = z.object({
  email: z.string().email(),
  postcode: z.string().regex(/^[A-Za-z]{1,2}[0-9][0-9A-Za-z]?\s?[0-9][A-Za-z]{2}$/),
  radius_km: z.number().min(0.5).max(50).refine((val) => [0.5, 1, 2, 5].includes(val)),
  notice_types: z.array(z.string()).optional(),
});

/**
 * Create new email subscription
 */
router.post('/create', async (req, res) => {
  try {
    const validation = createSubscriptionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.issues
      });
    }

    const { email, postcode, radius_km, notice_types } = validation.data;
    const supabase = getServiceSupabaseClient();

    // Normalize postcode
    const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, '');

    // Geocode the postcode to get lat/lng
    const geocodeResponse = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalizedPostcode)}`
    );

    if (!geocodeResponse.ok) {
      return res.status(400).json({ error: 'Invalid postcode' });
    }

    const geocodeData = await geocodeResponse.json();
    const { latitude, longitude } = geocodeData.result;

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('email_subscriptions')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('postcode', normalizedPostcode)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({
          error: 'You already have an active subscription for this postcode'
        });
      } else if (existing.status === 'pending') {
        return res.status(400).json({
          error: 'Please check your email to verify your existing subscription'
        });
      }
    }

    // Create new subscription
    const { data: subscription, error } = await supabase
      .from('email_subscriptions')
      .insert({
        email: email.toLowerCase(),
        postcode: normalizedPostcode,
        lat: latitude,
        lng: longitude,
        radius_km,
        notice_types: notice_types || ['all'],
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    // Send verification email
    const emailResult = await sendSubscriptionVerification(email, {
      verificationToken: subscription.verification_token,
      postcode: normalizedPostcode,
      radius: radius_km,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Delete the subscription if email fails
      await supabase
        .from('email_subscriptions')
        .delete()
        .eq('id', subscription.id);

      return res.status(500).json({
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Subscription created. Please check your email to verify.',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Verify email subscription
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const supabase = getServiceSupabaseClient();

    // Find and update subscription
    const { data: subscription, error } = await supabase
      .from('email_subscriptions')
      .update({
        status: 'active',
        is_verified: true,
      })
      .eq('verification_token', token)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !subscription) {
      return res.status(400).json({
        error: 'Invalid or expired verification token'
      });
    }

    // Redirect to success page or return success
    res.redirect(`${process.env.VITE_APP_URL || 'http://localhost:5173'}/notices?verified=true`);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
});

/**
 * Unsubscribe from email alerts
 */
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const supabase = getServiceSupabaseClient();

    // Update subscription status
    const { data: subscription, error } = await supabase
      .from('email_subscriptions')
      .update({ status: 'unsubscribed' })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error || !subscription) {
      return res.status(400).json({
        error: 'Invalid unsubscribe token'
      });
    }

    // Redirect to confirmation page
    res.redirect(`${process.env.VITE_APP_URL || 'http://localhost:5173'}/notices?unsubscribed=true`);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Get subscription details (for management UI)
 */
router.post('/manage', async (req, res) => {
  try {
    const { email, token } = req.body;
    const supabase = getServiceSupabaseClient();

    let query = supabase
      .from('email_subscriptions')
      .select('id, email, postcode, radius_km, notice_types, status, created_at');

    if (token) {
      query = query.or(`verification_token.eq.${token},unsubscribe_token.eq.${token}`);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    } else {
      return res.status(400).json({ error: 'Email or token required' });
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    res.json({ subscriptions });
  } catch (error) {
    console.error('Manage subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * Update subscription preferences
 */
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { radius_km, notice_types, token } = req.body;
    const supabase = getServiceSupabaseClient();

    // Verify ownership via token
    const { data: existing } = await supabase
      .from('email_subscriptions')
      .select('id')
      .eq('id', id)
      .or(`verification_token.eq.${token},unsubscribe_token.eq.${token}`)
      .single();

    if (!existing) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update subscription
    const { data: subscription, error } = await supabase
      .from('email_subscriptions')
      .update({
        radius_km,
        notice_types,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;