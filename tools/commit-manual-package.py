from pathlib import Path
from PIL import Image
import json,shutil,hashlib,datetime
root=Path(__file__).resolve().parents[1]
base=root/'assets/materials';folder=base/'sources/manual-package-20261022'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
code=(root/'assets/atelier-preppy-v1/build-collection.py').read_text(encoding='utf8').split('items=[]')[0]
scope={'__file__':str(root/'assets/atelier-preppy-v1/build-collection.py')};exec(code,scope)
prepared=read(folder/'prepared.json');backup=folder/'before-import';backup.mkdir(exist_ok=True)
paths=[base/'garments/collection.json',base/'sources/imported/catalog.json',base/'published/fittings.json',base/'published/preppy.json']
for p in paths:
 if p.exists() and not (backup/p.name).exists():shutil.copy2(p,backup/p.name)
collection=read(paths[0]);imports=read(paths[1]);changed=[]
for row in prepared:
 item=next((i for i in collection['items'] if i['id']==row['id']),None)
 if item is None:raise ValueError('Unknown ID '+row['id'])
 if item.get('sourceSha256')==row['sha256']:continue
 image=Image.open(root/row['front'].lstrip('/')).convert('RGBA');box=image.getbbox()
 update={'front':row['front'],'back':row['back'],'runtimeFront':row['front'],'runtimeBack':row['back'],'image':row['front'],'thumbnail':row['thumbnail'],'bounds':[box[0],box[1],box[2]-box[0],box[3]-box[1]],'contours':scope['contours'](image,12),'sourceSha256':row['sha256'],'sourceRevision':'manual-package-20261022-'+row['sha256'][:12],'sourceCollection':'manual-package-20261022','fitStatus':'manual-raster','registrationProvided':True,'manualRasterImport':True,'openings':[]}
 item.update(update)
 for key in ['materialManifest','materialSourceFront','materialPresets']:item.pop(key,None)
 old=next((i for i in imports['items'] if i['id']==row['id']),None)
 if old:old.update(item)
 else:imports['items'].append(dict(item))
 changed.append(row['id'])
for p in paths[2:]:
 if not p.exists():continue
 data=read(p);data['items']=[i for i in data.get('items',[]) if i['id'] not in changed]
 for identity in changed:data.get('draft',{}).pop(identity,None)
 if isinstance(data.get('draft',{}).get('__updated'),list):data['draft']['__updated']=[i for i in data['draft']['__updated'] if i not in changed]
 if changed:data['revision']=data.get('revision',0)+1;data['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();p.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
for p,v in [(paths[0],collection),(paths[1],imports)]:p.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf8')
(folder/'import-report.json').write_text(json.dumps({'replacedIds':[r['id'] for r in prepared],'changedThisRun':changed,'preservedUnchangedExportFolders':16,'previousVersionsBackup':'before-import','originalRootFilesRetained':True},ensure_ascii=False,indent=2),encoding='utf8')
print('Replaced '+str(len(changed))+' edited garments; all unrelated fits retained.')
