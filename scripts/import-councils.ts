/**
 * Bulk Council Import Script
 *
 * This script imports UK councils from an Excel template file into the database.
 *
 * Usage:
 *   npx tsx scripts/import-councils.ts path/to/councils.xlsx
 *
 * Excel Template Format:
 *   - Column A: Name (required)
 *   - Column B: Slug (required, lowercase, hyphenated)
 *   - Column C: Type (required: county, district, unitary, london-borough, metropolitan)
 *   - Column D: Region (required: england, scotland, wales, northern-ireland)
 *   - Column E: Website URL
 *   - Column F: Licensing Email
 *   - Column G: Planning Email
 *   - Column H: General Enquiries Email
 *   - Column I: Phone Number
 *   - Column J: Address Line 1
 *   - Column K: Address Line 2
 *   - Column L: City
 *   - Column M: Postcode
 *   - Column N: Licensing Team Name
 *   - Column O: Planning Team Name
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase configuration.');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CouncilRow {
  name: string;
  slug: string;
  type: string;
  region: string;
  website_url?: string;
  licensing_email?: string;
  planning_email?: string;
  enquiries_email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postcode?: string;
  licensing_team_name?: string;
  planning_team_name?: string;
}

const VALID_COUNCIL_TYPES = ['county', 'district', 'unitary', 'london-borough', 'metropolitan'];
const VALID_REGIONS = ['england', 'scotland', 'wales', 'northern-ireland'];

function validateRow(row: any, rowNum: number): { valid: boolean; errors: string[]; data?: CouncilRow } {
  const errors: string[] = [];

  // Required fields
  if (!row.name || typeof row.name !== 'string' || !row.name.trim()) {
    errors.push(`Row ${rowNum}: Missing or invalid 'name'`);
  }

  if (!row.slug || typeof row.slug !== 'string' || !row.slug.trim()) {
    errors.push(`Row ${rowNum}: Missing or invalid 'slug'`);
  } else if (!/^[a-z0-9-]+$/.test(row.slug)) {
    errors.push(`Row ${rowNum}: Slug must be lowercase letters, numbers, and hyphens only`);
  }

  if (!row.type || !VALID_COUNCIL_TYPES.includes(row.type)) {
    errors.push(`Row ${rowNum}: Invalid 'type'. Must be one of: ${VALID_COUNCIL_TYPES.join(', ')}`);
  }

  if (!row.region || !VALID_REGIONS.includes(row.region)) {
    errors.push(`Row ${rowNum}: Invalid 'region'. Must be one of: ${VALID_REGIONS.join(', ')}`);
  }

  // Email validation (optional fields)
  const emailFields = ['licensing_email', 'planning_email', 'enquiries_email'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const field of emailFields) {
    if (row[field] && !emailRegex.test(row[field])) {
      errors.push(`Row ${rowNum}: Invalid email format for '${field}'`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build council data object
  const councilData: CouncilRow = {
    name: row.name.trim(),
    slug: row.slug.trim().toLowerCase(),
    type: row.type.trim().toLowerCase(),
    region: row.region.trim().toLowerCase(),
    website_url: row.website_url?.trim() || undefined,
    licensing_email: row.licensing_email?.trim() || undefined,
    planning_email: row.planning_email?.trim() || undefined,
    enquiries_email: row.enquiries_email?.trim() || undefined,
    phone: row.phone?.trim() || undefined,
    address_line1: row.address_line1?.trim() || undefined,
    address_line2: row.address_line2?.trim() || undefined,
    city: row.city?.trim() || undefined,
    postcode: row.postcode?.trim() || undefined,
    licensing_team_name: row.licensing_team_name?.trim() || undefined,
    planning_team_name: row.planning_team_name?.trim() || undefined,
  };

  return { valid: true, errors: [], data: councilData };
}

async function importCouncils(filePath: string) {
  console.log('🏛️  Bulk Council Import Script');
  console.log('================================\n');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  if (!['.xlsx', '.xls'].includes(ext)) {
    console.error(`❌ Error: File must be an Excel file (.xlsx or .xls)`);
    process.exit(1);
  }

  console.log(`📁 Reading file: ${filePath}\n`);

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (rawData.length < 2) {
    console.error('❌ Error: Excel file appears to be empty or has no data rows');
    process.exit(1);
  }

  // Parse headers (first row)
  const headers = rawData[0].map((h: any) => String(h).toLowerCase().replace(/\s+/g, '_'));

  // Map rows to objects
  const rows = rawData.slice(1).map((row, index) => {
    const obj: any = {};
    headers.forEach((header: string, i: number) => {
      if (row[i] !== undefined && row[i] !== null && row[i] !== '') {
        obj[header] = row[i];
      }
    });
    obj._rowNum = index + 2; // +2 because: 1 for header, 1 for 0-index
    return obj;
  }).filter(row => Object.keys(row).length > 1); // Filter out empty rows

  console.log(`📊 Found ${rows.length} councils to process\n`);

  // Validate all rows
  const validationResults = rows.map(row => validateRow(row, row._rowNum));
  const validRows = validationResults.filter(r => r.valid);
  const invalidRows = validationResults.filter(r => !r.valid);

  if (invalidRows.length > 0) {
    console.log(`⚠️  Validation Errors (${invalidRows.length} rows):\n`);
    invalidRows.forEach(result => {
      result.errors.forEach(error => console.log(`   ${error}`));
    });
    console.log('');
  }

  if (validRows.length === 0) {
    console.error('❌ No valid rows to import. Please fix validation errors and try again.');
    process.exit(1);
  }

  console.log(`✅ ${validRows.length} councils validated successfully\n`);
  console.log('Starting database import...\n');

  // Import to database
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (const result of validRows) {
    const council = result.data!;

    try {
      // Check if council already exists
      const { data: existing } = await supabase
        .from('councils')
        .select('id')
        .eq('slug', council.slug)
        .single();

      if (existing) {
        // Update existing council
        const { error } = await supabase
          .from('councils')
          .update({
            name: council.name,
            type: council.type,
            region: council.region,
            website_url: council.website_url,
            contact_details: {
              licensing_email: council.licensing_email,
              planning_email: council.planning_email,
              enquiries_email: council.enquiries_email,
              phone: council.phone,
              address: {
                line1: council.address_line1,
                line2: council.address_line2,
                city: council.city,
                postcode: council.postcode,
              },
            },
            licensing_team_name: council.licensing_team_name,
            planning_team_name: council.planning_team_name,
          })
          .eq('slug', council.slug);

        if (error) throw error;
        console.log(`✓ Updated: ${council.name} (${council.slug})`);
      } else {
        // Insert new council
        const { error } = await supabase
          .from('councils')
          .insert({
            name: council.name,
            slug: council.slug,
            type: council.type,
            region: council.region,
            website_url: council.website_url,
            contact_details: {
              licensing_email: council.licensing_email,
              planning_email: council.planning_email,
              enquiries_email: council.enquiries_email,
              phone: council.phone,
              address: {
                line1: council.address_line1,
                line2: council.address_line2,
                city: council.city,
                postcode: council.postcode,
              },
            },
            licensing_team_name: council.licensing_team_name,
            planning_team_name: council.planning_team_name,
          });

        if (error) throw error;
        console.log(`✓ Inserted: ${council.name} (${council.slug})`);
      }

      successCount++;
    } catch (error: any) {
      failureCount++;
      const errorMsg = `✗ Failed: ${council.name} - ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Summary
  console.log('\n================================');
  console.log('Import Complete!\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⚠️  Validation Errors: ${invalidRows.length}`);
  console.log(`📊 Total Processed: ${rows.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  }
}

// Generate template Excel file
function generateTemplate() {
  console.log('📝 Generating Excel template...\n');

  const template = [
    ['Name', 'Slug', 'Type', 'Region', 'Website URL', 'Licensing Email', 'Planning Email', 'Enquiries Email', 'Phone', 'Address Line 1', 'Address Line 2', 'City', 'Postcode', 'Licensing Team Name', 'Planning Team Name'],
    ['Westminster City Council', 'westminster', 'london-borough', 'england', 'https://www.westminster.gov.uk', 'licensing@westminster.gov.uk', 'planning@westminster.gov.uk', 'enquiries@westminster.gov.uk', '020 7641 6000', 'Westminster City Hall', '64 Victoria Street', 'London', 'SW1E 6QP', 'Licensing Team', 'Planning Team'],
    ['Manchester City Council', 'manchester', 'metropolitan', 'england', 'https://www.manchester.gov.uk', 'licensing@manchester.gov.uk', 'planning@manchester.gov.uk', 'contact@manchester.gov.uk', '0161 234 5000', 'Manchester Town Hall', 'Albert Square', 'Manchester', 'M60 2LA', 'Licensing Service', 'Planning Service'],
    ['Leeds City Council', 'leeds', 'metropolitan', 'england', 'https://www.leeds.gov.uk', 'licensing@leeds.gov.uk', 'planning@leeds.gov.uk', 'info@leeds.gov.uk', '0113 222 4444', 'Leeds Civic Hall', 'Calverley Street', 'Leeds', 'LS1 1UR', 'Licensing Authority', 'Planning Department'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Councils');

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Name
    { wch: 20 }, // Slug
    { wch: 18 }, // Type
    { wch: 15 }, // Region
    { wch: 35 }, // Website URL
    { wch: 30 }, // Licensing Email
    { wch: 30 }, // Planning Email
    { wch: 30 }, // Enquiries Email
    { wch: 15 }, // Phone
    { wch: 25 }, // Address Line 1
    { wch: 25 }, // Address Line 2
    { wch: 15 }, // City
    { wch: 10 }, // Postcode
    { wch: 25 }, // Licensing Team Name
    { wch: 25 }, // Planning Team Name
  ];

  const templatePath = 'councils-import-template.xlsx';
  XLSX.writeFile(wb, templatePath);

  console.log(`✅ Template created: ${templatePath}\n`);
  console.log('📋 Fill in the template with council data and run:');
  console.log(`   npx tsx scripts/import-councils.ts ${templatePath}\n`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Bulk Council Import Script\n');
  console.log('Usage:');
  console.log('  npx tsx scripts/import-councils.ts <excel-file>    Import councils from Excel');
  console.log('  npx tsx scripts/import-councils.ts --template      Generate template file\n');
  console.log('Example:');
  console.log('  npx tsx scripts/import-councils.ts councils.xlsx\n');
  process.exit(0);
}

if (args[0] === '--template') {
  generateTemplate();
} else {
  importCouncils(args[0]);
}
