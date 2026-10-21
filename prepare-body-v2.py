from collections import deque
from pathlib import Path
import json
from PIL import Image
import numpy as np

root = Path(__file__).parent / 'assets/gentle-campus-v1'
im = Image.open(root / 'base-open-arms-v2.png').convert('RGBA')
p = np.array(im)
rgb = p[:, :, :3].astype(int)
white = (rgb.min(2) > 215) & ((rgb.max(2) - rgb.min(2)) < 18)
white[140:280, 375:565] = False  # keep eye whites and face highlights
p[white, 3] = 0
mask = p[:, :, 3] > 12
h, w = mask.shape
seen = np.zeros_like(mask)
queue = deque([(470, 600)])
seen[600, 470] = True
while queue:
    x, y = queue.popleft()
    for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if 0 <= nx < w and 0 <= ny < h and mask[ny,nx] and not seen[ny,nx]:
            seen[ny,nx] = True
            queue.append((nx,ny))
p[~seen, 3] = 0
out = root / 'base-open-arms-v2-clean.png'
Image.fromarray(p).save(out)
report = {'canvas':[w,h], 'source':'base-open-arms-v2.png', 'output':out.name,
          'cleanup':'Remove neutral white background residue, keep torso-connected alpha component; no RGB repaint or spatial transforms.',
          'visible_pixels':int(seen.sum()), 'alpha_extrema':list(Image.open(out).getchannel('A').getextrema())}
(root / 'body-v2-alpha-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False))
