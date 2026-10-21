from pathlib import Path
from PIL import Image
import json,hashlib,zipfile
import numpy as np
root=Path(__file__).parent;collection=json.loads((root/'collection.json').read_text(encoding='utf8'));results=[]
assert len(collection['items'])==4
for item in collection['items']:
 folder=root/'items'/item['id'];qa=json.loads((folder/'qa.json').read_text(encoding='utf-8-sig'));assert qa['technical_pass'] and qa['visual_reviewed'] and qa['wearable_validated']
 assert qa['layer_sha256']==hashlib.sha256((folder/'front.png').read_bytes()).hexdigest()
 for prefix,display in [('', 'display.png'),('lineart-','lineart.png')]:
  front=np.array(Image.open(folder/(prefix+'front.png')).convert('RGBA'));back=np.array(Image.open(folder/(prefix+'back.png')).convert('RGBA'));original=np.array(Image.open(folder/display).convert('RGBA'))
  assert original.shape==(1676,939,4)
  assert np.array_equal(front[:,:,3].astype(int)+back[:,:,3],original[:,:,3])
  assert np.array_equal(front[:,:,:3],original[:,:,:3]) and np.array_equal(back[:,:,:3],original[:,:,:3])
 results.append({'id':item['id'],'front_sha256':qa['layer_sha256'],'technical_pass':True,'visual_reviewed':True,'wearable_validated':True,'recolor_ready':False})
report={'canvas':[939,1676],'body_sha256':collection['bodyHash'],'count':len(results),'items':results,'runtime':'Independent raster asset fitting panel; no learning/reward integration.','browser_checks':['symmetric mesh drag deforms source pixels','undo/redo','reload persistence','curve handle conversion','four items and mutually exclusive shoe variants','single-item transparent PNG download','390px layout without horizontal overflow'],'evidence':['panel-preview.png','collection-preview.png','look-ankle-boots.png','look-coin-loafers.png']}
(root/'qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
target=root/'preppy-assets.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for file in sorted(root.rglob('*')):
  if file.is_file() and file.suffix!='.zip' and '__pycache__' not in file.parts:z.write(file,'atelier-preppy-v1/'+file.relative_to(root).as_posix())
print('Validated and packed',len(results),'items;',target.stat().st_size,'bytes')
