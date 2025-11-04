import { BaseScraper, ScrapedNotice } from './BaseScraper';

/**
 * Westminster City Council Licensing Scraper
 *
 * Scrapes premises licence applications from Westminster's IDOX system
 * Source: https://idoxpa.westminster.gov.uk/online-applications/
 * Licence: Open Government Licence v3.0
 *
 * This is a PROOF OF CONCEPT implementation that demonstrates:
 * 1. Council matching by slug and postcode
 * 2. Automatic department assignment
 * 3. Deduplication via external_id
 * 4. OGL attribution
 *
 * TODO: Implement actual HTML parsing once we confirm structure
 */
export class WestminsterLicensingScraper extends BaseScraper {
  protected name = 'Westminster Licensing';
  protected source = 'council' as const;

  async scrape(): Promise<ScrapedNotice[]> {
    console.log('[Westminster] Starting scrape...');

    // For POC: Generate test data that mimics real Westminster applications
    // In production, this would:
    // 1. Fetch https://idoxpa.westminster.gov.uk/online-applications/search.do?action=simple&searchType=LicencingApplication
    // 2. Submit search form for recent applications
    // 3. Parse result table
    // 4. Follow links to individual application pages
    // 5. Extract full details from each page

    const testNotices: ScrapedNotice[] = [
      // Test case 1: Standard premises licence with full data
      {
        title: 'Premises Licence Application - The Churchill Arms',
        notice_type: 'premises-licence',
        full_text: `Application for a new premises licence under the Licensing Act 2003.

Premises: The Churchill Arms, 119 Kensington Church Street, London, W8 7LN

Applicant: Fuller Smith & Turner PLC, Griffin Brewery, Chiswick Lane South, London W4 2QB

Proposed licensable activities:
- Sale of alcohol (on and off premises)
- Live music (indoors)
- Recorded music (indoors)

Proposed hours:
Monday to Saturday: 10:00 - 23:00
Sunday: 12:00 - 22:30

Any person wishing to make representations must do so in writing to Westminster City Council Licensing Team by the consultation deadline.`,

        // Location data (triggers postcode lookup)
        postcode: 'W8 7LN',
        address: '119 Kensington Church Street, London',
        latitude: 51.5066,
        longitude: -0.1948,

        // Council matching (explicit)
        council_slug: 'westminster-city-council',
        council_name: 'Westminster City Council',

        // Dates
        publication_date: new Date('2025-01-15'),
        representation_deadline: new Date('2025-02-12'), // 28 days later
        consultation_start: new Date('2025-01-15'),
        consultation_end: new Date('2025-02-12'),

        // Applicant data
        applicant_name: 'Fuller Smith & Turner PLC',
        applicant_address: 'Griffin Brewery, Chiswick Lane South, London W4 2QB',
        applicant_email: 'licensing@fullers.co.uk',

        // Premises data
        premises: {
          name: 'The Churchill Arms',
          address: '119 Kensington Church Street',
          postcode: 'W8 7LN',
        },

        // Source attribution (OGL compliance)
        source: {
          type: 'council',
          name: 'Westminster City Council',
          url: 'https://idoxpa.westminster.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TEST001',
          scraped_at: new Date(),
          licence: 'OGL-3.0',
        },

        // External ID (for deduplication)
        external_id: 'WCC-LIC-2025-001',
      },

      // Test case 2: Variation with agent
      {
        title: 'Premises Licence Variation - Soho House',
        notice_type: 'premises-licence-variation',
        full_text: `Application to vary a premises licence under the Licensing Act 2003.

Premises: Soho House, 76 Dean Street, London, W1D 3SQ

Applicant: Soho House UK Ltd
Agent: Poppleston Allen Solicitors

Proposed variations:
- Extension of terminal hour for sale of alcohol to 02:00 Friday-Saturday
- Addition of late night refreshment
- Variation of conditions relating to noise management

Current representations period: 28 days from publication.`,

        postcode: 'W1D 3SQ',
        address: '76 Dean Street, London',
        latitude: 51.5142,
        longitude: -0.1318,

        council_slug: 'westminster-city-council',

        publication_date: new Date('2025-01-20'),
        representation_deadline: new Date('2025-02-17'),

        applicant_name: 'Soho House UK Ltd',
        agent_name: 'Poppleston Allen Solicitors',
        agent_email: 'licensing@popall.co.uk',

        premises: {
          name: 'Soho House',
          address: '76 Dean Street',
          postcode: 'W1D 3SQ',
        },

        source: {
          type: 'council',
          name: 'Westminster City Council',
          url: 'https://idoxpa.westminster.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TEST002',
          scraped_at: new Date(),
          licence: 'OGL-3.0',
        },

        external_id: 'WCC-LIC-2025-002',
      },

      // Test case 3: Application without premises name (address only)
      {
        title: 'Premises Licence Application - 22 Baker Street',
        notice_type: 'premises-licence',
        full_text: `New premises licence application for retail sale of alcohol.

Address: 22 Baker Street, London, NW1 6XE

Applicant: Tesco Stores Limited

Proposed hours: 07:00 - 23:00 daily

Representations deadline: See notice for details.`,

        postcode: 'NW1 6XE',
        address: '22 Baker Street, London',
        latitude: 51.5225,
        longitude: -0.1579,

        council_slug: 'westminster-city-council',

        publication_date: new Date('2025-01-22'),
        representation_deadline: new Date('2025-02-19'),

        applicant_name: 'Tesco Stores Limited',

        premises: {
          address: '22 Baker Street',
          postcode: 'NW1 6XE',
        },

        source: {
          type: 'council',
          name: 'Westminster City Council',
          url: 'https://idoxpa.westminster.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TEST003',
          scraped_at: new Date(),
          licence: 'OGL-3.0',
        },

        external_id: 'WCC-LIC-2025-003',
      },

      // Test case 4: Duplicate application (to test deduplication)
      {
        title: 'Premises Licence Application - The Churchill Arms (Duplicate)',
        notice_type: 'premises-licence',
        full_text: 'This is a duplicate of the first application - should be skipped.',

        postcode: 'W8 7LN',
        latitude: 51.5066,
        longitude: -0.1948,
        council_slug: 'westminster-city-council',

        publication_date: new Date('2025-01-15'),
        representation_deadline: new Date('2025-02-12'),

        applicant_name: 'Fuller Smith & Turner PLC',

        premises: {
          name: 'The Churchill Arms',
          postcode: 'W8 7LN',
        },

        source: {
          type: 'council',
          name: 'Westminster City Council',
          url: 'https://idoxpa.westminster.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TEST001',
          scraped_at: new Date(),
          licence: 'OGL-3.0',
        },

        // SAME external_id as first application (will be skipped)
        external_id: 'WCC-LIC-2025-001',
      },

      // Test case 5: Application with only council name (no slug) - tests fuzzy matching
      {
        title: 'Club Premises Certificate - The Groucho Club',
        notice_type: 'club-premises-certificate',
        full_text: `Application for a club premises certificate under the Licensing Act 2003.

Premises: The Groucho Club, 45 Dean Street, Soho, London, W1D 4QB

Club: The Groucho Club Limited

Activities: Sale of alcohol to members, live music, recorded music

Hours: 11:00 - 03:00 Monday to Sunday`,

        postcode: 'W1D 4QB',
        address: '45 Dean Street, Soho, London',
        latitude: 51.5135,
        longitude: -0.1315,

        // No council_slug provided - will use council_name fuzzy match
        council_name: 'City of Westminster', // Different format - tests fuzzy matching

        publication_date: new Date('2025-01-25'),
        representation_deadline: new Date('2025-02-22'),

        applicant_name: 'The Groucho Club Limited',

        premises: {
          name: 'The Groucho Club',
          address: '45 Dean Street, Soho',
          postcode: 'W1D 4QB',
        },

        source: {
          type: 'council',
          name: 'Westminster City Council',
          url: 'https://idoxpa.westminster.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=TEST004',
          scraped_at: new Date(),
          licence: 'OGL-3.0',
        },

        external_id: 'WCC-LIC-2025-004',
      },
    ];

    console.log(`[Westminster] Generated ${testNotices.length} test notices`);
    return testNotices;
  }

  /**
   * Future implementation: Real scraping from IDOX
   *
   * This would involve:
   * 1. Fetching the search results page
   * 2. Parsing the HTML table with cheerio or similar
   * 3. Following pagination links
   * 4. Extracting individual application URLs
   * 5. Fetching and parsing each application detail page
   *
   * Example implementation:
   *
   * async scrapeReal(): Promise<ScrapedNotice[]> {
   *   const notices: ScrapedNotice[] = [];
   *
   *   // Step 1: Get search results
   *   const searchUrl = 'https://idoxpa.westminster.gov.uk/online-applications/search.do?action=simple&searchType=LicencingApplication';
   *   const searchHtml = await this.fetchPage(searchUrl);
   *
   *   // Step 2: Parse with cheerio
   *   const $ = cheerio.load(searchHtml);
   *   const rows = $('table.searchResultsTable tr');
   *
   *   // Step 3: Extract application links
   *   for (const row of rows) {
   *     const link = $(row).find('a.searchresult').attr('href');
   *     const appUrl = `https://idoxpa.westminster.gov.uk${link}`;
   *
   *     // Step 4: Fetch application details
   *     const appHtml = await this.fetchPage(appUrl);
   *     const notice = await this.parseApplicationPage(appHtml, appUrl);
   *
   *     notices.push(notice);
   *
   *     await this.sleep(1000); // Rate limiting
   *   }
   *
   *   return notices;
   * }
   */
}
