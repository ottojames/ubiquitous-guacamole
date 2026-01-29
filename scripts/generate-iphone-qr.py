#!/usr/bin/env python3
import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

# Your brand colors
NAVY = '#223266'
MID_BLUE = '#2f5cc7'
LIGHT_BLUE = '#5687EB'
GREY = '#5F6E8B'

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# iPhone 14 Pro / 15 Pro dimensions (1170 x 2532)
width = 1170
height = 2532

# Create canvas
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img)

# Add gradient background effect at top
for i in range(400):
    alpha = i / 400
    color = tuple(int(hex_to_rgb(NAVY)[j] * (1-alpha) + 255 * alpha) for j in range(3))
    draw.rectangle([0, i, width, i+1], fill=color)

# Load logo
logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
try:
    logo = Image.open(logo_path).convert('RGBA')

    print(f"Original logo size: {logo.width}x{logo.height}px")

    # Make white background transparent
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = pixels[x, y]
            # If pixel is white or near-white, make it transparent
            if r > 240 and g > 240 and b > 240:
                pixels[x, y] = (r, g, b, 0)

    print("Made white background transparent")

    # Crop transparent padding from logo to get actual content bounds
    bbox = logo.getbbox()
    if bbox:
        print(f"Bounding box: {bbox}")
        logo = logo.crop(bbox)
        print(f"Cropped logo size: {logo.width}x{logo.height}px")

    # Logo at top - 700px wide maintaining aspect ratio for better visibility
    logo_width = 700
    aspect_ratio = logo.width / logo.height
    logo_height = int(logo_width / aspect_ratio)
    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

    print(f"Resized logo: {logo_width}x{logo_height}px")

    # Center logo - now that it's been cropped properly
    logo_x = (width - logo_width) // 2
    logo_y = 150

    print(f"\nLogo positioning:")
    print(f"  Screen width: {width}px")
    print(f"  Logo width: {logo_width}px")
    print(f"  Logo X position: {logo_x}px")
    print(f"  Logo Y position: {logo_y}px")
    print(f"  Logo center: {logo_x + logo_width//2}px")
    print(f"  Screen center: {width//2}px")

    img.paste(logo, (logo_x, logo_y), logo)
    qr_start_y = logo_y + logo_height + 120
except Exception as e:
    print(f"Logo error: {e}")
    import traceback
    traceback.print_exc()
    qr_start_y = 400

# Generate QR code
url = 'https://civicnotices.co.uk'
qr = qrcode.QRCode(
    version=8,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

qr_img = qr.make_image(fill_color=hex_to_rgb(NAVY), back_color='white')
qr_img = qr_img.convert('RGB')

# QR code with white rounded background
qr_size = 800
qr_img_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

# Create rounded rectangle background for QR
padding = 50
bg_size = qr_size + (padding * 2)
bg = Image.new('RGBA', (bg_size, bg_size), (255, 255, 255, 0))
bg_draw = ImageDraw.Draw(bg)

# Shadow
shadow = Image.new('RGBA', (bg_size + 30, bg_size + 30), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.rounded_rectangle([0, 10, bg_size + 20, bg_size + 30],
                               radius=40, fill=(0, 0, 0, 30))

# Paste shadow
shadow_x = (width - bg_size - 30) // 2
shadow_y = qr_start_y - 10
img.paste(shadow, (shadow_x, shadow_y), shadow)

# White background
bg_draw.rounded_rectangle([0, 0, bg_size, bg_size], radius=40, fill=(255, 255, 255, 255))
bg_x = (width - bg_size) // 2
bg_y = qr_start_y
img.paste(bg, (bg_x, bg_y), bg)

# Paste QR code
qr_x = (width - qr_size) // 2
qr_y = qr_start_y + padding
img.paste(qr_img_resized, (qr_x, qr_y))

# Add text below QR - using your brand font (San Francisco / System UI)
try:
    # Use SF Pro (system font) - same as your logo
    title_font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 60)
    url_font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 52)
    tagline_font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 38)
except:
    try:
        # Fallback to Helvetica Neue
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
        url_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
        tagline_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 38)
    except:
        title_font = ImageFont.load_default()
        url_font = ImageFont.load_default()
        tagline_font = ImageFont.load_default()

text_y = qr_y + qr_size + padding + 80

# URL
url_text = "civicnotices.co.uk"
url_bbox = draw.textbbox((0, 0), url_text, font=url_font)
url_width = url_bbox[2] - url_bbox[0]
url_x = (width - url_width) // 2
draw.text((url_x, text_y), url_text, fill=hex_to_rgb(NAVY), font=url_font)

# Tagline
tagline = "Digital Public Notice Platform"
tagline_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
tagline_width = tagline_bbox[2] - tagline_bbox[0]
tagline_x = (width - tagline_width) // 2
draw.text((tagline_x, text_y + 80), tagline, fill=hex_to_rgb(GREY), font=tagline_font)

# Scan instruction
instruction = "Scan to explore the platform"
instr_bbox = draw.textbbox((0, 0), instruction, font=tagline_font)
instr_width = instr_bbox[2] - instr_bbox[0]
instr_x = (width - instr_width) // 2
draw.text((instr_x, text_y + 160), instruction, fill=hex_to_rgb(GREY), font=tagline_font)

# Save
output_path = os.path.join(os.path.dirname(__file__), '..', 'civic-notices-qr-iphone.png')
img.save(output_path, 'PNG', quality=100, optimize=False)

print(f"✅ iPhone QR screen generated!")
print(f"📁 Saved to: {output_path}")
print(f"📱 Size: {width}x{height}px (iPhone 14/15 Pro)")
print(f"🎨 Brand colors with gradient background")
print(f"🔗 URL: {url}")
