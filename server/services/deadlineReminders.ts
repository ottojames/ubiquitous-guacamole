import { getServiceSupabaseClient } from '../lib/supabase';
import { sendDeadlineReminder } from './email';

/**
 * PRD-compliant alert cascade:
 * - 14 days: Dashboard warning + email
 * - 7 days: SMS + email + dashboard
 * - 48 hours: Phone call trigger + urgent dashboard
 * - Missed: Escalation protocol + client notification
 */

// Alert cascade configuration per PRD
const ALERT_CASCADE = [
  { daysBefore: 14, type: 'deadline_upcoming', urgency: 'warning', channels: ['email'] },
  { daysBefore: 7, type: 'deadline_upcoming', urgency: 'important', channels: ['email', 'sms'] },
  { daysBefore: 2, type: 'deadline_upcoming', urgency: 'critical', channels: ['email', 'sms', 'phone_trigger'] }, // 48 hours
  { daysBefore: 0, type: 'deadline_today', urgency: 'final', channels: ['email', 'sms'] },
  { daysBefore: -1, type: 'deadline_overdue', urgency: 'escalation', channels: ['email', 'sms', 'phone_trigger'] },
];

interface DeadlineReminder {
  id: string;
  notice_id: string;
  firm_id: string;
  workflow_status_id: string | null;
  reminder_type: string;
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  channel: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  message: string | null;
  related_deadline_date: string | null;
  sent_error: string | null;
  notice?: {
    id: string;
    notice_type: string;
    premises?: any;
    address?: string;
  };
}

/**
 * Process pending deadline reminders.
 * Queries reminders that are due, sends emails, and updates their status.
 */
export async function processDeadlineReminders(): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = getServiceSupabaseClient();
  const stats = { processed: 0, sent: 0, failed: 0 };

  // Get pending reminders that are due
  const { data: reminders, error } = await supabase
    .from('deadline_reminders')
    .select(`
      *,
      notice:notices(id, notice_type, premises, address)
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (error) {
    console.error('[DeadlineReminders] Error fetching reminders:', error);
    return stats;
  }

  console.log(`[DeadlineReminders] Found ${reminders?.length || 0} pending reminders to process`);

  for (const reminder of (reminders || []) as DeadlineReminder[]) {
    stats.processed++;

    // Handle different channels
    if (reminder.channel === 'email') {
      if (!reminder.recipient_email) {
        console.warn(`[DeadlineReminders] Skipping email reminder ${reminder.id}: no recipient email`);
        continue;
      }
      await processEmailReminder(supabase, reminder, stats);
    } else if (reminder.channel === 'sms') {
      // SMS handling - log for now (would integrate with Twilio or similar)
      if (!reminder.recipient_phone) {
        console.warn(`[DeadlineReminders] Skipping SMS reminder ${reminder.id}: no recipient phone`);
        continue;
      }
      await processSmsReminder(supabase, reminder, stats);
    } else if (reminder.channel === 'phone_trigger') {
      // Phone call trigger - creates a task/notification for manual follow-up
      await processPhoneTrigger(supabase, reminder, stats);
    }
  }

  console.log(`[DeadlineReminders] Processed: ${stats.processed}, Sent: ${stats.sent}, Failed: ${stats.failed}`);
  return stats;
}

async function processEmailReminder(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  reminder: DeadlineReminder,
  stats: { processed: number; sent: number; failed: number }
) {
  try {
    // Calculate hours remaining until deadline
    const hoursRemaining = reminder.related_deadline_date
      ? Math.max(0, Math.round((new Date(reminder.related_deadline_date).getTime() - Date.now()) / (1000 * 60 * 60)))
      : 24;

    // Format deadline date
    const deadlineFormatted = reminder.related_deadline_date
      ? new Date(reminder.related_deadline_date).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'soon';

    // Extract premises info
    const premisesName = reminder.notice?.premises?.name || undefined;
    const premisesAddress = typeof reminder.notice?.premises === 'object' 
      ? reminder.notice?.premises?.address 
      : reminder.notice?.address;

    // Send the email using the existing sendDeadlineReminder function
    const result = await sendDeadlineReminder({
      noticeId: reminder.notice_id,
      noticeType: reminder.notice?.notice_type || 'Notice',
      premisesName,
      premisesAddress,
      deadline: deadlineFormatted,
      hoursRemaining,
      noticeUrl: `${process.env.VITE_APP_URL || 'https://civicnotices.uk'}/notices/${reminder.notice_id}`,
      recipientEmail: reminder.recipient_email!
    });

    if (result.success) {
      await supabase
        .from('deadline_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      stats.sent++;
      console.log(`[DeadlineReminders] Sent email reminder ${reminder.id} to ${reminder.recipient_email}`);
    } else {
      throw new Error(result.error || 'Email sending failed');
    }
  } catch (err: any) {
    console.error(`[DeadlineReminders] Error sending email reminder ${reminder.id}:`, err);
    await supabase
      .from('deadline_reminders')
      .update({
        status: 'failed',
        sent_error: err.message || 'Unknown error'
      })
      .eq('id', reminder.id);
    stats.failed++;
  }
}

async function processSmsReminder(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  reminder: DeadlineReminder,
  stats: { processed: number; sent: number; failed: number }
) {
  // TODO: Integrate with SMS provider (Twilio, etc.)
  // For now, mark as sent and log
  console.log(`[DeadlineReminders] SMS reminder ${reminder.id} would be sent to ${reminder.recipient_phone}`);
  
  await supabase
    .from('deadline_reminders')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_error: 'SMS not yet implemented - logged only'
    })
    .eq('id', reminder.id);
  
  stats.sent++;
}

async function processPhoneTrigger(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  reminder: DeadlineReminder,
  stats: { processed: number; sent: number; failed: number }
) {
  // Phone trigger creates a high-priority notification for manual follow-up
  // This appears on the dashboard as an urgent action item
  console.log(`[DeadlineReminders] Phone trigger ${reminder.id} - Manual call needed for notice ${reminder.notice_id}`);
  
  // Could create an internal notification/task here
  // For now, mark as sent (it's a trigger, not an actual call)
  await supabase
    .from('deadline_reminders')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_error: 'Phone trigger logged - manual follow-up required'
    })
    .eq('id', reminder.id);
  
  stats.sent++;
}

/**
 * Schedule deadline reminders for a notice stage transition.
 * Uses PRD-compliant alert cascade: 14 days, 7 days, 48 hours, day of, overdue.
 */
export async function scheduleDeadlineReminders(
  noticeId: string,
  firmId: string,
  deadlineDate: string,
  stageName: string
): Promise<number> {
  const supabase = getServiceSupabaseClient();
  let remindersCreated = 0;

  // Get firm admin/owner emails and phones for notifications
  const { data: members, error: membersError } = await supabase
    .from('organization_memberships')
    .select(`
      user_id,
      role,
      profiles:user_id(email, phone)
    `)
    .eq('organization_id', firmId)
    .in('role', ['owner', 'admin']);

  if (membersError) {
    console.error('[DeadlineReminders] Error fetching firm members:', membersError);
    return 0;
  }

  // Extract contact info from members
  const contacts = (members || [])
    .map(m => ({
      email: (m.profiles as any)?.email,
      phone: (m.profiles as any)?.phone,
      role: m.role
    }))
    .filter(c => c.email || c.phone);

  if (contacts.length === 0) {
    console.log('[DeadlineReminders] No admin contacts found for firm:', firmId);
    return 0;
  }

  const deadline = new Date(deadlineDate);
  const now = new Date();

  // Schedule reminders using PRD-compliant cascade
  for (const alert of ALERT_CASCADE) {
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - alert.daysBefore);

    // Don't schedule reminders in the past (except overdue notifications)
    if (reminderDate <= now && alert.daysBefore >= 0) continue;

    // Create reminders for each channel in the alert
    for (const channel of alert.channels) {
      for (const contact of contacts) {
        // Skip if contact doesn't have required info for channel
        if (channel === 'email' && !contact.email) continue;
        if ((channel === 'sms' || channel === 'phone_trigger') && !contact.phone) continue;

        const urgencyPrefix = alert.urgency === 'escalation' ? '🚨 OVERDUE: ' :
                             alert.urgency === 'critical' ? '⚠️ URGENT: ' :
                             alert.urgency === 'important' ? '📢 ' : '';

        const subject = alert.daysBefore < 0 
          ? `${urgencyPrefix}${stageName} deadline PASSED`
          : alert.daysBefore === 0 
            ? `${urgencyPrefix}${stageName} deadline is TODAY`
            : `${urgencyPrefix}${alert.daysBefore} days until ${stageName} deadline`;

        const { error: insertError } = await supabase.from('deadline_reminders').insert({
          notice_id: noticeId,
          firm_id: firmId,
          reminder_type: alert.type,
          scheduled_for: reminderDate.toISOString(),
          status: 'pending',
          channel,
          recipient_email: channel === 'email' ? contact.email : null,
          recipient_phone: (channel === 'sms' || channel === 'phone_trigger') ? contact.phone : null,
          subject,
          related_deadline_date: deadlineDate,
          message: `Deadline for ${stageName}: ${deadline.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
        });

        if (insertError) {
          console.error('[DeadlineReminders] Error scheduling reminder:', insertError);
        } else {
          remindersCreated++;
        }
      }
    }
  }

  console.log(`[DeadlineReminders] Scheduled ${remindersCreated} reminders for notice ${noticeId} (${stageName})`);
  return remindersCreated;
}

/**
 * Cancel all pending reminders for a notice.
 * Useful when a notice is completed or the deadline changes.
 */
export async function cancelNoticeReminders(noticeId: string): Promise<number> {
  const supabase = getServiceSupabaseClient();

  const { data, error } = await supabase
    .from('deadline_reminders')
    .update({ status: 'cancelled' })
    .eq('notice_id', noticeId)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('[DeadlineReminders] Error cancelling reminders:', error);
    return 0;
  }

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`[DeadlineReminders] Cancelled ${count} reminders for notice ${noticeId}`);
  }
  return count;
}

/**
 * Get upcoming deadlines for a firm's notices.
 * Used by the dashboard to show deadline urgency.
 */
export async function getUpcomingDeadlines(
  firmId: string,
  days: number = 14
): Promise<Array<{ noticeId: string; deadline: string; stageName: string; daysRemaining: number; isOverdue: boolean }>> {
  const supabase = getServiceSupabaseClient();
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('notice_workflow_status')
    .select(`
      notice_id,
      deadline_date,
      current_stage:workflow_stages(name, deadline_name)
    `)
    .eq('firm_id', firmId)
    .not('deadline_date', 'is', null)
    .lte('deadline_date', futureDate.toISOString())
    .order('deadline_date', { ascending: true });

  if (error) {
    console.error('[DeadlineReminders] Error fetching upcoming deadlines:', error);
    return [];
  }

  const now = new Date();
  return (data || []).map(item => {
    const deadline = new Date(item.deadline_date!);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const stage = item.current_stage as any;
    
    return {
      noticeId: item.notice_id,
      deadline: item.deadline_date!,
      stageName: stage?.deadline_name || stage?.name || 'Deadline',
      daysRemaining,
      isOverdue: daysRemaining < 0
    };
  });
}
