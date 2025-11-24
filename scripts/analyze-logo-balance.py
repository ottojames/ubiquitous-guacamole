#!/usr/bin/env python3
from PIL import Image
import os

logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
logo = Image.open(logo_path).convert('RGBA')

# Get bounding box and crop
bbox = logo.getbbox()
if bbox:
    logo = logo.crop(bbox)

print(f"Cropped logo size: {logo.width}x{logo.height}px")

# Calculate visual center of mass based on alpha channel
pixels = logo.load()

# For each column, sum the alpha values (visual weight)
column_weights = []
for x in range(logo.width):
    weight = 0
    for y in range(logo.height):
        r, g, b, a = pixels[x, y]
        weight += a  # Alpha channel
    column_weights.append(weight)

# Find the weighted center
total_weight = sum(column_weights)
if total_weight > 0:
    weighted_center_x = sum(x * w for x, w in enumerate(column_weights)) / total_weight
else:
    weighted_center_x = logo.width / 2

geometric_center_x = logo.width / 2

print(f"\nGeometric center: {geometric_center_x:.2f}px")
print(f"Visual center (weighted): {weighted_center_x:.2f}px")
print(f"Offset: {weighted_center_x - geometric_center_x:.2f}px")

# Also check for visual weight distribution
left_half_weight = sum(column_weights[:logo.width//2])
right_half_weight = sum(column_weights[logo.width//2:])

print(f"\nLeft half weight: {left_half_weight:,}")
print(f"Right half weight: {right_half_weight:,}")
if left_half_weight > 0:
    print(f"Balance ratio: {right_half_weight/left_half_weight:.3f} (should be ~1.0 for balanced)")

# Calculate the offset needed for iPhone QR
iphone_width = 1170
target_logo_width = 700

# Where we currently place it
current_x = (iphone_width - target_logo_width) // 2

# Where we SHOULD place it to account for visual imbalance
scale_factor = target_logo_width / logo.width
visual_offset = (weighted_center_x - geometric_center_x) * scale_factor

suggested_x = current_x - int(visual_offset)

print(f"\nFor iPhone QR (1170px wide, logo 700px):")
print(f"Current X position: {current_x}px")
print(f"Visual offset at this scale: {visual_offset:.2f}px")
print(f"Suggested X position: {suggested_x}px (shift by {-int(visual_offset)}px)")
