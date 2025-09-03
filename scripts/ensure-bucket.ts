import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucket = process.env.SUPABASE_BUCKET || 'notices';

async function main() {
  const supa = createClient(url, key);
  const { data: existing } = await supa.storage.listBuckets();
  if (!existing?.find((b: any) => b.name === bucket)) {
    await supa.storage.createBucket(bucket, { public: true });
    console.log(`created bucket ${bucket}`);
  } else {
    console.log(`bucket ${bucket} exists`);
  }
}

main().catch((err) => {
  console.error('ensure-bucket failed', err);
  process.exit(1);
});
