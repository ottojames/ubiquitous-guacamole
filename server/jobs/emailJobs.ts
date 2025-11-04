import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendDeadlineReminder, sendDailySummary } from '../services/email';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return supabase;
}

/**
 * Send deadline reminders for notices expiring in 48h and 24h
 * Runs every hour
 */
export function startDeadlineReminderJob() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running deadline reminder job...');

    try {
      const db = getSupabase();
      const now = new Date();

      // Get notices with deadlines in the next 48 hours or 24 hours
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: notices, error } = await db
        .from('notices')
        .select('id, title, notice_type, premises, applicant, representation_deadline')
        .not('representation_deadline', 'is', null)
        .gte('representation_deadline', now.toISOString())
        .lte('representation_deadline', fortyEightHoursFromNow.toISOString())
        .eq('status', 'published') as { data: any[] | null; error: any };

      if (error) {
        console.error('[Cron] Error fetching notices for deadline reminders:', error);
        return;
      }

      if (!notices || notices.length === 0) {
        console.log('[Cron] No notices with upcoming deadlines found');
        return;
      }

      console.log(`[Cron] Found ${notices.length} notices with upcoming deadlines`);

      // For each notice, check if we should send 48h or 24h reminder
      for (const notice of notices) {
        const deadline = new Date(notice.representation_deadline!);
        const hoursUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

        // Determine which reminder to send (48h or 24h)
        // Send 48h reminder if between 47-49 hours remaining
        // Send 24h reminder if between 23-25 hours remaining
        let shouldSend48h = hoursUntilDeadline >= 47 && hoursUntilDeadline <= 49;
        let shouldSend24h = hoursUntilDeadline >= 23 && hoursUntilDeadline <= 25;

        if (!shouldSend48h && !shouldSend24h) {
          continue;
        }

        const hoursRemaining = shouldSend48h ? 48 : 24;

        // Get contact email from notice data
        // For firms publishing, get the firm user's email
        // For public notices, send to council contact or representation email
        const premises = notice.premises as any;
        const applicant = notice.applicant as any;

        const recipientEmail = applicant?.email || 'licensing@council.gov.uk';
        const premisesName = premises?.name || notice.title;
        const premisesAddress = premises?.address || 'Not specified';

        try {
          await sendDeadlineReminder({
            noticeId: notice.id,
            noticeType: notice.notice_type,
            premisesName,
            premisesAddress,
            deadline: new Date(notice.representation_deadline!).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            hoursRemaining,
            noticeUrl: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/notices/${notice.id}`,
            recipientEmail,
          });

          console.log(`[Cron] Sent ${hoursRemaining}h deadline reminder for notice ${notice.id}`);
        } catch (error) {
          console.error(`[Cron] Failed to send deadline reminder for notice ${notice.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[Cron] Error in deadline reminder job:', error);
    }
  });

  console.log('[Cron] Deadline reminder job scheduled (runs hourly)');
}

/**
 * Send daily council summaries at 9 AM every day
 * Lists new representations received in the last 24 hours
 */
export function startDailySummaryJob() {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily summary job...');

    try {
      const db = getSupabase();
      const now = new Date();
      const yesterdayOffset = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get all organizations that are councils with contact_email set
      const { data: councils, error: councilsError } = await db
        .from('organizations')
        .select('id, name, contact_email')
        .eq('type', 'council')
        .not('contact_email', 'is', null) as { data: any[] | null; error: any };

      if (councilsError) {
        console.error('[Cron] Error fetching councils:', councilsError);
        return;
      }

      if (!councils || councils.length === 0) {
        console.log('[Cron] No active councils found');
        return;
      }

      console.log(`[Cron] Processing daily summaries for ${councils.length} councils`);

      for (const council of councils) {
        try {
          // Get representations received in the last 24 hours for this council's notices
          const { data: representations, error: repsError } = await db
            .from('representations')
            .select(`
              id,
              notice_id,
              stance,
              created_at,
              notices!inner (
                id,
                title,
                notice_type,
                premises,
                organization_id
              )
            `)
            .eq('notices.organization_id', council.id)
            .gte('created_at', yesterdayOffset.toISOString()) as { data: any[] | null; error: any };

          if (repsError) {
            console.error(`[Cron] Error fetching representations for council ${council.id}:`, repsError);
            continue;
          }

          if (!representations || representations.length === 0) {
            console.log(`[Cron] No new representations for council ${council.name}`);
            continue;
          }

          // Group by notice
          const byNotice = representations.reduce((acc: any, rep: any) => {
            const noticeId = rep.notice_id;
            if (!acc[noticeId]) {
              const premises = rep.notices.premises as any;
              acc[noticeId] = {
                noticeId,
                noticeType: rep.notices.notice_type,
                premisesName: premises?.name || rep.notices.title,
                representations: [],
                supportCount: 0,
                objectCount: 0,
                commentCount: 0,
                unreadCount: 0,
              };
            }

            acc[noticeId].representations.push(rep);

            if (rep.stance === 'support') acc[noticeId].supportCount++;
            else if (rep.stance === 'object') acc[noticeId].objectCount++;
            else acc[noticeId].commentCount++;

            // Check if unread (simplified - you'd check representation_reads table)
            acc[noticeId].unreadCount++;

            return acc;
          }, {});

          const newRepresentations = Object.values(byNotice).map((notice: any) => ({
            noticeId: notice.noticeId,
            noticeType: notice.noticeType,
            premisesName: notice.premisesName,
            representationCount: notice.representations.length,
            supportCount: notice.supportCount,
            objectCount: notice.objectCount,
            commentCount: notice.commentCount,
            unreadCount: notice.unreadCount,
            noticeUrl: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/council/notice/${notice.noticeId}`,
          }));

          // Send summary email
          const result = await sendDailySummary(
            council.contact_email,
            {
              councilName: council.name,
              date: new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              newRepresentations,
              totalNew: representations.length,
            }
          );

          if (result.success) {
            console.log(`[Cron] Sent daily summary to ${council.name} (${representations.length} new representations)`);
          } else {
            console.error(`[Cron] Failed to send daily summary to ${council.name}:`, result.error);
          }

        } catch (error) {
          console.error(`[Cron] Error processing daily summary for council ${council.id}:`, error);
        }
      }

    } catch (error) {
      console.error('[Cron] Error in daily summary job:', error);
    }
  });

  console.log('[Cron] Daily summary job scheduled (runs at 9:00 AM daily)');
}

/**
 * Start all email-related cron jobs
 */
export function startAllEmailJobs() {
  startDeadlineReminderJob();
  startDailySummaryJob();
  console.log('[Cron] All email jobs started');
}
