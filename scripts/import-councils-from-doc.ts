/**
 * Import Councils from Word Document
 *
 * Parses the Council Emails copy.doc file and generates SQL migration
 * to populate organizations and departments tables.
 */

import fs from 'fs';
import { execSync } from 'child_process';

const DOC_PATH = '/Users/ottoclarke/Icognia Dropbox/Camilla Clarke/StatAd/Councils/Council Emails copy.doc';
const OUTPUT_SQL = 'supabase/migrations/20251117000003_import_all_councils.sql';

type Council = {
  name: string;
  email: string;
  originalLine: string;
};

function cleanEmail(rawEmail: string): string {
  // Remove HYPERLINK markup and extract email
  let email = rawEmail;

  // Remove HYPERLINK "mailto:..." wrappers
  email = email.replace(/HYPERLINK\s+"mailto:([^"]+)"/g, '$1');
  email = email.replace(/HYPERLINK\s+"([^"]+)"/g, '$1');

  // Remove any remaining markup
  email = email.replace(/\\o\s+"[^"]*"/g, '');
  email = email.trim();

  // Extract just the email address if there are multiple on the line
  const emailMatch = email.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.gov\.uk)/);
  if (emailMatch) {
    return emailMatch[1];
  }

  return email;
}

function cleanCouncilName(name: string): string {
  let cleaned = name.trim();

  // Skip if looks like a phone number or invalid
  if (cleaned.match(/^[0-9\s-]+$/)) {
    return '';
  }

  // Remove trailing junk
  cleaned = cleaned.replace(/\s*-\s*$/, '');
  cleaned = cleaned.replace(/\s+$/, '');

  // Expand common abbreviations BEFORE adding Council suffix
  cleaned = cleaned.replace(/\bBC\b/gi, 'Borough Council');
  cleaned = cleaned.replace(/\bDC\b/gi, 'District Council');
  cleaned = cleaned.replace(/\bCC\b/gi, 'City Council');

  // Fix duplicate "Council" or "Borough Council" etc.
  cleaned = cleaned.replace(/(Borough Council|District Council|City Council|County Council)\s+Council$/i, '$1');
  cleaned = cleaned.replace(/Council\s+Council$/i, 'Council');

  // Add "Council" suffix if not present
  if (!cleaned.toLowerCase().includes('council') &&
      !cleaned.toLowerCase().includes('borough') &&
      !cleaned.toLowerCase().includes('authority')) {
    // Check if it's a known exception (cities, counties, regions)
    if (!cleaned.match(/(Aberdeen|Edinburgh|Glasgow|Cardiff|Belfast|London|Manchester|Birmingham)/i)) {
      cleaned += ' Council';
    } else {
      // Major cities get "City Council"
      if (cleaned.match(/(Aberdeen|Edinburgh|Glasgow|Birmingham|Bristol|Leeds|Sheffield|Newcastle|Liverpool)/i)) {
        cleaned += ' City Council';
      } else {
        cleaned += ' Council';
      }
    }
  }

  // Final cleanup
  cleaned = cleaned.trim();

  return cleaned;
}

function parseCouncilsFromText(text: string): Council[] {
  const councils: Council[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headers, table of contents
    if (!line || line.length < 5) continue;
    if (line.match(/^[A-Z]\s*$/)) continue; // Single letter headings
    if (line.includes('HYPERLINK') && line.includes('_Toc')) continue;
    if (line.includes('TOC \\o')) continue;

    // Match lines with email addresses
    const emailPattern = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (emailPattern.test(line)) {
      // Split by tabs or multiple spaces to separate name from email
      const parts = line.split(/\t+|\s{2,}/);

      if (parts.length >= 2) {
        const rawName = parts[0];
        const rawEmail = parts.slice(1).join(' ');

        // Skip if name looks like junk
        if (rawName.match(/^[0-9]+$/) || rawName.length < 3) continue;
        if (rawName.includes('HYPERLINK') && !rawName.match(/^[A-Z]/)) continue;

        const name = cleanCouncilName(rawName);
        const email = cleanEmail(rawEmail);

        // Skip if cleaning resulted in empty name or phone number
        if (!name || name.length < 3) continue;
        if (name.match(/^[0-9\s-]+/)) continue;

        // Validate email format
        if (email && email.includes('@') && email.includes('.')) {
          councils.push({
            name,
            email,
            originalLine: line
          });
        }
      }
    }
  }

  return councils;
}

function deduplicateCouncils(councils: Council[]): Council[] {
  const seen = new Map<string, Council>();

  for (const council of councils) {
    const key = council.name.toLowerCase();

    if (!seen.has(key)) {
      seen.set(key, council);
    } else {
      // If duplicate, prefer the one with better email
      const existing = seen.get(key)!;
      if (council.email.includes('licensing') && !existing.email.includes('licensing')) {
        seen.set(key, council);
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function generateSQL(councils: Council[]): string {
  const timestamp = new Date().toISOString();

  let sql = `-- ============================================================================
-- IMPORT ALL UK COUNCILS FROM WORD DOCUMENT
-- ============================================================================
-- Generated: ${timestamp}
-- Source: Council Emails copy.doc
-- Total councils: ${councils.length}
--
-- This migration populates organizations and departments tables with all
-- UK councils and their licensing department contact information.
-- ============================================================================

-- Insert organizations (councils)
INSERT INTO public.organizations (name, created_at, updated_at)
VALUES
`;

  const orgValues = councils.map((c, i) => {
    const escapedName = c.name.replace(/'/g, "''");
    return `  ('${escapedName}', NOW(), NOW())${i < councils.length - 1 ? ',' : ''}`;
  });

  sql += orgValues.join('\n');
  sql += `
ON CONFLICT (name) DO NOTHING;

-- Insert licensing departments for each council
INSERT INTO public.departments (organization_id, name, slug, type, email, created_at, updated_at)
SELECT
  o.id,
  'Licensing',
  'licensing',
  'licensing',
  d.email,
  NOW(),
  NOW()
FROM public.organizations o
CROSS JOIN (VALUES
`;

  const deptValues = councils.map((c, i) => {
    const escapedName = c.name.replace(/'/g, "''");
    const escapedEmail = c.email.replace(/'/g, "''");
    return `  ('${escapedName}', '${escapedEmail}')${i < councils.length - 1 ? ',' : ''}`;
  });

  sql += deptValues.join('\n');
  sql += `
) AS d(org_name, email)
WHERE o.name = d.org_name
ON CONFLICT (organization_id, slug) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the import:
--
-- SELECT
--   o.name AS council_name,
--   d.name AS department_name,
--   d.email,
--   d.type
-- FROM departments d
-- JOIN organizations o ON d.organization_id = o.id
-- WHERE d.type = 'licensing'
-- ORDER BY o.name;
--
-- Expected result: ${councils.length} rows
-- ============================================================================

-- Create index for faster council lookups
CREATE INDEX IF NOT EXISTS idx_departments_org_type
  ON public.departments(organization_id, type);

CREATE INDEX IF NOT EXISTS idx_organizations_name
  ON public.organizations(name);

-- Full-text search on organization names
CREATE INDEX IF NOT EXISTS idx_organizations_name_search
  ON public.organizations
  USING GIN(to_tsvector('english', name));

COMMENT ON INDEX idx_organizations_name_search IS
  'Full-text search index for council name autocomplete';
`;

  return sql;
}

function main() {
  console.log('🔍 Converting Word document to text...');

  try {
    // Convert Word doc to text
    const rawText = execSync(`textutil -convert txt -stdout "${DOC_PATH}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    console.log('📄 Parsing councils from document...');
    const allCouncils = parseCouncilsFromText(rawText);
    console.log(`   Found ${allCouncils.length} council entries`);

    console.log('🔄 Deduplicating councils...');
    const councils = deduplicateCouncils(allCouncils);
    console.log(`   Kept ${councils.length} unique councils`);

    console.log('\n📊 Sample councils:');
    councils.slice(0, 10).forEach(c => {
      console.log(`   • ${c.name} - ${c.email}`);
    });
    console.log(`   ... and ${councils.length - 10} more`);

    console.log('\n🏗️  Generating SQL migration...');
    const sql = generateSQL(councils);

    // Write SQL file
    fs.writeFileSync(OUTPUT_SQL, sql, 'utf-8');
    console.log(`✅ SQL migration written to: ${OUTPUT_SQL}`);

    // Write JSON for reference
    const jsonPath = 'data/councils-imported.json';
    fs.writeFileSync(jsonPath, JSON.stringify(councils, null, 2), 'utf-8');
    console.log(`📋 JSON reference written to: ${jsonPath}`);

    console.log('\n✨ Import complete!');
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review the SQL file: ${OUTPUT_SQL}`);
    console.log(`   2. Run via Supabase Dashboard SQL Editor`);
    console.log(`   3. Verify: SELECT COUNT(*) FROM organizations;`);
    console.log(`   4. Verify: SELECT COUNT(*) FROM departments WHERE type = 'licensing';`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
