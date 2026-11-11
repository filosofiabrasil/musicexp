"""Extrai contornos SMuFL da Bravura (SIL OFL). Exige fontTools apenas para regerar."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'assets/fonts/Bravura.otf')
glyph_set, cmap = font.getGlyphSet(), font.getBestCmap()
codes = {'percussionClef': 0xE069, 'noteheadBlack': 0xE0A4,
         'flag8': 0xE240, 'flag16': 0xE242, 'flag32': 0xE244,
         'rest4': 0xE4E5, 'rest8': 0xE4E6, 'rest16': 0xE4E7, 'rest32': 0xE4E8}
codes.update({f'time{n}': 0xE080 + n for n in range(10)})
glyphs = {}
for name, code in codes.items():
    glyph = glyph_set[cmap[code]]
    pen, bounds = SVGPathPen(glyph_set), BoundsPen(glyph_set)
    glyph.draw(pen)
    glyph.draw(bounds)
    glyphs[name] = {'path': pen.getCommands(), 'bounds': bounds.bounds}
(root / 'src/data/music-glyphs.json').write_text(json.dumps({
    'source': 'Bravura — Steinberg Media Technologies, SIL Open Font License 1.1',
    'unitsPerEm': font['head'].unitsPerEm, 'glyphs': glyphs
}, separators=(',', ':')) + '\n')
print(f'{len(glyphs)} contornos musicais Bravura extraídos.')
