const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateBrandedQR() {
  const url = 'https://civicnotices.co.uk';
  const outputPath = path.join(__dirname, '..', 'civic-notices-qr-code.png');

  // QR code settings for ultra high quality
  const qrSize = 2048;
  const finalSize = 2400;
  const padding = (finalSize - qrSize) / 2;

  // Generate QR code
  const qrCanvas = createCanvas(qrSize, qrSize);
  await QRCode.toCanvas(qrCanvas, url, {
    width: qrSize,
    margin: 2,
    color: {
      dark: '#223266',  // Your brand navy
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  // Create final canvas with branding
  const canvas = createCanvas(finalSize, finalSize);
  const ctx = canvas.getContext('2d');

  // Background with gradient border
  const gradient = ctx.createLinearGradient(0, 0, finalSize, finalSize);
  gradient.addColorStop(0, '#223266');   // Navy
  gradient.addColorStop(0.5, '#2f5cc7'); // Mid blue
  gradient.addColorStop(1, '#5687EB');   // Light blue

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, finalSize, finalSize);

  // White inner area
  const borderWidth = 12;
  ctx.fillStyle = 'white';
  ctx.fillRect(borderWidth, borderWidth,
               finalSize - (borderWidth * 2),
               finalSize - (borderWidth * 2));

  // Draw QR code
  ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);

  // Load and draw logo in center
  try {
    const logo = await loadImage(path.join(__dirname, '..', 'public', 'civic-notices-logo.png'));

    const logoSize = 280;
    const logoX = (finalSize - logoSize) / 2;
    const logoY = (finalSize - logoSize) / 2;

    // White circle background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(finalSize / 2, finalSize / 2, logoSize / 2 + 20, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Draw logo
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

  } catch (error) {
    console.log('Logo not found, creating text-based center');

    // Fallback: civic building icon in center
    const centerX = finalSize / 2;
    const centerY = finalSize / 2;
    const circleRadius = 140;

    // White circle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw simplified civic building
    ctx.fillStyle = '#223266';
    ctx.fillRect(centerX - 60, centerY - 20, 25, 80);
    ctx.fillStyle = '#2f5cc7';
    ctx.fillRect(centerX - 20, centerY - 20, 25, 80);
    ctx.fillStyle = '#5687EB';
    ctx.fillRect(centerX + 20, centerY - 20, 25, 80);

    // Roof
    ctx.fillStyle = '#223266';
    ctx.beginPath();
    ctx.moveTo(centerX - 70, centerY - 20);
    ctx.lineTo(centerX, centerY - 60);
    ctx.lineTo(centerX + 70, centerY - 20);
    ctx.closePath();
    ctx.fill();
  }

  // Save ultra high-quality PNG
  const buffer = canvas.toBuffer('image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE });
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ QR code generated successfully!');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📐 Size: ${finalSize}x${finalSize}px`);
  console.log('🎨 Colors: Your brand navy (#223266) to blue (#5687EB)');
  console.log('🔗 URL: https://civicnotices.co.uk');
}

generateBrandedQR().catch(console.error);
