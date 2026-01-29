-- Webhooks Table
-- Stores webhook subscriptions for organizations to receive event notifications

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Webhook Configuration
  name TEXT NOT NULL, -- Human-readable name for the webhook
  url TEXT NOT NULL, -- The endpoint URL to call
  secret TEXT NOT NULL, -- Secret for HMAC signature verification

  -- Event Subscriptions (which events trigger this webhook)
  events TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['notice.published', 'representation.submitted']
  -- Supported events:
  --   notice.published     - When a notice is published
  --   notice.expired       - When a notice expires
  --   notice.updated       - When a notice is updated
  --   representation.submitted - When a representation is submitted
  --   workflow.stage_changed   - When a notice workflow stage changes
  --   payment.completed    - When a payment is completed

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'disabled')),

  -- Delivery Settings
  retry_count INTEGER NOT NULL DEFAULT 3, -- Max retry attempts on failure
  timeout_ms INTEGER NOT NULL DEFAULT 30000, -- Request timeout in milliseconds

  -- Stats (updated after each delivery attempt)
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_url CHECK (url ~* '^https?://'),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 10),
  CONSTRAINT valid_timeout CHECK (timeout_ms >= 1000 AND timeout_ms <= 60000)
);

-- Indexes
CREATE INDEX idx_webhooks_organization ON public.webhooks(organization_id);
CREATE INDEX idx_webhooks_enabled ON public.webhooks(organization_id) WHERE enabled = TRUE;
CREATE INDEX idx_webhooks_status ON public.webhooks(status);
CREATE INDEX idx_webhooks_events ON public.webhooks USING GIN(events);

-- Trigger for updated_at
CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins can manage their webhooks
CREATE POLICY "Organization admins can manage webhooks" ON public.webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = webhooks.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Policy: Organization members can view webhooks
CREATE POLICY "Organization members can view webhooks" ON public.webhooks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = webhooks.organization_id
      AND om.user_id = auth.uid()
    )
  );

GRANT ALL ON public.webhooks TO authenticated;

-- Webhook Delivery Logs Table
-- Stores delivery attempts for debugging and auditing

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL,
  event_id UUID, -- Reference to the source record (notice_id, representation_id, etc.)
  payload JSONB NOT NULL DEFAULT '{}',

  -- Delivery Details
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),

  -- Response
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Error Tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Indexes for webhook_deliveries
CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created ON public.webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON public.webhook_deliveries(created_at, status)
  WHERE status IN ('pending', 'retrying');

-- RLS for webhook_deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view deliveries for their organization's webhooks
CREATE POLICY "Organization members can view webhook deliveries" ON public.webhook_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.webhooks w
      JOIN public.organization_memberships om ON om.organization_id = w.organization_id
      WHERE w.id = webhook_deliveries.webhook_id
      AND om.user_id = auth.uid()
    )
  );

-- Service role can insert deliveries (webhook service runs as service role)
CREATE POLICY "Service can insert webhook deliveries" ON public.webhook_deliveries
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service can update webhook deliveries" ON public.webhook_deliveries
  FOR UPDATE
  USING (TRUE);

GRANT ALL ON public.webhook_deliveries TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.webhooks IS 'Webhook subscriptions for organizations to receive event notifications';
COMMENT ON TABLE public.webhook_deliveries IS 'Delivery attempt logs for webhook debugging and auditing';

COMMENT ON COLUMN public.webhooks.events IS 'Array of event types this webhook subscribes to: notice.published, notice.expired, representation.submitted, workflow.stage_changed, payment.completed';
COMMENT ON COLUMN public.webhooks.secret IS 'Secret key for generating HMAC-SHA256 signature in X-Webhook-Signature header';
COMMENT ON COLUMN public.webhooks.status IS 'active: receiving events, paused: manually paused, failed: auto-paused after repeated failures, disabled: permanently disabled';
