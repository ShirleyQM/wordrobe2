"""Read-only raster measurements. Does not edit images or create new image pixels."""
from pathlib import Path
from PIL import Image
import numpy as np,json
root=Path(__file__).parent
base=Image.open(root/'base-no-bangs.png').convert('RGB')
look=Image.open(root/'campus-complete.png').convert('RGB')
a=np.asarray(base.convert('L'),dtype=float)
b=np.asarray(look.convert('L'),dtype=float)
regions={'left_eye':[411,166,450,194],'right_eye':[488,166,528,194],
 'left_hand':[247,823,294,902],'right_hand':[644,823,689,902],
 'left_knee':[360,1110,404,1170],'right_knee':[539,1110,581,1170]}
results=[]
for name,(x0,y0,x1,y1) in regions.items():
 template=a[y0:y1,x0:x1];centered=template-template.mean();norm=np.linalg.norm(centered)
 best=(-2,None,None)
 for dy in range(-12,13):
  for dx in range(-12,13):
   patch=b[y0+dy:y1+dy,x0+dx:x1+dx];p=patch-patch.mean()
   score=float(np.sum(centered*p)/(norm*np.linalg.norm(p)+1e-9))
   if score>best[0]:best=(score,dx,dy)
 results.append({'region':name,'base_rect':regions[name],'best_ncc':round(best[0],4),'dx':best[1],'dy':best[2],
  'interpretation':'local texture correspondence only; not a silhouette or production-layer certification'})
report={'master_size':list(base.size),'look_size':list(look.size),'same_canvas':base.size==look.size,
 'reference_only':True,'production_layers_status':'not exported; transparent extraction rejected for scale drift',
 'measurements':results,'method':'normalized grayscale template correlation within +/-12 pixels; low scores require visual review; visible makeup and shading may differ'}
(root/'alignment-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
