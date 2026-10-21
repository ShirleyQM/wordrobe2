from PIL import Image,ImageFilter
from pathlib import Path
from collections import defaultdict
import json,math,hashlib
root=Path(__file__).parent
def simplify(points,epsilon):
 if len(points)<3:return points
 a,b=points[0],points[-1];vx,vy=b[0]-a[0],b[1]-a[1];den=math.hypot(vx,vy)
 distances=[abs(vx*(a[1]-p[1])-(a[0]-p[0])*vy)/den if den else math.hypot(p[0]-a[0],p[1]-a[1]) for p in points[1:-1]]
 if not distances or max(distances)<=epsilon:return [a,b]
 k=distances.index(max(distances))+1
 return simplify(points[:k+1],epsilon)[:-1]+simplify(points[k:],epsilon)
def contours(im,keep):
 # Dilate alpha before simplification, preserving a small safe margin around painted edges.
 mask=im.getchannel('A').filter(ImageFilter.MaxFilter(9)).resize((313,559),Image.Resampling.NEAREST)
 w,h=mask.size;data=list(mask.getdata());on=lambda x,y:0<=x<w and 0<=y<h and data[y*w+x]>16
 edges=defaultdict(list)
 for y in range(h):
  for x in range(w):
   if not on(x,y):continue
   if not on(x,y-1):edges[(x,y)].append((x+1,y))
   if not on(x+1,y):edges[(x+1,y)].append((x+1,y+1))
   if not on(x,y+1):edges[(x+1,y+1)].append((x,y+1))
   if not on(x-1,y):edges[(x,y+1)].append((x,y))
 loops=[]
 while edges:
  start=next(iter(edges));points=[start];current=start
  for _ in range(10000):
   if current not in edges:break
   nxt=edges[current].pop()
   if not edges[current]:del edges[current]
   points.append(nxt);current=nxt
   if current==start:break
  if len(points)>8 and current==start:
   area=abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(points,points[1:])))/2
   if area>50:loops.append((area,points))
 results=[]
 for _,points in sorted(loops,reverse=True)[:keep]:
  points=[(p[0]*3,p[1]*3) for p in points];far=max(range(len(points)-1),key=lambda i:math.dist(points[i],points[0]));epsilon=2
  while True:
   simple=simplify(points[:far+1],epsilon)[:-1]+simplify(points[far:],epsilon)[:-1]
   if len(simple)<85:break
   epsilon+=.5
  results.append('M'+' L'.join(f'{x} {y}' for x,y in simple)+' Z')
 return results
items=[]
for item_id in ['navy-shirt','suede-skirt','ankle-boots','coin-loafers']:
 folder=root/'items'/item_id
 if not (folder/'item.json').exists():continue
 item=json.loads((folder/'item.json').read_text(encoding='utf-8-sig'));im=Image.open(folder/'display.png').convert('RGBA')
 x,y,w,h=item['bounds'];item['bounds']=[max(0,x-6),max(0,y-6),w+12,h+12];item['contours']=contours(im,2 if item['slot']=='shoes' else 1);item['defaultVisible']=item_id!='coin-loafers'
 if item['slot']=='shoes':item['hideBodyFrom']=1500 if item_id=='ankle-boots' else 1600
 items.append(item)
collection={'version':1,'body':'references/body.png','bodyHash':hashlib.sha256((root/'references/body.png').read_bytes()).hexdigest(),'canvas':[939,1676],'requireWearablePartition':True,'items':items}
(root/'collection.json').write_text(json.dumps(collection,ensure_ascii=False,indent=2),encoding='utf8');print('Collection',[(i['id'],len(i['contours'])) for i in items])
