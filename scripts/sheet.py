"""Tile review stills into contact sheets: python3 scripts/sheet.py <glob-prefix> <out.png> [cols]"""
import glob, sys
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1] + "*.png"))
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 2
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), (60, 60, 60))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * (w + 8), (i // cols) * (h + 8)
    sheet.paste(im, (x, y))
    d.text((x + 6, y + 4), f.split("/")[-1], fill=(255, 255, 0))
sheet.save(sys.argv[2])
print(sys.argv[2], len(ims))
