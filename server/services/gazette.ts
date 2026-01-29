/**
 * London Gazette Integration Service
 * 
 * Handles submission of Trustee Act 1925 s.27 notices to The London Gazette.
 * 
 * The Gazette is the official public record for deceased estate notices in England & Wales.
 * Publication in the Gazette is MANDATORY for s.27 protection.
 * 
 * API Documentation: https://www.thegazette.co.uk/data
 * 
 * Note: This is currently a placeholder implementation. Full integration requires:
 * 1. API key from The London Gazette
 * 2. Organization registration with TSO (The Stationery Office)
 * 3. Payment integration for notice fees (~£100 per notice)
 */

import { getServiceSupabaseClient } from '../lib/supabase.js';

export type GazetteNoticeType = 'deceased-estates' | 'partnerships' | 'companies';

export type GazetteSubmission = {
  noticeId: string;
  gazetteType: 'london' | 'edinburgh' | 'belfast';
  noticeContent: {
    deceasedName: string;
    deceasedAlias?: string;
    deceasedLastAddress: string;
    dateOfDeath: string;
    personalRepresentative?: string;
    solicitorName?: string;
    solicitorAddress: string;
    claimReference?: string;
    deadlineDate: string;
  };
};

export type GazetteResponse = {
  success: boolean;
  submissionReference?: string;
  gazetteNoticeId?: string;
  gazetteUrl?: string;
  estimatedPublicationDate?: string;
  feeAmount?: number;
  error?: string;
};

/**
 * Format notice content for Gazette submission
 */
function formatGazetteNotice(content: GazetteSubmission['noticeContent']): string {
  const alias = content.deceasedAlias ? ` (also known as ${content.deceasedAlias})` : '';
  const solicitor = content.solicitorName ? ` c/o ${content.solicitorName}` : '';
  const reference = content.claimReference ? ` quoting reference ${content.claimReference}` : '';
  
  return `TRUSTEE ACT 1925, SECTION 27
(As amended)

Re: ${content.deceasedName}${alias}
Late of: ${content.deceasedLastAddress}
Date of Death: ${content.dateOfDeath}

NOTICE is hereby given pursuant to section 27 of the Trustee Act 1925 that any person having a claim against or an interest in the estate of the above-named deceased should send particulars thereof in writing to the undersigned${solicitor} at ${content.solicitorAddress}${reference} on or before ${content.deadlineDate} after which date the personal representatives will distribute the estate having regard only to claims and interests of which they have had notice.

${content.personalRepresentative || content.solicitorName || 'Personal Representatives'}`;
}

/**
 * Submit notice to The London Gazette
 * 
 * In production, this would call the Gazette API.
 * Currently returns a placeholder response.
 */
export async function submitToGazette(
  submission: GazetteSubmission
): Promise<GazetteResponse> {
  const supabase = getServiceSupabaseClient();
  
  // Check if already submitted
  const { data: existing } = await supabase
    .from('probate_gazette_submissions')
    .select('id, status')
    .eq('notice_id', submission.noticeId)
    .eq('gazette_type', submission.gazetteType)
    .not('status', 'eq', 'cancelled')
    .single();
  
  if (existing && existing.status !== 'draft') {
    return {
      success: false,
      error: 'Notice has already been submitted to the Gazette'
    };
  }
  
  // Format the notice content
  const formattedNotice = formatGazetteNotice(submission.noticeContent);
  
  // In production: Call Gazette API here
  // const gazetteResponse = await fetch('https://www.thegazette.co.uk/api/v1/notice', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.GAZETTE_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     noticeType: 'deceased-estates',
  //     content: formattedNotice,
  //     edition: submission.gazetteType
  //   })
  // });
  
  // Placeholder response
  const mockReference = `GZ-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 3); // Typically 2-3 business days
  
  // Store submission record
  const { data: record, error } = await supabase
    .from('probate_gazette_submissions')
    .upsert({
      notice_id: submission.noticeId,
      gazette_type: submission.gazetteType,
      submission_reference: mockReference,
      status: 'submitted', // Would be 'pending_payment' until Gazette confirms
      submitted_at: new Date().toISOString(),
      notice_content: {
        formatted: formattedNotice,
        raw: submission.noticeContent
      },
      gazette_response: {
        mock: true,
        estimated_publication: estimatedDate.toISOString(),
        fee_gbp: 100.00 // Typical Gazette fee
      },
      fee_amount: 100.00,
      fee_currency: 'GBP'
    }, {
      onConflict: 'notice_id,gazette_type',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('[gazette] Error storing submission:', error);
    return {
      success: false,
      error: 'Failed to record Gazette submission'
    };
  }
  
  console.log('[gazette] Notice submitted:', {
    noticeId: submission.noticeId,
    reference: mockReference,
    gazetteType: submission.gazetteType
  });
  
  return {
    success: true,
    submissionReference: mockReference,
    estimatedPublicationDate: estimatedDate.toISOString().split('T')[0],
    feeAmount: 100.00
  };
}

/**
 * Check status of a Gazette submission
 */
export async function checkGazetteStatus(
  noticeId: string
): Promise<GazetteResponse> {
  const supabase = getServiceSupabaseClient();
  
  const { data, error } = await supabase
    .from('probate_gazette_submissions')
    .select('*')
    .eq('notice_id', noticeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return {
      success: false,
      error: 'No Gazette submission found for this notice'
    };
  }
  
  // In production: Poll Gazette API for status update
  // const gazetteStatus = await fetch(`https://www.thegazette.co.uk/api/v1/notice/${data.submission_reference}`);
  
  return {
    success: true,
    submissionReference: data.submission_reference,
    gazetteNoticeId: data.gazette_notice_id,
    gazetteUrl: data.gazette_url,
    feeAmount: data.fee_amount
  };
}

/**
 * Mark a Gazette notice as published
 * Called when we receive confirmation (webhook or manual)
 */
export async function markGazettePublished(
  noticeId: string,
  gazetteNoticeId: string,
  gazetteUrl: string
): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  
  const { error } = await supabase
    .from('probate_gazette_submissions')
    .update({
      status: 'published',
      gazette_notice_id: gazetteNoticeId,
      gazette_url: gazetteUrl,
      published_at: new Date().toISOString()
    })
    .eq('notice_id', noticeId)
    .eq('status', 'submitted');
  
  if (error) {
    console.error('[gazette] Error marking as published:', error);
    return false;
  }
  
  return true;
}

/**
 * Get Gazette fee estimate
 */
export function getGazetteFeeEstimate(wordCount: number): number {
  // London Gazette pricing (approximate as of 2024)
  // Base fee + per-line charge
  const baseFee = 75.00;
  const perLineFee = 5.00;
  const wordsPerLine = 8;
  
  const lines = Math.ceil(wordCount / wordsPerLine);
  return baseFee + (lines * perLineFee);
}
