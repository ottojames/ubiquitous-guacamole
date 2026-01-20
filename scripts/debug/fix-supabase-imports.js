#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that need to be fixed (from the Grep results)
const filesToFix = [
  'server/routes/representations.ts',
  'server/routes/notices.ts',
  'server/routes/publish.ts',
  'server/routes/firm.ts',
  'server/routes/councils.ts',
  'server/routes/drafts.ts',
  'server/routes/upload.ts',
  'server/services/councilMatcher.ts',
  'server/jobs/scrapers/BaseScraper.ts',
  'server/jobs/emailJobs.ts',
  'server/middleware/auth.ts'
];

function fixFile(filePath) {
  const fullPath = path.join('/Users/ottoclarke/projects/ubiquitous-guacamole', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if it already uses the centralized client
  if (content.includes('getServiceSupabaseClient')) {
    console.log(`Skipping ${filePath} - already using centralized client`);
    return;
  }

  // Pattern 1: Direct createClient call with env vars
  if (content.includes('createClient(') && content.includes('process.env.SUPABASE_URL')) {
    // Replace import
    content = content.replace(
      /import\s+{\s*createClient[^}]*}\s+from\s+['"]@supabase\/supabase-js['"];?/g,
      "import { getServiceSupabaseClient } from '../lib/supabase.js';"
    );

    // Remove the createClient instantiation
    content = content.replace(
      /const\s+supabase\s*=\s*createClient\([^;]+\);?/gs,
      ''
    );

    // Replace all supabase. references with getServiceSupabaseClient().
    content = content.replace(/\bsupabase\./g, 'getServiceSupabaseClient().');

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⚠️ Could not auto-fix ${filePath} - manual review needed`);
  }
}

console.log('Fixing Supabase imports in server files...\n');

filesToFix.forEach(fixFile);

console.log('\n✨ Done! Server should now start successfully.');