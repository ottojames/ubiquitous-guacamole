#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'server/routes/representations.ts',
  'server/routes/notices.ts',
  'server/routes/councils.ts',
  'server/routes/drafts.ts',
  'server/services/councilMatcher.ts',
  'server/jobs/scrapers/BaseScraper.ts',
  'server/jobs/emailJobs.ts',
  'server/middleware/auth.ts'
];

for (const file of filesToFix) {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix the import path
  if (content.includes('getServiceSupabaseClient().js')) {
    content = content.replace(/from ['"].*getServiceSupabaseClient\(\)\.js['"]/g, `from '../lib/supabase.js'`);
    modified = true;
  }

  // Also handle cases where path depth might be different
  if (content.includes('../../lib/getServiceSupabaseClient().js')) {
    content = content.replace(/from ['"].*getServiceSupabaseClient\(\)\.js['"]/g, `from '../../lib/supabase.js'`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${file}`);
  }
}

console.log('\nDone!');