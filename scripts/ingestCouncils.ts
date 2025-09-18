import path from 'path';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

type CouncilRow = { name?: string; email?: string; [k: string]: unknown };

function parseXlsx(filePath: string): CouncilRow[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as CouncilRow[];

  return rows
    .map((r: CouncilRow) => {
      const normalized = Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k.toLowerCase(), String(v).trim()])
      );
      const name =
        normalized['council name'] ||
        normalized['name'] ||
        normalized['council'];
      const email =
        normalized['email'] ||
        normalized['email address'] ||
        normalized['council email'];
      return { name, email } as CouncilRow;
    })
    .filter((r: CouncilRow) => r.name && r.email);
}

async function main() {
  const file = path.resolve('Accurate_Council_Emails_From_PDF.xlsx');
  const councils = parseXlsx(file);

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const client = createClient(url, key);
  await client.from('councils').upsert(councils, { onConflict: 'name' });

  console.log(`Upserted ${councils.length} councils`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
