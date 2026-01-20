import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertSvgToPng() {
  console.log('🎨 Converting SVG logo to PNG...\n');

  // Read the SVG file
  const svgPath = join(__dirname, '../public/civic-notices-logo.svg');
  const svgContent = readFileSync(svgPath, 'utf-8');

  // Create HTML wrapper
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #logo {
      display: block;
    }
  </style>
</head>
<body>
  <div id="logo">${svgContent}</div>
</body>
</html>
  `;

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1680, height: 500 }
  });

  // Set content and screenshot
  await page.setContent(html);
  await page.waitForTimeout(500);

  const logo = await page.locator('#logo');
  const screenshot = await logo.screenshot({
    omitBackground: true,
    scale: 'device'
  });

  // Save PNG
  const pngPath = join(__dirname, '../public/civic-notices-logo.png');
  writeFileSync(pngPath, screenshot);

  console.log('✅ Logo saved to:', pngPath);
  console.log('\n📍 You can access it at:');
  console.log('   - Local file: /Users/ottoclarke/projects/Civic Notices Demo Site/public/civic-notices-logo.png');
  console.log('   - In browser: http://localhost:5173/civic-notices-logo.png\n');

  await browser.close();
}

convertSvgToPng().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
