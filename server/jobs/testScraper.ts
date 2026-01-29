/**
 * Test Script for Westminster Licensing Scraper
 *
 * This demonstrates the complete pipeline:
 * 1. Scrape notices (POC with test data)
 * 2. Match councils via postcode/slug
 * 3. Create departments automatically
 * 4. Insert into database with OGL attribution
 * 5. Handle duplicates
 *
 * Run with: npx tsx server/jobs/testScraper.ts
 */

import 'dotenv/config';
import { WestminsterLicensingScraper } from './scrapers/WestminsterLicensingScraper';

async function main() {
  console.log('========================================');
  console.log('Westminster Licensing Scraper - TEST');
  console.log('========================================\n');

  try {
    // Create scraper instance
    const scraper = new WestminsterLicensingScraper();

    console.log('Step 1: Scraping notices...\n');
    const notices = await scraper.scrape();

    console.log(`\nStep 2: Found ${notices.length} notices\n`);
    console.log('Sample notice:');
    console.log(JSON.stringify(notices[0], null, 2));
    console.log('\n');

    console.log('Step 3: Importing into database...\n');
    console.log('This will:');
    console.log('- Match councils using MapIt API (postcode → council)');
    console.log('- Create "Licensing" department for Westminster');
    console.log('- Insert notices with OGL attribution');
    console.log('- Skip duplicates (notice #4)');
    console.log('- Test fuzzy matching (notice #5 uses "City of Westminster")\n');

    const results = await scraper.import(notices);

    console.log('\n========================================');
    console.log('IMPORT RESULTS');
    console.log('========================================');
    console.log(`✅ Successfully imported: ${results.success}`);
    console.log(`⏭️  Skipped (duplicates):  ${results.skipped}`);
    console.log(`❌ Failed:               ${results.failed}`);
    console.log('========================================\n');

    console.log('Check your database:');
    console.log('- Table: notices');
    console.log('- Filter: is_scraped = true');
    console.log('- Filter: organization_id = (Westminster)');
    console.log('\nExpected results:');
    console.log('- 4 new notices inserted (5th is duplicate)');
    console.log('- All linked to Westminster City Council');
    console.log('- All in "Licensing" department');
    console.log('- All have source.type = "council"');
    console.log('- All have source.licence = "OGL-3.0"\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

main();
