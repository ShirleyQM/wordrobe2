from PIL import Image,ImageOps
from pathlib import Path
import numpy as np,json,sys
root=Path(__file__).parent;item=sys.argv[1];name=sys.argv[2] if len(sys.argv)>2 else 'lineart-original.png';folder=root/'items'/item
im=Image.open(folder/name).convert('RGBA');p=np.array(im);layer=Image.new('RGBA',(939,1676));records=[]
for side,(start,end,center) in enumerate([(0,im.width//2,402),(im.width//2,im.width,538)]):
 a=p[:,start:end,3];ys,xs=np.where(a>80);box=[int(xs.min()+start),int(ys.min()),int(xs.max()+start+1),int(ys.max()+1)];shoe=im.crop(box);q=np.array(shoe)
 def row_center(f):
  row=min(shoe.height-1,int(shoe.height*f));x=np.where(q[row,:,3]>100)[0];return float((x.min()+x.max())/2) if len(x) else shoe.width/2
 delta=row_center(.8)-row_center(.15);mirror=(delta<0) if side==0 else (delta>0)
 if mirror:shoe=ImageOps.mirror(shoe);q=np.array(shoe)
 anchor=row_center(.15)
 width,height,top=(112,225,1436) if item=='ankle-boots' else (109,128,1533)
 left=round(center-anchor*width/shoe.width);registered=shoe.resize((width,height),Image.Resampling.LANCZOS);layer.alpha_composite(registered,(left,top));records.append({'side':side,'source_bounds':box,'mirror_x':bool(mirror),'source_ankle_x':anchor,'destination':[left,top,width,height]})
target='lineart' if 'lineart' in name else 'display';layer.save(folder/(target+'.png'));(folder/(target+'-registration.json')).write_text(json.dumps(records,indent=2))
body=Image.open(root/'../gentle-campus-v1/base-open-arms-v2-clean.png').convert('RGBA');body.paste((0,0,0,0),(0,1500 if item=='ankle-boots' else 1600,939,1676));proof=Image.new('RGBA',body.size,'#eff4fb');proof.alpha_composite(body);proof.alpha_composite(layer);proof.save(folder/(target+'-tryon.png'));print(target,layer.getbbox(),records)
