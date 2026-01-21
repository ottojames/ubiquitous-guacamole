import { getServiceSupabaseClient } from '../lib/supabase';
import { sendDeadlineReminder } from './email';

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
  subject: string | null;
  message: string | null;
  related_deadline_date: string | null;
  sent_error: string | null;
  notice?: {
    id: string;
    notice_type: string;
    premises?: string;
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

    if (!reminder.recipient_email) {
      console.warn(`[DeadlineReminders] Skipping reminder ${reminder.id}: no recipient email`);
      continue;
    }

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

      // Send the email using the existing sendDeadlineReminder function
      const result = await sendDeadlineReminder({
        noticeId: reminder.notice_id,
        noticeType: reminder.notice?.notice_type || 'Notice',
        premisesName: reminder.notice?.premises || undefined,
        premisesAddress: reminder.notice?.address || undefined,
        deadline: deadlineFormatted,
        hoursRemaining,
        noticeUrl: `${process.env.VITE_APP_URL || 'https://civicnotices.uk'}/notices/${reminder.notice_id}`,
        recipientEmail: reminder.recipient_email
      });

      if (result.success) {
        // Mark as sent
        await supabase
          .from('deadline_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

        stats.sent++;
        console.log(`[DeadlineReminders] Sent reminder ${reminder.id} to ${reminder.recipient_email}`);
      } else {
        throw new Error(result.error || 'Email sending failed');
      }

    } catch (err: any) {
      console.error(`[DeadlineReminders] Error sending reminder ${reminder.id}:`, err);

      // Mark as failed
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

  console.log(`[DeadlineReminders] Processed: ${stats.processed}, Sent: ${stats.sent}, Failed: ${stats.failed}`);
  return stats;
}

/**
 * Schedule deadline reminders for a notice stage transition.
 * Creates reminders at 7, 3, 1, and 0 days before the deadline.
 */
export async function scheduleDeadlineReminders(
  noticeId: string,
  firmId: string,
  deadlineDate: string,
  stageName: string
): Promise<number> {
  const supabase = getServiceSupabaseClient();
  let remindersCreated = 0;

  // Get firm admin/owner emails for notifications
  const { data: members, error: membersError } = await supabase
    .from('organization_memberships')
    .select(`
      user_id,
      profiles:user_id(email)
    `)
    .eq('organization_id', firmId)
    .in('role', ['owner', 'admin']);

  if (membersError) {
    console.error('[DeadlineReminders] Error fetching firm members:', membersError);
    return 0;
  }

  // Extract emails from members
  const emails = (members || [])
    .map(m => (m.profiles as any)?.email)
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    console.log('[DeadlineReminders] No admin emails found for firm:', firmId);
    return 0;
  }

  const deadline = new Date(deadlineDate);
  const now = new Date();

  // Schedule reminders: 7 days before, 3 days before, 1 day before, day of
  const reminderDays = [7, 3, 1, 0];

  for (const daysBefore of reminderDays) {
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    // Don't schedule reminders in the past
    if (reminderDate <= now) continue;

    for (const email of emails) {
      const { error: insertError } = await supabase.from('deadline_reminders').insert({
        notice_id: noticeId,
        firm_id: firmId,
        reminder_type: daysBefore === 0 ? 'deadline_today' : 'deadline_upcoming',
        scheduled_for: reminderDate.toISOString(),
        status: 'pending',
        channel: 'email',
        recipient_email: email,
        subject: `${daysBefore === 0 ? 'TODAY' : `${daysBefore} days`}: ${stageName} deadline`,
        related_deadline_date: deadlineDate
      });

      if (insertError) {
        console.error('[DeadlineReminders] Error scheduling reminder:', insertError);
      } else {
        remindersCreated++;
      }
    }
  }

  console.log(`[DeadlineReminders] Scheduled ${remindersCreated} reminders for notice ${noticeId}`);
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
