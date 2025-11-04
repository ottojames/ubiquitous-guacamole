import { createClient } from '@supabase/supabase-js';
import { matchCouncil, getOrCreateDepartment, handleGVOLNotice } from '../../services/councilMatcher';

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

export interface ScrapedNotice {
  // Core fields
  title: string;
  notice_type: string;
  full_text: string;

  // Location data (at least ONE required for council matching)
  postcode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  // Council matching hints
  council_name?: string;
  council_slug?: string;

  // Dates
  publication_date?: Date;
  representation_deadline?: Date;
  consultation_start?: Date;
  consultation_end?: Date;

  // Applicant/Agent data
  applicant_name?: string;
  applicant_address?: string;
  applicant_email?: string;
  applicant_phone?: string;

  agent_name?: string;
  agent_email?: string;

  // Premises data (for licensing)
  premises?: {
    name?: string;
    address?: string;
    postcode?: string;
    latitude?: number;
    longitude?: number;
  };

  // Source attribution (required for OGL compliance)
  source: {
    type: 'council' | 'gazette' | 'newspaper' | 'traffic_commissioner' | 'find_a_tender';
    name: string; // e.g., "Manchester City Council"
    url: string; // Link back to original notice
    scraped_at: Date;
    licence: 'OGL-3.0' | 'public-domain' | 'gazette-api';
  };

  // External IDs for deduplication
  external_id?: string; // Council's application reference
  gazette_id?: string; // The Gazette notice ID

  // GVOL-specific fields
  is_gvol?: boolean;
  traffic_area?: string;
  operating_centre?: string;

  // Metadata
  attachments?: string[]; // URLs to documents
  consultation_documents?: string[];
}

export abstract class BaseScraper {
  protected abstract name: string;
  protected abstract source: ScrapedNotice['source']['type'];

  /**
   * Main scraping method - must be implemented by each scraper
   */
  abstract scrape(): Promise<ScrapedNotice[]>;

  /**
   * Import scraped notices into database
   */
  async import(notices: ScrapedNotice[]): Promise<{
    success: number;
    failed: number;
    skipped: number;
  }> {
    const db = getSupabase();
    let success = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`[${this.name}] Importing ${notices.length} notices...`);

    for (const notice of notices) {
      try {
        // Check for duplicates using external_id (stored in publication JSONB)
        if (notice.external_id) {
          const { data: existing } = await db
            .from('notices')
            .select('id, publication')
            .not('publication', 'is', null);

          // Check if any existing notice has this external_id
          const duplicate = existing?.find((n: any) =>
            n.publication?.external_id === notice.external_id
          );

          if (duplicate) {
            console.log(`[${this.name}] Skipping duplicate:`, notice.external_id);
            skipped++;
            continue;
          }
        }

        // Handle GVOL notices (not tied to councils)
        if (notice.is_gvol) {
          const result = await handleGVOLNotice(
            notice.operating_centre || notice.postcode || '',
            notice.traffic_area || 'Unknown'
          );

          await this.insertNotice(notice, null, null, null);
          success++;
          continue;
        }

        // Match to council
        const match = await matchCouncil({
          councilSlug: notice.council_slug,
          councilName: notice.council_name,
          postcode: notice.postcode || notice.premises?.postcode,
          latitude: notice.latitude || notice.premises?.latitude,
          longitude: notice.longitude || notice.premises?.longitude,
        });

        if (!match || !match.organization_id) {
          console.warn(`[${this.name}] Could not match council for notice:`, {
            title: notice.title,
            council_name: notice.council_name,
            postcode: notice.postcode,
          });
          failed++;
          continue;
        }

        // Get or create department
        const departmentId = await getOrCreateDepartment(
          match.organization_id,
          notice.notice_type
        );

        if (!departmentId) {
          console.warn(`[${this.name}] Could not create department for notice:`, notice.title);
          failed++;
          continue;
        }

        // Insert notice
        await this.insertNotice(notice, match.organization_id, match.council_id, departmentId);
        success++;

        console.log(`[${this.name}] ✓ Imported:`, notice.title);
      } catch (error) {
        console.error(`[${this.name}] Failed to import notice:`, error);
        failed++;
      }
    }

    console.log(`[${this.name}] Import complete:`, { success, failed, skipped });
    return { success, failed, skipped };
  }

  /**
   * Insert notice into database
   */
  private async insertNotice(
    notice: ScrapedNotice,
    organizationId: string | null,
    councilId: string | null,
    departmentId: string | null
  ): Promise<void> {
    const db = getSupabase();

    // Geocode if needed (using existing AI service)
    let location = notice.latitude && notice.longitude
      ? { lat: notice.latitude, lng: notice.longitude }
      : null;

    if (!location && (notice.address || notice.postcode)) {
      // TODO: Call geocoding service
      // For now, skip geocoding in scraper (will be backfilled later)
    }

    const noticeData = {
      // Core fields
      notice_type: notice.notice_type,
      description: notice.full_text,
      preview_text: notice.full_text.substring(0, 200),

      // Region is an enum - set to null for now (will be geocoded later)
      region: null,

      // Organization/Department/Council (null for GVOLs)
      organization_id: organizationId,
      council_id: councilId,
      department_id: departmentId,

      // Location
      location: location
        ? `POINT(${location.lng} ${location.lat})`
        : null,
      latitude: location?.lat,
      longitude: location?.lng,

      // Dates
      published_at: notice.publication_date || new Date(),
      representation_deadline: notice.representation_deadline,
      application_date: notice.publication_date || new Date(),
      reps_deadline: notice.representation_deadline,

      // Applicant data (JSONB)
      applicant: notice.applicant_name ? {
        name: notice.applicant_name,
        address: notice.applicant_address,
        email: notice.applicant_email,
        phone: notice.applicant_phone,
        agent: notice.agent_name ? {
          name: notice.agent_name,
          email: notice.agent_email,
        } : undefined,
      } : null,

      applicant_name: notice.applicant_name,
      applicant_email: notice.applicant_email,

      // Premises data (JSONB)
      premises: notice.premises ? {
        name: notice.premises.name,
        address: notice.premises.address,
        postcode: notice.premises.postcode,
        latitude: notice.premises.latitude,
        longitude: notice.premises.longitude,
      } : null,

      premises_address: notice.address || notice.premises?.address,
      trading_name: notice.premises?.name,

      // Consultation data (JSONB)
      consultation: {
        start_date: notice.consultation_start || notice.publication_date,
        end_date: notice.consultation_end || notice.representation_deadline,
        deadline: notice.representation_deadline,
      },

      // Publication data (JSONB) - source attribution
      publication: {
        source: notice.source,
        external_id: notice.external_id,
        gazette_id: notice.gazette_id,
        is_scraped: true,
      },

      // Extras (JSONB) - GVOL fields and other metadata
      extras: {
        traffic_area: notice.traffic_area,
        operating_centre: notice.operating_centre,
        attachments: notice.attachments,
        consultation_documents: notice.consultation_documents,
      },

      // Status must be 'published' or 'draft' (enum constraint)
      status: 'published',
      is_public: true,

      // Billing: Mark as waived (no charge for scraped notices)
      // Valid values: 'pending', 'paid', 'overdue', 'waived'
      // Waived = complimentary/free
      billing_status: 'waived',
      billing_amount: 0,

      // For scraped notices, set publisher to the council (for usage tracking)
      // This satisfies the usage_tracking trigger
      // But since billing_status='comp', trigger won't create billing transactions
      published_by_organization_id: organizationId,
    };

    const { error } = await db.from('notices').insert(noticeData);

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }
  }

  /**
   * Utility: Fetch HTML page with retry logic
   */
  protected async fetchPage(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'CivicNotices/1.0 (https://civicnotices.uk; contact@civicnotices.uk) - OGL Compliant Aggregator',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (error) {
        console.warn(`[${this.name}] Fetch failed (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) throw error;
        await this.sleep(2000 * (i + 1)); // Exponential backoff
      }
    }

    throw new Error('Fetch failed after retries');
  }

  /**
   * Utility: Sleep/delay
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Utility: Extract postcode from text
   */
  protected extractPostcode(text: string): string | undefined {
    const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;
    const match = text.match(postcodeRegex);
    return match ? match[1].trim().toUpperCase() : undefined;
  }

  /**
   * Utility: Parse date from various UK formats
   */
  protected parseDate(dateStr: string): Date | undefined {
    try {
      // Try standard ISO format first
      const iso = new Date(dateStr);
      if (!isNaN(iso.getTime())) return iso;

      // Try UK formats: "31 January 2025", "31/01/2025", "31-01-2025"
      const ukFormats = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/,
      ];

      for (const format of ukFormats) {
        const match = dateStr.match(format);
        if (match) {
          // Handle month names
          if (format === ukFormats[0]) {
            const months: Record<string, number> = {
              january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
              july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
            };
            const day = parseInt(match[1]);
            const month = months[match[2].toLowerCase()];
            const year = parseInt(match[3]);
            return new Date(year, month, day);
          }

          // Handle DD/MM/YYYY or DD-MM-YYYY
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-indexed
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        }
      }
    } catch (error) {
      console.warn(`[${this.name}] Failed to parse date:`, dateStr);
    }

    return undefined;
  }
}
