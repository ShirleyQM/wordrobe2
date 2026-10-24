from pathlib import Path
import sys,re,json
sys.path.insert(0,str(Path('.build-tools/python').resolve()))
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(sys.argv[1] if len(sys.argv)>1 else 'exports/cixiu-release-20261024')
text=''.join(p.read_text('utf-8') for p in root.iterdir() if p.suffix in ['.html','.css','.js','.json'])
text=re.sub(r'\\u\{([0-9a-fA-F]+)\}',lambda m:chr(int(m[1],16)),text)
text=re.sub(r'\\u([0-9a-fA-F]{4})',lambda m:chr(int(m[1],16)),text)
options=subset.Options();options.flavor='woff2';options.layout_features=['*'];options.notdef_glyph=True
font=TTFont('assets/fonts/WordrobeSerif.woff2')
sub=subset.Subsetter(options=options);sub.populate(unicodes=set(map(ord,text))|set(range(32,256))|set(range(0x2000,0x2070)));sub.subset(font)
for record in font['name'].names:
 if record.nameID in (1,4,6):
  name='WordrobeAtelierSubset' if record.nameID==6 else 'Wordrobe Atelier Subset'
  record.string=name.encode(record.getEncoding(),errors='replace')
font.flavor='woff2';target=root/'assets/WordrobeSerif.woff2';font.save(target)
print(json.dumps({'original':Path('assets/fonts/WordrobeSerif.woff2').stat().st_size,'subset':target.stat().st_size,'requestedCharacters':len(set(text))}))
