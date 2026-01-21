import { Router } from 'express';
import Stripe from 'stripe';
import { getServiceSupabaseClient } from '../lib/supabase';
import { sendNoticeConfirmation } from '../services/email';

const router = Router();

// Initialize Stripe - we'll need to add these keys to .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

/**
 * Create Stripe checkout session for notice payment
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error: 'Payment processing not configured. Please contact support.'
      });
    }

    const {
      noticeId,
      noticeType,
      applicantEmail,
      returnUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/notices/:id/confirmation`
    } = req.body;

    if (!noticeId || !noticeType || !applicantEmail) {
      return res.status(400).json({
        error: 'Missing required fields: noticeId, noticeType, applicantEmail'
      });
    }

    // Create Stripe checkout session for £50
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Public Notice - ${noticeType}`,
              description: 'Publication of statutory notice on Civic Notices platform',
            },
            unit_amount: 5000, // £50 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: returnUrl.replace(':id', noticeId) + '?payment=success',
      cancel_url: returnUrl.replace(':id', noticeId) + '?payment=cancelled',
      customer_email: applicantEmail,
      metadata: {
        noticeId,
        noticeType,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({
      error: 'Failed to create payment session'
    });
  }
});

/**
 * Stripe webhook handler for payment confirmations
 */
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { noticeId } = session.metadata || {};

    if (noticeId) {
      try {
        // Update notice status to published
        const supabase = getServiceSupabaseClient();
        const { error: updateError } = await supabase
          .from('notices')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
          })
          .eq('id', noticeId);

        if (updateError) {
          console.error('Failed to update notice status:', updateError);
        } else {
          console.log(`Notice ${noticeId} published after successful payment`);

          // Fetch the full notice details for the email
          const { data: noticeData, error: fetchError } = await supabase
            .from('notices')
            .select('*')
            .eq('id', noticeId)
            .single();

          if (noticeData && !fetchError) {
            const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

            // Send confirmation email
            const emailResult = await sendNoticeConfirmation(
              noticeData.applicant_email || session.customer_email as string,
              {
                noticeId: noticeData.id,
                noticeType: noticeData.application_type || 'Notice',
                premisesName: noticeData.trading_name || noticeData.premises_name,
                premisesAddress: noticeData.premises_address?.formatted || noticeData.premises_address,
                applicantName: noticeData.applicant_name,
                noticeText: noticeData.preview_text || '',
                viewUrl: `${baseUrl}/notices/${noticeId}`,
                trackingUrl: noticeData.tracking_token ? `${baseUrl}/track?token=${noticeData.tracking_token}` : undefined
              }
            );

            if (!emailResult.success) {
              console.error('Failed to send confirmation email:', emailResult.error);
            } else {
              console.log('Confirmation email sent successfully');
            }

            // TODO: Generate PDF certificate
          }
        }
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    }
  }

  res.json({ received: true });
});

export default router;