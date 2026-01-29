import AdmZip from 'adm-zip';
import { format } from 'date-fns';
import { createHash } from 'crypto';
import { generatePublicationCertificate, CertificateData } from './certificateGenerator.js';
import { getServiceSupabaseClient } from '../lib/supabase.js';

/**
 * Evidence Pack Generator
 * Creates comprehensive evidence packages for legal defensibility
 *
 * Each evidence pack contains:
 * - Publication certificate (PDF)
 * - Original notice documents
 * - All representations with attachments
 * - Complete audit trail
 * - Metadata manifest with checksums
 */

export interface EvidencePackData {
  noticeId: string;
  includeRepresentations?: boolean;
  includeAuditTrail?: boolean;
  includeOriginalDocuments?: boolean;
}

interface NoticeData {
  id: string;
  notice_type: string;
  application_type: string;
  premises_name?: string;
  premises_address?: any;
  trading_name?: string;
  applicant_name?: string;
  applicant_email?: string;
  published_at?: string;
  created_at: string;
  preview_text?: string;
  document_url?: string;
  proof_pdf_url?: string;
  organization_id?: string;
  department_id?: string;
  created_by?: string;
  consultation_deadline?: string;
}

interface Representation {
  id: string;
  notice_id: string;
  stance: 'support' | 'object' | 'comment' | null;
  representation_text: string;
  respondent_name?: string;
  respondent_email?: string;
  is_anonymous: boolean;
  created_at: string;
  attachments?: string[];
  supporting_documents?: string[];
}

interface AuditLog {
  id: string;
  action: string;
  action_category: string;
  user_email?: string;
  resource_type: string;
  resource_id: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  created_at: string;
  severity: string;
}

/**
 * Generate a complete evidence pack for a notice
 */
export async function generateEvidencePack(options: EvidencePackData): Promise<Buffer> {
  const {
    noticeId,
    includeRepresentations = true,
    includeAuditTrail = true,
    includeOriginalDocuments = true
  } = options;

  // Get Supabase client
  const supabase = getServiceSupabaseClient();

  // Create ZIP archive
  const zip = new AdmZip();

  // 1. Fetch notice data
  const { data: notice, error: noticeError} = await supabase
    .from('notices')
    .select('*')
    .eq('id', noticeId)
    .single();

  if (noticeError || !notice) {
    throw new Error(`Notice not found: ${noticeId}`);
  }

  const noticeData = notice as NoticeData;

  // 2. Generate and add publication certificate
  const certificateData: CertificateData = {
    noticeId: noticeData.id,
    noticeType: noticeData.application_type || noticeData.notice_type || 'Public Notice',
    applicantName: noticeData.applicant_name,
    premisesName: noticeData.premises_name || noticeData.trading_name,
    premisesAddress: typeof noticeData.premises_address === 'string'
      ? noticeData.premises_address
      : noticeData.premises_address?.formatted || JSON.stringify(noticeData.premises_address),
    publishedDate: noticeData.published_at ? new Date(noticeData.published_at) : new Date(noticeData.created_at),
    publishedBy: 'CivicNotices Platform',
    publicationUrl: `https://civicnotices.co.uk/notices/${noticeData.id}`,
    noticeText: noticeData.preview_text || 'Notice text not available',
    representationsDeadline: noticeData.consultation_deadline ? new Date(noticeData.consultation_deadline) : undefined,
  };

  const certificatePdf = await generatePublicationCertificate(certificateData);
  zip.addFile('1-PUBLICATION_CERTIFICATE.pdf', certificatePdf);

  // 3. Add original documents if requested
  if (includeOriginalDocuments) {
    const documents: { url: string; filename: string }[] = [];

    if (noticeData.document_url) {
      documents.push({ url: noticeData.document_url, filename: '2-ORIGINAL_DOCUMENT.pdf' });
    }

    if (noticeData.proof_pdf_url) {
      documents.push({ url: noticeData.proof_pdf_url, filename: '3-PROOF_OF_PUBLICATION.pdf' });
    }

    // Download and add documents
    for (const doc of documents) {
      try {
        // Extract bucket path from Supabase URL
        const bucketPath = extractBucketPath(doc.url);
        if (bucketPath) {
          const { data, error } = await supabase.storage
            .from('notices')
            .download(bucketPath);

          if (!error && data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            zip.addFile(doc.filename, buffer);
          }
        }
      } catch (err) {
        console.error(`Failed to download document ${doc.url}:`, err);
      }
    }
  }

  // 4. Fetch and add representations if requested
  if (includeRepresentations) {
    const { data: representations, error: repsError } = await supabase
      .from('representations')
      .select('*')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: true });

    if (!repsError && representations && representations.length > 0) {
      const repsData = representations as Representation[];

      // Create representations summary document
      const repsSummary = generateRepresentationsSummary(repsData);
      zip.addFile('4-REPRESENTATIONS_SUMMARY.txt', Buffer.from(repsSummary, 'utf-8'));

      // Add individual representations as JSON for full detail
      zip.addFile('5-REPRESENTATIONS_FULL.json', Buffer.from(JSON.stringify(repsData, null, 2), 'utf-8'));

      // Download and add representation attachments
      for (let i = 0; i < repsData.length; i++) {
        const rep = repsData[i];
        const attachments = rep.supporting_documents || rep.attachments || [];

        for (let j = 0; j < attachments.length; j++) {
          const attachmentUrl = attachments[j];
          try {
            const bucketPath = extractBucketPath(attachmentUrl);
            if (bucketPath) {
              const { data, error } = await supabase.storage
                .from('representations')
                .download(bucketPath);

              if (!error && data) {
                const buffer = Buffer.from(await data.arrayBuffer());
                const ext = bucketPath.split('.').pop() || 'file';
                zip.addFile(`6-ATTACHMENTS/representation_${i + 1}_attachment_${j + 1}.${ext}`, buffer);
              }
            }
          } catch (err) {
            console.error(`Failed to download attachment ${attachmentUrl}:`, err);
          }
        }
      }
    }
  }

  // 5. Fetch and add audit trail if requested
  if (includeAuditTrail) {
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'notice')
      .eq('resource_id', noticeId)
      .order('created_at', { ascending: true });

    if (!auditError && auditLogs && auditLogs.length > 0) {
      const logs = auditLogs as AuditLog[];

      // Human-readable audit trail
      const auditSummary = generateAuditTrailSummary(logs);
      zip.addFile('7-AUDIT_TRAIL.txt', Buffer.from(auditSummary, 'utf-8'));

      // Full audit data in JSON
      zip.addFile('8-AUDIT_TRAIL_FULL.json', Buffer.from(JSON.stringify(logs, null, 2), 'utf-8'));
    }
  }

  // 6. Generate manifest with checksums
  const manifest = generateManifest(noticeData, zip);
  zip.addFile('0-MANIFEST.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

  // Generate ZIP buffer
  return zip.toBuffer();
}

/**
 * Extract Supabase storage bucket path from URL
 */
function extractBucketPath(url: string): string | null {
  try {
    // Handle both full URLs and path-only
    if (url.includes('/storage/v1/object/public/')) {
      const parts = url.split('/storage/v1/object/public/')[1];
      // Remove bucket name (first segment)
      return parts.split('/').slice(1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate human-readable representations summary
 */
function generateRepresentationsSummary(representations: Representation[]): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('REPRESENTATIONS SUMMARY');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Total Representations: ${representations.length}`);
  lines.push('');

  const support = representations.filter(r => r.stance === 'support').length;
  const object = representations.filter(r => r.stance === 'object').length;
  const comment = representations.filter(r => r.stance === 'comment').length;
  const unknown = representations.length - support - object - comment;

  lines.push('Breakdown by Stance:');
  lines.push(`  Support:    ${support}`);
  lines.push(`  Objections: ${object}`);
  lines.push(`  Comments:   ${comment}`);
  if (unknown > 0) {
    lines.push(`  Unknown:    ${unknown}`);
  }
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('');

  representations.forEach((rep, index) => {
    lines.push(`[${index + 1}] ${rep.stance?.toUpperCase() || 'UNKNOWN'}`);
    lines.push(`Date: ${format(new Date(rep.created_at), 'dd MMM yyyy HH:mm')}`);
    lines.push(`From: ${rep.is_anonymous ? 'Anonymous' : rep.respondent_name || 'Unknown'}`);
    if (!rep.is_anonymous && rep.respondent_email) {
      lines.push(`Email: ${rep.respondent_email}`);
    }
    lines.push('');
    lines.push('Representation Text:');
    lines.push('-'.repeat(80));
    lines.push(rep.representation_text);
    lines.push('-'.repeat(80));
    lines.push('');

    const attachments = rep.supporting_documents || rep.attachments || [];
    if (attachments.length > 0) {
      lines.push(`Attachments: ${attachments.length} file(s)`);
      lines.push('');
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate human-readable audit trail summary
 */
function generateAuditTrailSummary(logs: AuditLog[]): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('AUDIT TRAIL');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('Complete chronological record of all actions taken on this notice.');
  lines.push(`Total Events: ${logs.length}`);
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('');

  logs.forEach((log, index) => {
    const timestamp = format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss');
    const actor = log.user_email || 'System';
    const action = log.action;
    const severity = log.severity.toUpperCase();

    lines.push(`[${index + 1}] ${timestamp} | ${severity}`);
    lines.push(`Action: ${action}`);
    lines.push(`Actor: ${actor}`);
    lines.push(`Category: ${log.action_category}`);

    if (log.metadata) {
      lines.push(`Metadata: ${JSON.stringify(log.metadata)}`);
    }

    if (log.old_values && Object.keys(log.old_values).length > 0) {
      lines.push('Previous State: (see full JSON for details)');
    }

    if (log.new_values && Object.keys(log.new_values).length > 0) {
      lines.push('New State: (see full JSON for details)');
    }

    lines.push('-'.repeat(80));
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate manifest with file checksums and metadata
 */
function generateManifest(notice: NoticeData, zip: AdmZip): any {
  const files: any[] = [];

  // Get all files in ZIP
  const zipEntries = zip.getEntries();
  zipEntries.forEach(entry => {
    if (!entry.isDirectory) {
      const data = entry.getData();
      const hash = createHash('sha256').update(data).digest('hex');

      files.push({
        filename: entry.entryName,
        size: entry.header.size,
        sha256: hash,
      });
    }
  });

  return {
    evidence_pack_version: '1.0',
    generated_at: new Date().toISOString(),
    notice_id: notice.id,
    notice_type: notice.application_type || notice.notice_type,
    published_at: notice.published_at || notice.created_at,
    files,
    total_files: files.length,
    total_size_bytes: files.reduce((sum, f) => sum + f.size, 0),
    checksums_algorithm: 'SHA-256',
    integrity_statement: 'All files in this evidence pack have been cryptographically hashed for tamper detection. Verify checksums to ensure integrity.',
  };
}
