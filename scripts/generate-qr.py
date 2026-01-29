#!/usr/bin/env python3
import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

# Your brand colors
NAVY = '#223266'
MID_BLUE = '#2f5cc7'
LIGHT_BLUE = '#5687EB'

# Generate QR code
url = 'https://civicnotices.co.uk'
qr = qrcode.QRCode(
    version=10,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=20,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

# Create QR code image with your navy color
qr_img = qr.make_image(fill_color=NAVY, back_color='white')

# Convert to RGB for editing
qr_img = qr_img.convert('RGB')

# Create larger canvas with gradient border
final_size = 2400
qr_size = 2048
padding = (final_size - qr_size) // 2
border_width = 12

# Create final image
final_img = Image.new('RGB', (final_size, final_size), 'white')
draw = ImageDraw.Draw(final_img)

# Draw gradient border effect (simplified - solid navy)
for i in range(border_width):
    draw.rectangle([i, i, final_size-i-1, final_size-i-1], outline=NAVY, width=1)

# Paste QR code
qr_img_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
final_img.paste(qr_img_resized, (padding, padding))

# Load and paste logo in center
logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
try:
    logo = Image.open(logo_path)
    logo = logo.convert('RGBA')

    # Calculate logo size preserving aspect ratio
    logo_width_target = 500  # Target width
    aspect_ratio = logo.width / logo.height
    logo_height_target = int(logo_width_target / aspect_ratio)

    # Create white rounded rectangle background (not circle, since logo is wide)
    padding_around_logo = 40
    bg_width = logo_width_target + (padding_around_logo * 2)
    bg_height = logo_height_target + (padding_around_logo * 2)

    # Create white background with rounded corners
    bg = Image.new('RGBA', (bg_width, bg_height), (255, 255, 255, 0))
    bg_draw = ImageDraw.Draw(bg)
    bg_draw.rounded_rectangle([0, 0, bg_width, bg_height], radius=30, fill=(255, 255, 255, 255))

    # Add shadow effect
    shadow_offset = 10
    shadow = Image.new('RGBA', (bg_width + 20, bg_height + 20), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle([5, shadow_offset, bg_width + 15, bg_height + shadow_offset + 10],
                                   radius=30, fill=(0, 0, 0, 50))

    # Paste shadow
    shadow_pos = ((final_size - bg_width - 20) // 2, (final_size - bg_height - 20) // 2)
    final_img.paste(shadow, shadow_pos, shadow)

    # Paste white background
    bg_pos = ((final_size - bg_width) // 2, (final_size - bg_height) // 2)
    final_img.paste(bg, bg_pos, bg)

    # Paste logo (preserving aspect ratio)
    logo_resized = logo.resize((logo_width_target, logo_height_target), Image.Resampling.LANCZOS)
    logo_pos = ((final_size - logo_width_target) // 2, (final_size - logo_height_target) // 2)
    final_img.paste(logo_resized, logo_pos, logo_resized)

except FileNotFoundError:
    print("Logo file not found, creating without logo")

# Save ultra high-quality PNG
output_path = os.path.join(os.path.dirname(__file__), '..', 'civic-notices-qr-code.png')
final_img.save(output_path, 'PNG', quality=100, optimize=False)

print(f"✅ QR code generated successfully!")
print(f"📁 Saved to: {output_path}")
print(f"📐 Size: {final_size}x{final_size}px")
print(f"🎨 Colors: Your brand navy ({NAVY})")
print(f"🔗 URL: {url}")
