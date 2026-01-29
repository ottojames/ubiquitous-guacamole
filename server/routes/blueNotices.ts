import { Router } from 'express';
import { getServiceSupabaseClient } from '../lib/supabase';
import { generateBlueNoticePDF, type BlueNoticeData } from '../utils/blueNoticeGenerator';

const router = Router();

/**
 * GET /api/blue-notices/:noticeId
 * Generate a blue notice PDF for a premises licensing notice
 */
router.get('/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();

    // Fetch the notice details (without department join for now as it may be null)
    const { data: notice, error: noticeError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .single();

    if (noticeError || !notice) {
      console.error('Notice lookup error:', noticeError);
      return res.status(404).json({ error: 'Notice not found' });
    }

    // Check if this is a licensing notice (premises licence, etc.)
    const licensingTypes = [
      'premises-licence',
      'premises-licence-variation',
      'premises-licence-transfer',
      'premises-licence-review',
      'club-premises-certificate',
      'temporary-event-notice'
    ];

    if (!licensingTypes.includes(notice.notice_type)) {
      return res.status(400).json({
        error: 'Blue notices are only available for licensing applications'
      });
    }

    // Prepare data for PDF generation
    const baseUrl = process.env.VITE_PUBLIC_URL || 'https://civicnotices.co.uk';
    const publicationUrl = `${baseUrl}/notices/${noticeId}`;

    // Extract licensable activities from extras or notice_text
    const licensableActivities: string[] = [];
    if (notice.extras?.licensable_activities) {
      licensableActivities.push(...notice.extras.licensable_activities);
    } else {
      // Try to extract from notice text
      const activitiesMatch = notice.notice_text?.match(/licensable activities?:?\s*([\s\S]*?)(?:\n\n|$)/i);
      if (activitiesMatch) {
        const activities = activitiesMatch[1]
          .split(/[,\n]/)
          .map((a: string) => a.trim())
          .filter((a: string) => a.length > 0);
        licensableActivities.push(...activities);
      }
    }

    // Extract operating hours if available
    let operatingHours = notice.extras?.operating_hours;
    if (!operatingHours) {
      const hoursMatch = notice.notice_text?.match(/operating hours?:?\s*([\s\S]*?)(?:\n\n|$)/i);
      if (hoursMatch) {
        operatingHours = hoursMatch[1].trim();
      }
    }

    const pdfData: BlueNoticeData = {
      noticeId: notice.id,
      noticeType: notice.notice_type,
      applicantName: notice.applicant?.name || notice.extras?.applicant_name,
      premisesName: notice.premises?.name || notice.location_name || notice.extras?.premises_name,
      premisesAddress: notice.premises?.address || notice.location_name || notice.extras?.premises_address,
      publishedDate: new Date(notice.created_at),
      representationsDeadline: new Date(notice.reps_deadline || notice.deadline_date || notice.created_at),
      publicationUrl,
      councilName: notice.council?.name || 'Local Council',
      departmentName: 'Licensing Department',
      noticeText: notice.notice_text,
      licensableActivities,
      operatingHours
    };

    // Generate the PDF
    const pdfBuffer = await generateBlueNoticePDF(pdfData);

    // Set response headers
    const filename = `blue-notice-${notice.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating blue notice:', error);
    res.status(500).json({
      error: 'Failed to generate blue notice PDF'
    });
  }
});

/**
 * GET /api/blue-notices/:noticeId/preview
 * Get metadata for blue notice generation (without generating PDF)
 */
router.get('/:noticeId/preview', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const supabase = getServiceSupabaseClient();

    const { data: notice, error } = await supabase
      .from('notices')
      .select(`
        id,
        notice_type,
        notice_text,
        created_at,
        reps_deadline,
        department:departments (
          name,
          organization:organizations (
            name
          )
        )
      `)
      .eq('id', noticeId)
      .single();

    if (error || !notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const licensingTypes = [
      'premises-licence',
      'premises-licence-variation',
      'premises-licence-transfer',
      'premises-licence-review',
      'club-premises-certificate',
      'temporary-event-notice'
    ];

    const isEligible = licensingTypes.includes(notice.notice_type);

    res.json({
      eligible: isEligible,
      noticeType: notice.notice_type,
      councilName: notice.department?.organization?.name,
      departmentName: notice.department?.name,
      publishedDate: notice.created_at,
      deadline: notice.reps_deadline
    });
  } catch (error) {
    console.error('Error checking blue notice eligibility:', error);
    res.status(500).json({
      error: 'Failed to check eligibility'
    });
  }
});

export default router;