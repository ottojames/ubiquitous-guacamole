import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';

interface CouncilRow { name: string; email: string; aliases: string[] }

async function parseDocx(filePath: string): Promise<CouncilRow[]> {
  const buffer = await fs.readFile(filePath);
  const { value } = await mammoth.extractRawText({ buffer });
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email] = line.split(/\s+-\s+/);
      return { name, email, aliases: [] } as CouncilRow;
    });
}

async function main() {
  const file = path.resolve('data/councils.docx');
  const councils = await parseDocx(file);
  await fs.writeFile('councils.json', JSON.stringify(councils, null, 2));

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    return;
  }
  const client = createClient(url, key);
  for (const row of councils) {
    await client.from('councils').upsert({
      name: row.name,
      email: row.email,
      aliases: row.aliases,
    });
  }
  console.log(`Uploaded ${councils.length} councils`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
