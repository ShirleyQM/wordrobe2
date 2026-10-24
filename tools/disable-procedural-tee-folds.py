"""Remove runtime fold effects without rewriting any garment or fitting data."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
p = root / 'assets/garment-prints/editor.js'
s = p.read_text(encoding='utf-8')
s = s.replace("if(item.id.startsWith('tee-'))warpTeePrint(ctx,item,b);", '')
s = re.sub(r'^function warpTeePrint\(.*\n', '', s, flags=re.M)
p.write_text(s, encoding='utf-8')

p = root / 'print.js'
s = p.read_text(encoding='utf-8')
s = s.replace('folds:45', 'folds:0')
s = s.replace('draft.folds=Math.max(0,Math.min(100,Number(draft.folds)||0));', 'draft.folds=0;')
s = s.replace('function fabricDefs(){const map=getFabric();', 'function fabricDefs(){')
s = re.sub(r'<filter id="fabric-warp".*?</filter>', '', s)
s = s.replace('seams=garmentSeams(),map=getFabric();', 'seams=garmentSeams();')
s = s.replace('<g filter="url(#fabric-warp)">', '<g>')
s = re.sub(r'<image id="fabric-shadow"[^>]+/>', '', s)
s = s.replace("document.querySelector('#fabric-folds').value=draft.folds;", '')
s = s.replace("[['fabric-texture','texture'],['fabric-folds','folds']]", "[['fabric-texture','texture']]")
s = s.replace("svg.querySelector('#fabric-shadow').setAttribute('opacity',draft.folds/100);svg.querySelector('feDisplacementMap').setAttribute('scale',18*draft.folds/100);", '')
p.write_text(s, encoding='utf-8')

p = root / 'print.html'
s = p.read_text(encoding='utf-8')
s = re.sub(r'<label>褶皱<input id="fabric-folds"[^>]+></label>', '', s)
p.write_text(s, encoding='utf-8')
print('Disabled procedural tee folds; garment sources and saved fitting data untouched.')
