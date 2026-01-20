#!/usr/bin/env python3
from PIL import Image
import os

logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'civic-notices-logo.png')
logo = Image.open(logo_path).convert('RGBA')

pixels = logo.load()

# Sample corners and edges to see if there's a background
positions = [
    ("Top-left corner", 10, 10),
    ("Top-right corner", logo.width - 10, 10),
    ("Middle-left edge", 10, logo.height // 2),
    ("Middle-right edge", logo.width - 10, logo.height // 2),
    ("Bottom-left corner", 10, logo.height - 10),
    ("Bottom-right corner", logo.width - 10, logo.height - 10),
]

print("Sampling logo edge/corner pixels:")
for name, x, y in positions:
    r, g, b, a = pixels[x, y]
    print(f"  {name:20s} ({x:4d}, {y:3d}): RGBA({r:3d}, {g:3d}, {b:3d}, {a:3d})")
    if a > 0:
        print(f"    ^ Has color (not fully transparent)")

# Check the very edge pixels
print("\nChecking actual edge pixels:")
for x in [0, logo.width // 2, logo.width - 1]:
    r, g, b, a = pixels[x, 0]
    print(f"  Top edge at x={x}: RGBA({r}, {g}, {b}, {a})")

for x in [0, logo.width // 2, logo.width - 1]:
    r, g, b, a = pixels[x, logo.height - 1]
    print(f"  Bottom edge at x={x}: RGBA({r}, {g}, {b}, {a})")
