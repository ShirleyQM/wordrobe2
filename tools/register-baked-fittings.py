from pathlib import Path
from PIL import Image
import json,sys
root=Path(__file__).resolve().parent.parent;folder=Path(sys.argv[1])
collection=json.loads((folder/'pending-collection.json').read_text(encoding='utf8'))
code=(root/'assets/atelier-preppy-v1/build-collection.py').read_text(encoding='utf8').split('items=[]')[0].replace('len(points)>8','len(points)>3').replace('area>50','area>1')
scope={'__file__':str(root/'assets/atelier-preppy-v1/build-collection.py')};exec(code,scope)
for item in collection['items']:
 if item.get('fitStatus')!='baked':continue
 im=Image.open(root/item['sourceImage'].lstrip('/')).convert('RGBA');x0,y0,x1,y1=im.getbbox()
 item['bounds']=[max(0,x0-6),max(0,y0-6),min(939,x1+6)-max(0,x0-6),min(1676,y1+6)-max(0,y0-6)]
 item['contours']=scope['contours'](im,8)
(folder/'registered-collection.json').write_text(json.dumps(collection,ensure_ascii=False,indent=2),encoding='utf8')
