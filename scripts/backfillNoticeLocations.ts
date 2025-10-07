import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { getServiceSupabaseClient } from '../server/lib/supabase';
import { detectPostcode, geocodePostcode, normalisePostcode } from '../server/lib/geocode';

type NoticeRow = {
  id: string;
  premises: Record<string, unknown> | null;
  latitude: number | null;
  longitude: number | null;
};

const PAGE_SIZE = Number(process.env.BACKFILL_BATCH_SIZE || 100);
const DRY_RUN = process.argv.includes('--dry-run');

function extractPostcode(premises: Record<string, unknown> | null): string | null {
  if (!premises) return null;

  const direct = typeof premises.postcode === 'string' ? normalisePostcode(premises.postcode) : null;
  if (direct) return direct;

  const address = typeof premises.address === 'string' ? detectPostcode(premises.address) : null;
  if (address) return address;

  const line1 = typeof premises.name === 'string' ? detectPostcode(premises.name) : null;
  if (line1) return line1;

  return null;
}

async function main() {
  const client = getServiceSupabaseClient();

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  while (true) {
    const { data, error } = await client
      .from('notices')
      .select('id, premises, latitude, longitude')
      .or('latitude.is.null,longitude.is.null,location.is.null')
      .order('created_at', { ascending: true })
      .limit(PAGE_SIZE);

    if (error) {
      throw error;
    }

    const rows = (data as NoticeRow[]) || [];
    if (rows.length === 0) break;

    for (const notice of rows) {
      processed += 1;

      const postcode = extractPostcode(notice.premises || null);
      if (!postcode) {
        skipped += 1;
        console.warn(`[backfill] Skipping notice ${notice.id}: no postcode in premises`);
        continue;
      }

      try {
        const result = await geocodePostcode(postcode);
        if (!result) {
          skipped += 1;
          console.warn(`[backfill] No geocode result for ${postcode} (notice ${notice.id})`);
          continue;
        }

        if (DRY_RUN) {
          console.log(`[dry-run] ${notice.id} => (${result.latitude}, ${result.longitude}) [${result.source}]`);
        } else {
          const { error: updateError } = await client
            .from('notices')
            .update({
              latitude: result.latitude,
              longitude: result.longitude,
            })
            .eq('id', notice.id);

          if (updateError) {
            throw updateError;
          }
        }

        updated += 1;
      } catch (err) {
        errors += 1;
        console.error(`[backfill] Failed to geocode notice ${notice.id}:`, err);
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  console.log('[backfill] Finished');
  console.log('[backfill] processed:', processed);
  console.log('[backfill] updated:', updated);
  console.log('[backfill] skipped:', skipped);
  console.log('[backfill] errors:', errors);

  if (errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[backfill] Fatal error', error);
  process.exit(1);
});
