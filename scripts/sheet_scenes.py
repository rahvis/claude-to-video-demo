"""Tile review stills for chosen scenes: python3 scripts/sheet_scenes.py <prefix> <out.png> <cols> <scene>..."""
import glob, sys
from PIL import Image
prefix, out, cols, scenes = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4:]
files = [f for sc in scenes for f in sorted(glob.glob(f"{prefix}{sc}_*.png"))]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols - 1) * 10, rows * h + (rows - 1) * 10), (120, 120, 120))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * (w + 10), (i // cols) * (h + 10)))
sheet.save(out)
print(out, len(ims))
