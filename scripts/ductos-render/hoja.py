"""Hoja de contacto para revisar todos los renders de un vistazo: python3 hoja.py salida.jpg"""
import sys, glob, os
from PIL import Image, ImageDraw
d = os.path.join(os.path.dirname(__file__), "../../client/public/ductos")
fs = sorted(f for f in glob.glob(d + "/*.webp") if "catalogo" not in f)
if len(sys.argv) > 2: fs = [f for f in fs if any(n in f for n in sys.argv[2:])]
cols = 4; w, h = 400, 300
hoja = Image.new("RGB", (cols * w, ((len(fs) + cols - 1) // cols) * h), "white")
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((w, h))
    ImageDraw.Draw(im).text((8, 6), os.path.basename(f)[:-5], fill=(200, 0, 0))
    ImageDraw.Draw(im).rectangle((0, 0, w - 1, h - 1), outline=(220, 220, 220))
    hoja.paste(im, ((i % cols) * w, (i // cols) * h))
hoja.save(sys.argv[1], quality=85)
