import { createHmac } from 'crypto';
import { getServiceSupabaseClient } from '../lib/supabase';

export type WebhookEventType =
  | 'notice.published'
  | 'notice.expired'
  | 'notice.updated'
  | 'representation.submitted'
  | 'workflow.stage_changed'
  | 'payment.completed';

interface WebhookPayload {
  event: WebhookEventType;
  event_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface Webhook {
  id: string;
  url: string;
  secret: string;
  timeout_ms: number;
}

/**
 * Send a webhook event to all subscribed endpoints for an organization.
 */
export async function sendWebhookEvent(
  organizationId: string,
  event: WebhookEventType,
  eventId: string,
  data: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  const supabase = getServiceSupabaseClient();
  const stats = { sent: 0, failed: 0 };

  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('id, url, secret, timeout_ms')
    .eq('organization_id', organizationId)
    .eq('enabled', true)
    .eq('status', 'active')
    .contains('events', [event]);

  if (error || !webhooks?.length) return stats;

  const payload: WebhookPayload = {
    event,
    event_id: eventId,
    timestamp: new Date().toISOString(),
    data
  };

  for (const webhook of webhooks as Webhook[]) {
    const success = await deliverWebhook(webhook, payload);
    success ? stats.sent++ : stats.failed++;
  }

  return stats;
}

async function deliverWebhook(webhook: Webhook, payload: WebhookPayload): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', webhook.secret).update(body).digest('hex');
  const start = Date.now();

  const { data: delivery } = await supabase
    .from('webhook_deliveries')
    .insert({
      webhook_id: webhook.id,
      event_type: payload.event,
      event_id: payload.event_id,
      payload,
      status: 'pending'
    })
    .select('id')
    .single();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': payload.event
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    const now = new Date().toISOString();

    await supabase.from('webhook_deliveries').update({
      status: response.ok ? 'success' : 'failed',
      response_status: response.status,
      response_time_ms: responseTime,
      delivered_at: now
    }).eq('id', delivery?.id);

    await supabase.from('webhooks').update({
      last_triggered_at: now,
      ...(response.ok ? { last_success_at: now } : { last_failure_at: now })
    }).eq('id', webhook.id);

    return response.ok;
  } catch (err: any) {
    await supabase.from('webhook_deliveries').update({
      status: 'failed',
      error_message: err.message || 'Delivery failed',
      response_time_ms: Date.now() - start
    }).eq('id', delivery?.id);

    return false;
  }
}
