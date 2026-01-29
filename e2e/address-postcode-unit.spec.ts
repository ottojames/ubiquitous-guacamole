import { test, expect } from '@playwright/test';

test.describe('Address Data Verification', () => {
  test('mock provider has correct Chester postcode CH4 7BB', async ({ page }) => {
    // Navigate to a page that loads the mockProvider
    await page.goto('http://localhost:5173');

    // Inject test code to verify the mockProvider data
    const postcodeResult = await page.evaluate(() => {
      // Import the mockProvider from the module
      return fetch('/src/components/AddressLookup.tsx')
        .then(response => response.text())
        .then(code => {
          // Check if the code contains the correct postcode
          const hasCorrectPostcode = code.includes('9 Lower Park Road, Chester') &&
                                     code.includes('CH4 7BB');
          const hasWrongPostcode = code.includes('CH4 7DE');

          return {
            hasCorrectPostcode,
            hasWrongPostcode
          };
        });
    });

    console.log('Postcode check result:', postcodeResult);

    expect(postcodeResult.hasCorrectPostcode).toBe(true);
    expect(postcodeResult.hasWrongPostcode).toBe(false);

    console.log('✓ Chester postcode correctly set to CH4 7BB in mockProvider!');
  });

  test('verifies Chester addresses exist in mockProvider', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const chesterCheck = await page.evaluate(() => {
      return fetch('/src/components/AddressLookup.tsx')
        .then(response => response.text())
        .then(code => {
          const chesterAddresses = [
            '9 Lower Bridge Street, Chester',
            '9 Lower Park Road, Chester',
            '9 Lowes Lane, Chester',
            '9 Lowell Drive, Chester'
          ];

          const foundAddresses = chesterAddresses.filter(addr => code.includes(addr));

          return {
            total: chesterAddresses.length,
            found: foundAddresses.length,
            foundAddresses
          };
        });
    });

    console.log(`Found ${chesterCheck.found} out of ${chesterCheck.total} Chester addresses`);
    console.log('Addresses:', chesterCheck.foundAddresses);

    expect(chesterCheck.found).toBe(chesterCheck.total);

    console.log('✓ All Chester addresses present in mockProvider!');
  });
});
