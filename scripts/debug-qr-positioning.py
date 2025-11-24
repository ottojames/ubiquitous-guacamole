#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

# Load the generated QR image
qr_path = os.path.join(os.path.dirname(__file__), '..', 'civic-notices-qr-iphone.png')
img = Image.open(qr_path)

print(f"iPhone QR image size: {img.width}x{img.height}px")

# Create a copy with debug guides
debug_img = img.copy()
draw = ImageDraw.Draw(debug_img)

# Draw vertical center line
center_x = img.width // 2
draw.line([(center_x, 0), (center_x, img.height)], fill='red', width=2)

# Draw horizontal guides at logo area
logo_top = 150
logo_bottom = 150 + 177  # Approximate logo height at 700px wide
draw.line([(0, logo_top), (img.width, logo_top)], fill='green', width=1)
draw.line([(0, logo_bottom), (img.width, logo_bottom)], fill='green', width=1)

# Draw vertical guides at expected logo bounds (700px wide)
logo_left = (img.width - 700) // 2
logo_right = logo_left + 700
draw.line([(logo_left, 0), (logo_left, img.height)], fill='blue', width=1)
draw.line([(logo_right, 0), (logo_right, img.height)], fill='blue', width=1)

# Save debug version
debug_path = os.path.join(os.path.dirname(__file__), '..', 'civic-notices-qr-debug.png')
debug_img.save(debug_path)

print(f"\nDebug image saved to: {debug_path}")
print(f"Red line: Screen center at {center_x}px")
print(f"Blue lines: Logo bounds [{logo_left}px - {logo_right}px]")
print(f"Logo should be {logo_right - logo_left}px wide")

# Now let's analyze the actual logo in the image
# Sample pixels around where we expect the logo
print("\nAnalyzing actual logo position in QR image...")

# Scan horizontally at logo vertical center to find logo edges
scan_y = (logo_top + logo_bottom) // 2
logo_pixels = []

for x in range(img.width):
    r, g, b = img.getpixel((x, scan_y))[:3]
    # Logo has dark blue/navy color, background is light gradient
    if r < 100 and b > 50:  # Likely logo pixel
        logo_pixels.append(x)

if logo_pixels:
    actual_logo_left = min(logo_pixels)
    actual_logo_right = max(logo_pixels)
    actual_logo_center = (actual_logo_left + actual_logo_right) // 2
    actual_logo_width = actual_logo_right - actual_logo_left

    print(f"\nActual logo position found:")
    print(f"Left edge: {actual_logo_left}px")
    print(f"Right edge: {actual_logo_right}px")
    print(f"Width: {actual_logo_width}px")
    print(f"Actual center: {actual_logo_center}px")
    print(f"Screen center: {center_x}px")
    print(f"Offset from screen center: {actual_logo_center - center_x}px")
else:
    print("Could not detect logo pixels (might be in wrong location)")
