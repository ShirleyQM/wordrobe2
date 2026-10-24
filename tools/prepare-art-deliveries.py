"""Validate completed art packages and prepare append-only wardrobe entries.

Does not write catalogs or published user data; the server commits metadata.
"""
from pathlib import Path
from PIL import Image
import json, hashlib, shutil, re, sys, math

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/materials'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def inside(base,relative):
    p=(base/relative).resolve()
    if not p.is_relative_to(base.resolve()): raise ValueError('source escapes delivery')
    return p
def url(p): return '/'+p.relative_to(ROOT).as_posix()
code=(ROOT/'assets/atelier-preppy-v1/build-collection.py').read_text(encoding='utf8').split('items=[]')[0].replace('len(points)>8','len(points)>3').replace('area>50','area>1')
scope={'__file__':str(ROOT/'assets/atelier-preppy-v1/build-collection.py')};exec(code,scope)
known={i['id'] for i in read(BASE/'garments/collection.json')['items']}
prepared=[];errors=[]
for manifest_path in json.loads(sys.argv[1]):
    manifest_path=Path(manifest_path);package=manifest_path.parent
    try:
        data=read(manifest_path)
        layered=(data.get('status')=='delivered-for-manual-fitting' or data.get('kind')=='approved-layered-registered-import') and data.get('technicalPass') is True
        front_only=data.get('kind','').startswith('approved-front-only-')
        registered=data.get('kind') in {'approved-front-only-registered-import','approved-layered-registered-import'}
        if not (layered or front_only): continue
        rows=data['items'];expected=data.get('itemCount',data.get('count'))
        if not rows or expected!=len(rows) or len({r['id'] for r in rows})!=len(rows): raise ValueError('incomplete item list')
        batch=package.name
        if not re.fullmatch('[a-zA-Z0-9_-]+',batch):raise ValueError('invalid batch name')
        pending=[r for r in rows if r['id'] not in known]
        # Check every pending source before any files are written.
        validated=[]
        for row in pending:
            identity=row['id']
            if not re.fullmatch('[a-z0-9-]+',identity):raise ValueError('invalid item ID')
            home=inside(package,row.get('directory','.'))
            source=inside(home,row['front']);original=Image.open(source).convert('RGBA')
            expected_hash=row.get('sha256',row.get('sourceSha256'))
            if layered:
                qa=read(home/'qa.json')
                if qa.get('technicalPass') is not True:raise ValueError(identity+': layers not ready')
                for layer in qa['canvasAndLayers'].values():
                    if sha(inside(package,layer['path']))!=layer['sha256']:raise ValueError(identity+': layer hash mismatch')
                expected_hash=qa['canvasAndLayers']['front']['sha256']
            if not expected_hash or sha(source)!=expected_hash:raise ValueError(identity+': hash mismatch')
            if not original.getbbox() or original.getchannel('A').getextrema()[0]!=0:raise ValueError(identity+': transparent art required')
            if layered and original.size!=(939,1676):raise ValueError(identity+': wrong canvas')
            if front_only and list(original.size)!=row.get('originalSize'):raise ValueError(identity+': wrong original size')
            if registered and (original.size!=(939,1676) or row.get('canvas')!=[939,1676] or row.get('registrationProvided') is not True):raise ValueError(identity+': invalid registered canvas')
            paired=registered and row.get('wearablePartition') is True
            backsource=inside(home,row['back']) if layered or paired else None
            if backsource and Image.open(backsource).size!=(939,1676):raise ValueError(identity+': wrong back canvas')
            if paired and (not row.get('backSha256') or sha(backsource)!=row['backSha256']):raise ValueError(identity+': back hash mismatch')
            validated.append((row,home,source,original,backsource))
        if not validated:continue
        archive=BASE/'sources/deliveries'/batch
        # Preserve full material layers/provenance for future recolor and material controls.
        if package.resolve().is_relative_to(ROOT.resolve()):archive=package
        else:
            archive.mkdir(parents=True,exist_ok=True)
            for src in package.rglob('*'):
                if src.is_file() and src.suffix.lower() in {'.png','.json','.txt','.md'}:
                    dst=archive/src.relative_to(package);dst.parent.mkdir(parents=True,exist_ok=True)
                    if not dst.exists():shutil.copyfile(src,dst)
        for row,home,source,original,backsource in validated:
            identity=row['id'];slot=row.get('slot','dress')
            if slot not in ['top','bottom','dress','coat','shoes','socks','jewelry','bag','bra','briefs']:raise ValueError('invalid slot')
            folder=BASE/'garments'/identity;folder.mkdir(parents=True,exist_ok=True)
            if layered:
                shutil.copyfile(source,folder/'front.png');shutil.copyfile(backsource,folder/'back.png')
                front=original;placement={'x':0,'y':0,'scale':1,'resampled':False}
            elif registered:
                shutil.copyfile(source,folder/'front.png')
                front=original
                if backsource:shutil.copyfile(backsource,folder/'back.png')
                else:Image.new('RGBA',front.size).save(folder/'back.png')
                placement={'x':0,'y':0,'scale':1,'resampled':False,'method':'provided registered canvas'}
            else:
                # Preserve ratio; rough waist/shoulder placement remains editable by the user.
                scale=min(1,350/original.width,950/original.height) if slot=='bottom' else min(1,800/original.width,1300/original.height)
                art=original if scale==1 else original.resize((round(original.width*scale),round(original.height*scale)),Image.Resampling.LANCZOS)
                x=(939-art.width)//2;y=650 if slot=='bottom' else 300
                front=Image.new('RGBA',(939,1676));front.paste(art,(x,y));front.save(folder/'front.png')
                Image.new('RGBA',front.size).save(folder/'back.png')
                placement={'x':x,'y':y,'scale':scale,'resampled':scale!=1,'method':'uniform scale and translation'}
            display=Image.alpha_composite(Image.open(folder/'back.png').convert('RGBA'),front)
            display.save(folder/'display.png')
            preview=Image.open(inside(home,row['thumbnailSource'])).convert('RGBA') if row.get('thumbnailSource') else display
            thumb=preview.crop(preview.getbbox());thumb.thumbnail((320,320),Image.Resampling.LANCZOS)
            tile=Image.new('RGBA',(340,340));tile.paste(thumb,((340-thumb.width)//2,(340-thumb.height)//2));tile.save(folder/'thumb.png')
            x0,y0,x1,y1=display.getbbox();contours=scope['contours'](front,12)
            if not contours:raise ValueError(identity+': no contour')
            archived_home=archive/home.relative_to(package)
            entry={'id':identity,'name':row['name'],'slot':slot,'body':row.get('body','open-arms-v2'),
                'front':url(folder/'front.png'),'back':url(folder/'back.png'),'thumbnail':url(folder/'thumb.png'),
                'bounds':[max(0,x0-6),max(0,y0-6),x1-x0+12,y1-y0+12],'contours':contours,'defaultVisible':True,
                'sourceSha256':sha(folder/'front.png'),'originalSha256':sha(source),'sourceImage':url(archive/source.relative_to(package)),
                'sourceRevision':batch,'sourceCollection':batch,'fitStatus':'unfitted','registrationStatus':'pending-manual',
                'wearable_validated':False,'recolor_ready':bool(layered),'initialPlacement':placement,
                'preserveAspectRatio':True,'allowAutomaticWarp':False,'layerMode':'painted-partition' if layered or backsource else 'front-only',
                'backTechnicalPlaceholder':not bool(layered or backsource),'displayMetadata':False}
            if registered:
                entry.update({'fitStatus':'registered','registrationStatus':'provided','registrationProvided':True,'offlineWearableValidated':row.get('offlineWearableValidated') is True,'runtimeValidated':False})
                entry['hideBodyFrom']=max(0,min(1676,int(row.get('hideBodyFrom') or 0)))
                entry['bodyOcclusionRects']=row.get('bodyOcclusionRects',[])
                entry['accessoryType']=row.get('accessoryType')
                entry['recommendedUnderlayer']=row.get('recommendedUnderlayer')
            if row.get('thumbnailSource'):entry['catalogPreview']=url(archive/inside(home,row['thumbnailSource']).relative_to(package))
            for key in ['category','material']:
                if key in row:entry[key]=row[key]
            if layered:
                entry['materialManifest']=url(archived_home/'material.json')
                entry['lineart']=url(archived_home/'lineart.png')
                entry['materialPresets']=url(archive/'material-presets.json')
            prepared.append(entry);known.add(identity)
    except Exception as e: errors.append({'package':str(manifest_path),'error':str(e)})
print(json.dumps({'items':prepared,'errors':errors},ensure_ascii=True))
