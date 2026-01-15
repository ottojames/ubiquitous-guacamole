/**
 * Update prd.json with ALL detailed user feedback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const prdPath = path.join(projectRoot, 'prd.json');

const prd = JSON.parse(fs.readFileSync(prdPath, 'utf-8'));

// Update specific stories with detailed requirements

prd.userStories = prd.userStories.map((story: any) => {

  // US-0011: Fix Wizard - Add ALL field removals and reordering
  if (story.id === 'US-0011') {
    story.acceptanceCriteria = [
      'FIELD REMOVALS: Remove trading name, applicant address (second one), company number, DPS (designated premises supervisor), publication date optional',
      'FIELD REORDERING: Sale of alcohol should be at TOP of activities list (below opening hours)',
      'DEFAULT TO STRUCTURED TEMPLATE: Step 2 upload should default to "structured template" not upload',
      'Council dropdown must have data: Add Sampletonborough Council via SQL if needed',
      'On step 4, clicking submit must create notice, upload documents, redirect to confirmation',
      'Browser testing steps:',
      '  - Navigate to /publish/step-1',
      '  - Select "New Premises Licence"',
      '  - Step 2: Verify defaults to "structured template"',
      '  - Fill in form - verify removed fields are GONE',
      '  - Verify sale of alcohol is at TOP of activities',
      '  - Select Sampletonborough Council from dropdown',
      '  - Complete and submit',
      '  - Verify notice created successfully',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0108: One Click Address Select
  if (story.id === 'US-0108') {
    story.acceptanceCriteria = [
      'Research publicnoticeportal.co.uk address search UX pattern',
      'When user types postcode (e.g. SW1A 1AA), dropdown appears with matching addresses',
      'Clicking an address IMMEDIATELY shows map with notices (NO confirm button needed)',
      'Dropdown should appear within 500ms of typing valid postcode',
      'Browser testing steps:',
      '  - Navigate to /notices',
      '  - Type "SW1A 1AA" in search box',
      '  - Verify dropdown appears with address list',
      '  - Click first address in dropdown',
      '  - Verify map loads IMMEDIATELY (no extra click)',
      '  - Verify notices appear on map',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0109: Radius Filters Before Search
  if (story.id === 'US-0109') {
    story.acceptanceCriteria = [
      'Research publicnoticeportal.co.uk - radius filter is visible BEFORE search',
      'Filter buttons: 500m, 1km, 2km, 5km must be visible at top of page',
      'User can select radius BEFORE typing postcode',
      'Selected radius applies immediately when address is clicked',
      'Browser testing steps:',
      '  - Navigate to /notices',
      '  - Verify radius filter buttons visible (500m, 1km, 2km, 5km)',
      '  - Click "2km" button',
      '  - Type postcode and select address',
      '  - Verify map shows notices within 2km radius',
      '  - Change to 5km, verify map updates',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0117: Generate Blue Notice PDF
  if (story.id === 'US-0117') {
    story.acceptanceCriteria = [
      'Auto-generate print-ready A4 blue notice PDF',
      'PDF uses council template based on selected council and notice type',
      'QR code at bottom center linking to online notice (civicnotices.com/notices/[id])',
      'Display instructions included: "Display this notice at premises for 28 days from [date] to [date]"',
      'PDF must be downloadable immediately after notice published',
      'Fix API connection issue (port 5174 error)',
      'Browser testing steps:',
      '  - Publish a new premises licence notice',
      '  - On confirmation page, click "Download Blue Notice PDF"',
      '  - Verify PDF downloads successfully (no port 5174 error)',
      '  - Open PDF, verify: blue background, QR code present, display instructions, all notice details',
      '  - Scan QR code with phone, verify links to notice page',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0125: Licensing Dashboard Widgets
  if (story.id === 'US-0125') {
    story.acceptanceCriteria = [
      'Create Sampletonborough Council in database via SQL',
      'Dashboard shows: Active applications, Urgent deadlines (7 days red, 14 days amber), Representation activity',
      'Dashboard shows: Processing metrics (avg time, % meeting deadlines, officer workload)',
      'Dashboard shows: Notice type breakdown (premises, variations, reviews, transfers)',
      'Dashboard is DIFFERENT from planning/environmental dashboards',
      'All data filtered by Licensing department only',
      'Browser testing steps:',
      '  - Login to council portal as licensing@sampletonborough.gov.uk',
      '  - Navigate to Dashboard',
      '  - Verify shows licensing-specific widgets',
      '  - Verify shows active applications count',
      '  - Verify shows upcoming deadlines with color coding',
      '  - Verify shows representation activity',
      '  - Verify shows processing metrics',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0126: Assign Representation To Officer
  if (story.id === 'US-0126') {
    story.acceptanceCriteria = [
      'Create test council with licensing department and officers in database',
      'From representation list, click "Assign" button',
      'Select officer from dropdown (show all officers in Licensing department)',
      'Officer receives notification (email or in-app)',
      'Assigned representations show officer name in list',
      'Can filter representations by "Assigned to me"',
      'Browser testing steps:',
      '  - Login as licensing head (Sarah)',
      '  - Navigate to Representations',
      '  - Click "Assign" on a representation',
      '  - Select an officer from dropdown',
      '  - Verify representation shows as assigned',
      '  - Login as that officer, verify can see assigned representations',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0127: Mark Representation Reviewed
  if (story.id === 'US-0127') {
    story.acceptanceCriteria = [
      'From representation detail view, click "Mark as Reviewed" button',
      'Records reviewer name and timestamp',
      'Shows "Reviewed by [name] on [date]" badge',
      'Can filter representations by "Reviewed" / "Not Reviewed"',
      'Creates audit trail entry',
      'Browser testing steps:',
      '  - Login to council portal',
      '  - Navigate to Representations',
      '  - Click on a representation',
      '  - Click "Mark as Reviewed"',
      '  - Verify shows reviewed badge with name and date',
      '  - Filter by "Reviewed", verify appears in filtered list',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0128: Internal Notes On Representations
  if (story.id === 'US-0128') {
    story.acceptanceCriteria = [
      'Add "Internal Notes" section to representation detail view',
      'Notes visible ONLY to council team (not public)',
      'Can add new note with text and attachments',
      'Shows note author and timestamp',
      'Notes appear in chronological order',
      'Browser testing steps:',
      '  - Login to council portal',
      '  - View a representation',
      '  - Add internal note "Discussed with planning team"',
      '  - Verify note appears with your name and timestamp',
      '  - Login as different officer, verify can see note',
      '  - Verify note NOT visible on public notice page',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0129: Export Reps For Idox
  if (story.id === 'US-0129') {
    story.acceptanceCriteria = [
      'Add "Export for Idox" button to representations list',
      'Exports CSV with all fields needed for Idox import',
      'CSV includes: representation ID, notice ref, submitter name, email, stance, text, date submitted, reviewed status',
      'Can filter before export (by date range, notice, reviewed status)',
      'Browser testing steps:',
      '  - Login to council portal',
      '  - Navigate to Representations',
      '  - Click "Export for Idox"',
      '  - Verify CSV downloads',
      '  - Open CSV, verify has all required columns',
      '  - Verify data is correctly formatted for Idox',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0145: Firm Registration Wizard
  if (story.id === 'US-0145') {
    story.acceptanceCriteria = [
      'Fix redirect issue: /register/firm should show wizard, not redirect to homepage',
      'Multi-step wizard: 1) Firm details, 2) Practice areas, 3) Contact info, 4) Billing',
      'Step 2 Practice Areas: Checkboxes for Licensing, Planning, Environmental Health, Highways',
      'Selected practice areas saved to firm profile',
      'Creates firm account and first user (admin role)',
      'Browser testing steps:',
      '  - Navigate to /register/firm',
      '  - Verify wizard appears (NOT redirect to homepage)',
      '  - Step 1: Fill in firm name, address',
      '  - Step 2: Select "Licensing" and "Planning" checkboxes',
      '  - Step 3: Fill in contact info',
      '  - Step 4: Complete registration',
      '  - Verify firm created with practice areas: Licensing, Planning',
      '  - Login to firm portal, verify dashboard only shows Licensing and Planning sections',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0146: Practice Area Selection
  if (story.id === 'US-0146') {
    story.acceptanceCriteria = [
      'Practice areas set during firm registration (US-0145)',
      'Practice areas editable in firm settings page',
      'Checkboxes: Licensing, Planning, Environmental Health, Highways, Building Control',
      'Changing practice areas updates: dashboard widgets, notice type dropdown, available templates',
      'If firm unchecks a practice area, confirm "This will hide all [area] notices"',
      'Browser testing steps:',
      '  - Complete firm registration with Licensing + Planning',
      '  - Navigate to firm settings',
      '  - Verify shows current practice areas: Licensing ✓, Planning ✓',
      '  - Check "Environmental Health" checkbox',
      '  - Save settings',
      '  - Navigate to publish page, verify Environmental notice types now available',
      '  - Go back to settings, uncheck Planning, verify confirmation dialog',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0148: Licensing Quick Publish
  if (story.id === 'US-0148') {
    story.acceptanceCriteria = [
      'Create test firm account via registration wizard',
      'Add "Quick Publish" button on firm dashboard',
      'For repeat clients: auto-fills client details (applicant name, address, contact)',
      'Client dropdown shows firms 20+ clients ordered by most recent',
      'Selecting client pre-populates: applicant name, applicant address, contact email',
      'Can still edit pre-populated fields',
      'Browser testing steps:',
      '  - Login as law firm (Emma)',
      '  - Navigate to Dashboard',
      '  - Click "Quick Publish"',
      '  - Select existing client from dropdown',
      '  - Verify form pre-filled with client details',
      '  - Change council, verify still works',
      '  - Complete and publish notice',
      '  - Verify notice created with client details',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0149: Client Management
  if (story.id === 'US-0149') {
    story.acceptanceCriteria = [
      'Add Clients page to firm portal navigation',
      'List all firm clients with: name, contact, number of active notices, last notice date',
      'Click "Add Client" to create new client profile',
      'Client form: name, contact person, email, phone, address',
      'Click client to see: all their notices, representations received, history',
      'Can edit client details',
      'Browser testing steps:',
      '  - Login as law firm',
      '  - Navigate to Clients page',
      '  - Click "Add Client"',
      '  - Fill in: "The Red Lion Pub", contact: "John Smith", email: "john@redlion.com"',
      '  - Save client',
      '  - Verify client appears in list',
      '  - Click client, verify shows client detail page',
      '  - Publish notice for this client, verify appears in client notices list',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0150: Live Representation Feed
  if (story.id === 'US-0150') {
    story.acceptanceCriteria = [
      'Create test firm and test notice first',
      'Firm dashboard shows "Recent Representations" widget',
      'Shows representations submitted in last 7 days across all firm notices',
      'Each entry shows: notice ref, representation stance (support/object/comment), date, preview text',
      'Updates in real-time (or refresh to see new representations)',
      'Click representation to see full details',
      'Browser testing steps:',
      '  - Login as law firm',
      '  - Publish a test notice',
      '  - Open incognito window, submit representation on that notice',
      '  - Go back to firm dashboard',
      '  - Refresh page',
      '  - Verify representation appears in "Recent Representations" widget',
      '  - Click it, verify opens full representation detail',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  // US-0151: Consultation Countdown
  if (story.id === 'US-0151') {
    story.acceptanceCriteria = [
      'Create test firm and test notice with consultation deadline',
      'Each notice card shows consultation end date and countdown',
      'Countdown format: "5 days remaining" or "Ends 25 Jan 2026"',
      'Color coding: Red if <7 days, Amber if <14 days, Green if >14 days',
      'Firm dashboard shows "Upcoming Deadlines" widget sorted by soonest first',
      'Browser testing steps:',
      '  - Login as law firm',
      '  - Publish notice with consultation end date 10 days from now',
      '  - Navigate to Notices page',
      '  - Verify notice card shows "10 days remaining" in amber',
      '  - Navigate to Dashboard',
      '  - Verify "Upcoming Deadlines" widget shows this notice',
      '  - Manually update notice deadline to 3 days from now via database',
      '  - Refresh, verify shows red color',
      'MUST verify in Chrome browser - evidence must say "BROWSER TESTED: [steps] - [result]"',
      'Quality checks must pass: typecheck, lint, test, dev server starts'
    ];
  }

  return story;
});

fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2));

console.log('✅ Updated prd.json with ALL detailed user feedback');
console.log('\nKey updates:');
console.log('  - US-0011: ALL field removals and reordering specified');
console.log('  - US-0108: One-click address with publicnoticeportal.co.uk research');
console.log('  - US-0109: Radius filters before search');
console.log('  - US-0117: Blue notice PDF with QR code and instructions');
console.log('  - US-0125-0129: Council portal features with test data requirements');
console.log('  - US-0145-0146: Firm registration with practice area selection');
console.log('  - US-0148-0151: Firm portal features with proper test setup');
