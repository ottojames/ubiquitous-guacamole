import cron from 'node-cron';
import { getServiceSupabaseClient } from '../lib/supabase';
import { sendAlertEmail } from '../services/email';

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check for new notices and send alerts to subscribers
 */
async function checkAndSendAlerts() {
  console.log('[Alert Delivery] Starting alert check...');

  try {
    const supabase = getServiceSupabaseClient();

    // Get notices published in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: newNotices, error: noticesError } = await supabase
      .from('notices')
      .select('*')
      .eq('status', 'published')
      .gte('published_at', oneHourAgo);

    if (noticesError) {
      console.error('[Alert Delivery] Error fetching new notices:', noticesError);
      return;
    }

    if (!newNotices || newNotices.length === 0) {
      console.log('[Alert Delivery] No new notices to process');
      return;
    }

    console.log(`[Alert Delivery] Found ${newNotices.length} new notices`);

    // Get all active subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('is_verified', true);

    if (subsError) {
      console.error('[Alert Delivery] Error fetching subscriptions:', subsError);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Alert Delivery] No active subscriptions');
      return;
    }

    console.log(`[Alert Delivery] Processing ${subscriptions.length} subscriptions`);

    // Process each subscription
    for (const subscription of subscriptions) {
      const relevantNotices = [];

      // Check each notice against subscription criteria
      for (const notice of newNotices) {
        // Skip if we've already sent this notice to this subscription
        const { data: alreadySent } = await supabase
          .from('email_alerts_sent')
          .select('id')
          .eq('subscription_id', subscription.id)
          .eq('notice_id', notice.id)
          .single();

        if (alreadySent) {
          continue;
        }

        // Check if notice has coordinates
        if (!notice.lat || !notice.lng || !subscription.lat || !subscription.lng) {
          continue;
        }

        // Calculate distance
        const distance = calculateDistance(
          subscription.lat,
          subscription.lng,
          notice.lat,
          notice.lng
        );

        // Check if within radius
        if (distance <= subscription.radius_km) {
          // Check notice type filter
          if (subscription.notice_types?.includes('all') ||
              subscription.notice_types?.includes(notice.application_type)) {
            relevantNotices.push({
              ...notice,
              distance
            });
          }
        }
      }

      // Send alert if there are relevant notices
      if (relevantNotices.length > 0) {
        console.log(`[Alert Delivery] Sending ${relevantNotices.length} notices to ${subscription.email}`);

        const emailData = {
          notices: relevantNotices.map(n => ({
            id: n.id,
            noticeType: n.application_type || 'Notice',
            premisesName: n.trading_name || n.premises_name,
            premisesAddress: n.premises_address?.formatted || n.premises_address,
            distance: n.distance,
            viewUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/notices/${n.id}`
          })),
          postcode: subscription.postcode,
          radius: subscription.radius_km,
          unsubscribeToken: subscription.unsubscribe_token
        };

        const emailResult = await sendAlertEmail(subscription.email, emailData);

        if (emailResult.success) {
          // Record sent alerts
          for (const notice of relevantNotices) {
            await supabase
              .from('email_alerts_sent')
              .insert({
                subscription_id: subscription.id,
                notice_id: notice.id
              });
          }

          // Update last_sent_at
          await supabase
            .from('email_subscriptions')
            .update({ last_sent_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          console.error(`[Alert Delivery] Failed to send email to ${subscription.email}:`, emailResult.error);
        }
      }
    }

    console.log('[Alert Delivery] Alert check complete');
  } catch (error) {
    console.error('[Alert Delivery] Unexpected error:', error);
  }
}

/**
 * Start the alert delivery cron job
 * Runs every hour at minute 5
 */
export function startAlertDeliveryJob() {
  // Run every hour at minute 5
  cron.schedule('5 * * * *', async () => {
    await checkAndSendAlerts();
  });

  console.log('[Alert Delivery] Job scheduled to run hourly at minute 5');
}

// Export for testing
export { checkAndSendAlerts };