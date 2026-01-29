-- Deadline Reminders Table
-- Scheduled notification records

CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  workflow_status_id UUID REFERENCES public.notice_workflow_status(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Reminder details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'deadline_upcoming',      -- X days before deadline
    'deadline_today',         -- On the deadline day
    'deadline_overdue',       -- After deadline passed
    'representation_received',-- When representation submitted
    'stage_reminder'          -- Generic stage reminder
  )),

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),

  -- Delivery
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push')),
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_user_id UUID REFERENCES auth.users(id),

  -- Content
  subject TEXT,
  message TEXT,
  related_deadline_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_error TEXT
);

-- Indexes
CREATE INDEX idx_deadline_reminders_notice ON public.deadline_reminders(notice_id);
CREATE INDEX idx_deadline_reminders_firm ON public.deadline_reminders(firm_id);
CREATE INDEX idx_deadline_reminders_scheduled ON public.deadline_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_deadline_reminders_status ON public.deadline_reminders(status);
CREATE INDEX idx_deadline_reminders_pending ON public.deadline_reminders(scheduled_for, status) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_deadline_reminders_updated_at
  BEFORE UPDATE ON public.deadline_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members can view their reminders" ON public.deadline_reminders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = deadline_reminders.firm_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm admins can manage reminders" ON public.deadline_reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = deadline_reminders.firm_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON public.deadline_reminders TO authenticated;
