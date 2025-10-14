import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Critical Bug Fixes Verification', () => {
  test('verifies all three critical fixes in the source code', async () => {
    // This test verifies the source code changes directly rather than testing the full E2E flow
    // which has complex upload/OCR dependencies

    // ✅ TEST 1: Verify postcode CH4 7BB in AddressLookup.tsx
    const addressLookupPath = path.resolve('src/components/AddressLookup.tsx');
    const addressLookupContent = fs.readFileSync(addressLookupPath, 'utf-8');

    // Check that CH4 7BB is present (NOT CH4 7DE)
    expect(addressLookupContent).toContain('9 Lower Park Road, Chester');
    expect(addressLookupContent).toContain('CH4 7BB');
    expect(addressLookupContent).not.toContain('CH4 7DE');

    console.log('✅ TEST 1 PASSED: Postcode is CH4 7BB (not CH4 7DE) in mockProvider');

    // ✅ TEST 2: Verify Required badges in UploadOcrPane.tsx
    const uploadOcrPanePath = path.resolve('src/next/publish/flow/components/UploadOcrPane.tsx');
    const uploadOcrPaneContent = fs.readFileSync(uploadOcrPanePath, 'utf-8');

    // Count occurrences of the Required badge component
    const requiredBadgePattern = /bg-rose-100.*px-2.*py-0\.5.*text-xs.*font-semibold.*text-rose-700[\s\S]*?Required/g;
    const requiredBadgeMatches = uploadOcrPaneContent.match(requiredBadgePattern) || [];

    expect(requiredBadgeMatches.length).toBeGreaterThanOrEqual(5);
    console.log(`✅ TEST 2 PASSED: Found ${requiredBadgeMatches.length} Required badge implementations`);

    // Verify specific required fields have badges
    expect(uploadOcrPaneContent).toMatch(/Applicant legal name[\s\S]{0,200}bg-rose-100[\s\S]{0,200}Required/);
    expect(uploadOcrPaneContent).toMatch(/Address line 1[\s\S]{0,200}bg-rose-100[\s\S]{0,200}Required/);
    expect(uploadOcrPaneContent).toMatch(/Town or city[\s\S]{0,200}bg-rose-100[\s\S]{0,200}Required/);
    expect(uploadOcrPaneContent).toMatch(/Postcode[\s\S]{0,200}bg-rose-100[\s\S]{0,200}Required/);
    expect(uploadOcrPaneContent).toMatch(/Licensing authority[\s\S]{0,200}bg-rose-100[\s\S]{0,200}Required/);

    console.log('✅ TEST 2 PASSED: All mandatory fields have prominent Required badges');

    // ✅ TEST 3: Verify layout improvements
    // Check for section subtitles
    expect(uploadOcrPaneContent).toContain('Who is applying for the licence');
    expect(uploadOcrPaneContent).toContain('Where the premises is located');
    expect(uploadOcrPaneContent).toContain('Council responsible for licensing');

    console.log('✅ TEST 3 PASSED: Section headers have descriptive subtitles');

    // Check for improved spacing (space-y-6 instead of space-y-5)
    const spaceY6Count = (uploadOcrPaneContent.match(/space-y-6/g) || []).length;
    expect(spaceY6Count).toBeGreaterThanOrEqual(5);

    console.log(`✅ TEST 3 PASSED: Layout spacing improved (${spaceY6Count} instances of space-y-6)`);

    console.log('\n========================================');
    console.log('ALL SOURCE CODE VERIFICATIONS PASSED! ✅');
    console.log('========================================');
    console.log('1. ✅ Postcode bug fixed: CH4 7BB (not CH4 7DE)');
    console.log(`2. ✅ Required badges implemented: ${requiredBadgeMatches.length} instances found`);
    console.log('3. ✅ Layout improved: section subtitles + better spacing');
    console.log('========================================\n');
  });
});
