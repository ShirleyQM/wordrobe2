"""Copy an auditable, categorized snapshot without changing the live wardrobe or art."""
from pathlib import Path
import collections, csv, hashlib, html, json, re, shutil
from datetime import datetime, timezone
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/wardrobe-organized'
def read(p,default=None):
    try:return json.loads(p.read_text(encoding='utf-8-sig'))
    except (FileNotFoundError,json.JSONDecodeError):return default
def write(p,data):p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def rel(p):return p.relative_to(ROOT).as_posix()
def local(value,base=ROOT):
    if not isinstance(value,str):return None
    value=value.replace('\\','/').split('?')[0]
    if value.startswith('/assets/') or value.startswith('assets/'):p=ROOT/value.lstrip('/')
    elif re.match(r'^[A-Za-z]:/',value):p=Path(value)
    else:p=base/value
    if not p.is_file() and '/assets/live-wardrobe/' in '/'+value:p=ROOT/'assets/materials/published'/Path(value).name
    if not p.is_file():return None
    try:p.resolve().relative_to(ROOT.resolve())
    except ValueError:return None
    return p.resolve()
def name(s):return re.sub(r'[<>:"/\\|?*\x00-\x1f]','_',s).strip(' .')[:70]
def category(i):
    slot=i.get('slot');text=i['name']+' '+i['id']
    if slot=='bottom':
        if re.search(r'裤|pants|trouser|jogger|jeans',text,re.I):return '03-下装/'+('短裤' if re.search(r'短裤|shorts',text,re.I) else '长裤')
        return '03-下装/'+('短裙' if re.search(r'短裙|mini|short-',text,re.I) else '长裙')
    return {'top':'01-上装','coat':'02-外套','dress':'04-连衣裙','bra':'05-内衣','briefs':'06-内裤','socks':'07-袜子','shoes':'08-鞋履','jewelry':'09-首饰与发饰','bag':'10-包袋'}.get(slot,'11-其他')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    items=read(ROOT/'assets/materials/garments/collection.json')['items'];wardrobe_ids={i['id'] for i in items}
    # Include the standalone accessory art delivered in this chat, without publishing it.
    for extra in read(ROOT/'assets/atelier-accessories-v1/manifest.json',{}).get('items',[]):
        if extra['id'] in wardrobe_ids:continue
        base=ROOT/'assets/atelier-accessories-v1'
        items.append({'id':extra['id'],'name':extra['name'],'slot':'bag' if extra['id']=='heart-chain-bag' else 'jewelry','front':rel(base/extra['image']),'back':None,'lineart':rel(base/extra['lineart']),'unimported':True,'archiveCategory':'12-未接入饰品','sourceCollection':'atelier-accessories-v1'})
    # Loose user-supplied PNGs belong in the same browsing directory. Copy their
    # original bytes; grouping them does not replace an existing fitted garment.
    loose_specs={
        '工装短裙.png':('root-cargo-skort','腰带贴袋工装裙裤','bottom','03-下装/短裙'),
        '金扣短裙.png':('root-button-mini','双排扣 A 字短裙','bottom','03-下装/短裙'),
        '精修工装外套.png':('root-cargo-jacket','翻领短袖工装外套','coat','02-外套'),
        '卡其半裙.png':('root-cargo-midi','腰带贴袋直筒半裙','bottom','03-下装/长裙'),
        '浅蓝运动短裤.png':('root-sport-shorts','松紧腰运动短裤','bottom','03-下装/短裤'),
        'miu黑工装短裙.png':('root-zip-cargo-mini','抽褶拉链工装短裙','bottom','03-下装/短裙'),
        'miu牛仔短裙白色系带.png':('root-tie-denim-mini','系带牛仔短裙','bottom','03-下装/短裙'),
    }
    for p in sorted((ROOT/'assets').glob('*.png')):
        spec=loose_specs.get(p.name)
        if spec:
            id,label,slot,cat=spec
            label=p.stem
        else:
            id='root-png-'+hashlib.sha256(p.name.encode('utf-8')).hexdigest()[:12]
            label=p.stem;slot='coat' if '外套' in label else 'dress' if '连衣裙' in label else 'bottom' if re.search(r'裙|裤',label) else 'top'
            cat=category({'id':id,'name':label,'slot':slot})
        if id not in {i['id'] for i in items}:items.append({'id':id,'name':label,'slot':slot,'front':rel(p),'back':None,'unimported':True,'archiveCategory':cat,'sourceCollection':'assets 根目录 PNG','sourceName':p.name})
    ids={i['id'] for i in items}
    notes=read(ROOT/'assets/materials/published/garment-notes.json',{}).get('items',{})
    visibility=read(ROOT/'assets/materials/published/visibility.json',{}).get('items',{})
    deleted=read(ROOT/'assets/materials/published/deleted-garments.json',{}).get('items',{})
    # Same precedence as the main wardrobe: library, materials, then current fittings.
    effective={i['id']:dict(i) for i in items}
    for file in ['assets/materials/sources/imported/catalog.json','assets/materials/published/preppy.json','assets/materials/published/fittings.json']:
        for i in read(ROOT/file,{}).get('items',[]):
            if i['id'] in effective:effective[i['id']].update(i)
    candidates=collections.defaultdict(set);all_lines=set();assigned=set();metadata=[]
    for p in (ROOT/'assets').rglob('*.png'):
        if OUT in p.parents or 'characters' in p.parts or any(k in p.parts for k in ['patterns','extracted-motifs-v1','script-lettering-v1']):continue
        if not re.search(r'lineart|line-art|(?<![a-z])ink(?![a-z])',p.name,re.I):continue
        if re.search(r'tryon|proof|detail|fitting-reference|contact|preview|recolor',p.name,re.I):continue
        p=p.resolve();all_lines.add(p)
        matches=set(p.parts)&ids
        for id in matches:candidates[id].add(p)
        if not matches:
            matches={id for id in ids if p.stem.startswith(id+'-') or p.stem==id}
            for id in matches:candidates[id].add(p)
    # Explicit source records cover job UUID directories and flat filename imports.
    for p in (ROOT/'assets/materials/regeneration/jobs').glob('*/job.json'):
        job=read(p,{});id=job.get('itemId')
        if id in ids:
            for line in all_lines:
                if p.parent in line.parents:candidates[id].add(line)
    def records(value,base):
        if isinstance(value,dict):
            id=value.get('id') or value.get('itemId')
            if id in ids:
                def paths(v):
                    if isinstance(v,str):
                        p=local(v,base)
                        if p in all_lines:candidates[id].add(p)
                    elif isinstance(v,dict):
                        for x in v.values():paths(x)
                    elif isinstance(v,list):
                        for x in v:paths(x)
                paths(value)
            for v in value.values():
                if isinstance(v,(dict,list)):records(v,base)
        elif isinstance(value,list):
            for v in value:records(v,base)
    for p in (ROOT/'assets').rglob('*.json'):
        if OUT in p.parents or 'characters' in p.parts or 'published' in p.parts:continue
        if p.stat().st_size>5_000_000:continue
        if p.name in ['catalog.json','collection.json','manifest.json','item.json','batch.json','generation.json','material.json'] or p.name.endswith('-items.json'):
            records(read(p,{}),p.parent)
    for i in items:
        if i.get('materialManifest'):
            m=local(i['materialManifest'])
            if m and (m.parent/'lineart.png').is_file():candidates[i['id']].add((m.parent/'lineart.png').resolve())
    rows=[];missing=[]
    for original in items:
        id=original['id'];i=effective[id];cat=original.get('archiveCategory') or category(original);folder=Path(cat)/(id+'__'+name(original['name']));d=OUT/folder;d.mkdir(parents=True,exist_ok=True)
        front=local(i.get('image') or i.get('runtimeFront') or i.get('front'));back=local(i.get('runtimeBack') or i.get('back'))
        if not front:missing.append({'id':id,'path':i.get('image') or i.get('front')});continue
        shutil.copy2(front,d/'当前前片.png')
        if back:shutil.copy2(back,d/'当前后片.png')
        combined=Image.open(front).convert('RGBA')
        if back:
            bi=Image.open(back).convert('RGBA')
            if bi.size==combined.size:bi.alpha_composite(combined);combined=bi
        combined.save(d/'当前彩图.png');thumb=combined.crop(combined.getbbox()) if combined.getbbox() else combined
        catalog_preview=local(i.get('catalogPreview'))
        if catalog_preview:
            preview=Image.open(catalog_preview).convert('RGBA')
            if preview.getbbox():thumb=preview.crop(preview.getbbox())
        thumb.thumbnail((400,460),Image.Resampling.LANCZOS);thumb.save(d/'预览.png')
        seen=set();lines=[]
        for p in sorted(candidates[id],key=lambda p:(not('original' in p.name),str(p))):
            h=digest(p)
            if h in seen:continue
            seen.add(h);assigned.add(p)
            material='material' in p.parts or (p.parent/'material.json').is_file()
            if material:kind='材质线条层'
            elif 'original' in p.name or 'atelier-unified-v2' in p.parts or 'atelier-preppy-v1' in p.parts or 'atelier-accessories-v1' in p.parts:kind='独立原始线稿'
            else:kind='线稿文件（来源待核对）'
            target=d/'线稿'/f'{len(lines)+1:02d}-{kind}-{p.name}';target.parent.mkdir(exist_ok=True);shutil.copy2(p,target)
            preview=Image.open(p).convert('RGBA');bbox=preview.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()
            if bbox:preview=preview.crop(bbox)
            preview.thumbnail((400,460),Image.Resampling.LANCZOS);preview_path=d/'线稿'/f'{len(lines)+1:02d}-预览.png';preview.save(preview_path)
            lines.append({'file':target.relative_to(OUT).as_posix(),'preview':preview_path.relative_to(OUT).as_posix(),'source':rel(p),'sha256':h,'kind':kind})
        status='独立原始线稿' if any(x['kind']=='独立原始线稿' for x in lines) else '线稿文件（来源待核对）' if any(x['kind'].startswith('线稿文件') for x in lines) else '仅材质线条层' if lines else '未找到线稿'
        record={'id':id,'name':original['name'],'slot':original['slot'],'category':cat,'inWardrobe':id in wardrobe_ids,'folder':folder.as_posix(),'image':(folder/'当前彩图.png').as_posix(),'thumbnail':(folder/'预览.png').as_posix(),'lineartStatus':status,'linearts':lines,'basicTemplate':'基础款' in notes.get(id,{}).get('tags',[]),'shown':visibility.get(id) is True,'deleted':deleted.get(id,{}).get('deleted') is True,'sourceFront':rel(front),'sourceFrontSha256':digest(front),'sourceBack':rel(back) if back else None,'sourceCollection':original.get('sourceCollection'),'matchingSet':original.get('matchingSet'),'notes':notes.get(id,{}),'lineartMatchesCurrentFitting':None,'caution':'线稿按稳定 ID 和来源记录关联；历史线稿不自动视为与当前手调版型一致。材质线条层不等同原始线稿。'}
        write(d/'来源与线稿.json',record);rows.append(record)
    # Keep unassociated references discoverable, without guessing their garment ID.
    unmatched=[{'source':rel(p),'sha256':digest(p)} for p in sorted(all_lines) if not any(p in candidates[id] for id in ids)]
    summary={'total':len(rows),'inWardrobe':len(wardrobe_ids),'standalone':len(rows)-len(wardrobe_ids),'garments':sum(r['slot'] in ['top','coat','bottom','dress','bra','briefs'] for r in rows),'categories':dict(collections.Counter(r['category'] for r in rows)),'lineart':dict(collections.Counter(r['lineartStatus'] for r in rows)),'basicTemplates':sum(r['basicTemplate'] for r in rows),'deleted':sum(r['deleted'] for r in rows),'missingCurrentImages':missing,'unmatchedLineartFiles':len(unmatched),'builtAt':datetime.now(timezone.utc).isoformat()}
    write(OUT/'清点结果.json',{'summary':summary,'items':rows});write(OUT/'未匹配线稿来源.json',unmatched)
    write(OUT/'基础款-diversity清单.json',[r for r in rows if r['basicTemplate']])
    with (OUT/'线稿清单.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['稳定ID','名称','类别','线稿情况','线稿文件数','基础款','已展示','已删除','文件夹','当前前片来源'])
        for r in rows:w.writerow([r['id'],r['name'],r['category'],r['lineartStatus'],len(r['linearts']),r['basicTemplate'],r['shown'],r['deleted'],r['folder'],r['sourceFront']])
    page=(ROOT/'tools/wardrobe-inventory-template.html').read_text(encoding='utf-8').replace('__INVENTORY_DATA__',json.dumps({'summary':summary,'items':rows},ensure_ascii=False).replace('<','\\u003c'))
    (OUT/'index.html').write_text(page,encoding='utf-8')
    (OUT/'打开衣服目录.html').write_text(page,encoding='utf-8')
    (OUT/'说明.txt').write_text('打开 index.html 可按类别、线稿情况、基础款及套装筛选。\n分类子文件夹保留当前彩图、前后片、线稿和来源记录；原素材没有移动。\n基础款复用衣橱备注中的同名标记。通过本地服务打开目录时可实时勾选；直接双击 HTML 时可浏览导出快照。\n基础款-diversity清单.json 是导出时的快照；目录页可导出当前实时标记。\n线稿可能是历史轮廓，未宣称已适配当前手调彩图；仅材质线条层不算原始独立线稿。\n重新整理：运行 tools/build_wardrobe_inventory.py。\n',encoding='utf-8-sig')
    print(json.dumps(summary,ensure_ascii=False))
    if missing:raise SystemExit(1)

if __name__=='__main__':build()
