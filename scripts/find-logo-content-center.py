#!/usr/bin/env python3
from PIL import Image
import os

logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
logo = Image.open(logo_path).convert('RGBA')

pixels = logo.load()

# Find where the actual COLORED content is (not white background)
# Logo uses navy/blue colors
leftmost_content = logo.width
rightmost_content = 0

for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = pixels[x, y]
        # Check if this is NOT white (logo content is dark blue/navy)
        if a > 200 and (r < 200 or g < 200 or b < 200):  # Not white
            leftmost_content = min(leftmost_content, x)
            rightmost_content = max(rightmost_content, x)

print(f"Logo image: {logo.width}x{logo.height}px")
print(f"\nActual colored content (building + text):")
print(f"  Leftmost colored pixel: {leftmost_content}px")
print(f"  Rightmost colored pixel: {rightmost_content}px")
print(f"  Content width: {rightmost_content - leftmost_content + 1}px")

# Calculate where the content center is
content_center = leftmost_content + (rightmost_content - leftmost_content) // 2
image_center = logo.width // 2

print(f"\nCentering analysis:")
print(f"  Content center: {content_center}px")
print(f"  Image center: {image_center}px")
print(f"  Offset: {content_center - image_center}px")

left_white_space = leftmost_content
right_white_space = logo.width - rightmost_content - 1

print(f"\nWhite space around content:")
print(f"  Left side: {left_white_space}px")
print(f"  Right side: {right_white_space}px")
print(f"  Difference: {abs(left_white_space - right_white_space)}px")

if abs(content_center - image_center) > 10:
    print(f"\n⚠️  ISSUE FOUND: Logo content is {content_center - image_center}px off-center!")
    print(f"   When you center the image, the visual content appears off-center.")

    # How much to shift when rendering on iPhone
    shift_needed = image_center - content_center
    print(f"\n   Solution: Shift logo {shift_needed}px to the {'right' if shift_needed > 0 else 'left'} when pasting")

    iphone_width = 1170
    logo_width_on_phone = 700
    current_x = (iphone_width - logo_width_on_phone) // 2

    # Scale the shift to the resized logo
    scale = logo_width_on_phone / logo.width
    shift_scaled = int(shift_needed * scale)

    corrected_x = current_x + shift_scaled

    print(f"\n   On iPhone (logo scaled to {logo_width_on_phone}px wide):")
    print(f"     Current X: {current_x}px")
    print(f"     Shift by: {shift_scaled}px")
    print(f"     Corrected X: {corrected_x}px")
else:
    print(f"\n✅ Logo content is centered within the image")
