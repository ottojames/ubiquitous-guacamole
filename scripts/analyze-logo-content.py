#!/usr/bin/env python3
from PIL import Image
import os

logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
logo = Image.open(logo_path).convert('RGBA')

print(f"Original logo: {logo.width}x{logo.height}px")

# Analyze where actual content is
pixels = logo.load()

# Find the leftmost and rightmost non-transparent pixels
leftmost = logo.width
rightmost = 0
topmost = logo.height
bottommost = 0

for y in range(logo.height):
    for x in range(logo.width):
        r, g, b, a = pixels[x, y]
        if a > 10:  # Non-transparent
            leftmost = min(leftmost, x)
            rightmost = max(rightmost, x)
            topmost = min(topmost, y)
            bottommost = max(bottommost, y)

print(f"\nActual content bounds:")
print(f"  Leftmost pixel: {leftmost}px")
print(f"  Rightmost pixel: {rightmost}px")
print(f"  Topmost pixel: {topmost}px")
print(f"  Bottommost pixel: {bottommost}px")
print(f"  Content width: {rightmost - leftmost + 1}px")
print(f"  Content height: {bottommost - topmost + 1}px")

# Calculate padding
left_padding = leftmost
right_padding = logo.width - rightmost - 1
top_padding = topmost
bottom_padding = logo.height - bottommost - 1

print(f"\nPadding:")
print(f"  Left: {left_padding}px")
print(f"  Right: {right_padding}px")
print(f"  Top: {top_padding}px")
print(f"  Bottom: {bottom_padding}px")
print(f"  Horizontal padding difference: {abs(left_padding - right_padding)}px")

# Now let's find the visual center of the actual content
content_geometric_center = leftmost + (rightmost - leftmost) // 2
logo_geometric_center = logo.width // 2

print(f"\nCentering:")
print(f"  Content geometric center: {content_geometric_center}px")
print(f"  Logo image center: {logo_geometric_center}px")
print(f"  Offset: {content_geometric_center - logo_geometric_center}px")

if abs(content_geometric_center - logo_geometric_center) > 5:
    print(f"\n⚠️  ISSUE FOUND: Content is {content_geometric_center - logo_geometric_center}px off from image center!")
    print(f"   This is why it looks off-center when the image is centered.")

    # Calculate how much we need to shift
    shift_needed = logo_geometric_center - content_geometric_center
    print(f"\n   To fix: shift logo by {shift_needed}px to the right")
else:
    print(f"\n✅ Content is well-centered within the image")

# Create a tightly cropped version
cropped = logo.crop((leftmost, topmost, rightmost + 1, bottommost + 1))
cropped_path = os.path.join(os.path.dirname(__file__), '..', 'civic-notices-logo-cropped.png')
cropped.save(cropped_path)
print(f"\nTightly cropped logo saved to: civic-notices-logo-cropped.png")
print(f"Cropped size: {cropped.width}x{cropped.height}px")
