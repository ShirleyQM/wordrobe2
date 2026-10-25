"""Build the user-marked basic silhouette library from the current inventory."""
from pathlib import Path
from datetime import datetime,timezone
from collections import Counter
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/wardrobe-basics';INVENTORY=ROOT/'assets/wardrobe-organized'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf8')
# Observed garment shape takes precedence over an old name/equipment slot.
# id: shelf, fit, sleeve, material, silhouette variant.
RULES={
 'top-v1-white-bardot':('01-上衣/07-露肩上衣','常规','泡泡短袖','棉质','一字肩泡泡袖'),
 'top-v1-blue-ruffle':('01-上衣/05-衬衫','常规','荷叶短袖','棉质','荷叶短款'),
 'top-v1-gray-halter':('01-上衣/02-背心与削肩','贴身','无袖','棉质','珠绣挂脖'),
 'cool-sweat-dropshoulder':('01-上衣/06-卫衣','宽松','落肩长袖','卫衣布','宽领落肩'),
 'cool-sweat-cropzip':('01-上衣/06-卫衣','宽松','常规长袖','卫衣布','翻领拉链超短款'),
 'cool-sweat-asymmetric':('01-上衣/06-卫衣','宽松','常规长袖','卫衣布','不规则斜摆拼接'),
 'runway-oatmeal-halfzip':('01-上衣/06-卫衣','宽松','常规长袖','卫衣布','翻领半拉链'),
 'runway-ivory-camp-blouse':('01-上衣/05-衬衫','宽松','宽短袖','缎面','大翻领短袖'),
 'romantic-cup-bustier':('01-上衣/09-束身胸衣','贴身','无袖','提花棉缎','弧杯系带'),
 'editorial-shell-v1':('01-上衣/02-背心与削肩','贴身','无袖','梭织','无袖收腰'),
 'layered-rainbow-knit-v1':('01-上衣/10-针织衫','常规','常规长袖','针织','彩条短款'),
 'layered-ruched-top-v1':('01-上衣/11-打底长袖','贴身','常规长袖','针织','小高领抽褶'),
 'kg-scoop-knit-v1':('01-上衣/10-针织衫','常规','宽袖长袖','针织','侧扣圆领'),
 'kg-gauze-tie-blouse-v1':('01-上衣/05-衬衫','宽松','喇叭长袖','纱','飘带褶纱'),
 'tops-bandeau-navy':('01-上衣/01-抹胸','贴身','无袖','梭织','直筒分割'),
 'tops-bandeau-denim':('01-上衣/01-抹胸','贴身','无袖','牛仔','纽扣收腰'),
 'tops-bandeau-bow':('01-上衣/01-抹胸','贴身','无袖','梭织','蝴蝶结收腰'),
 'top-v1-green-rib':('01-上衣/02-背心与削肩','贴身','无袖','针织','细肩带直身'),
 'top-v1-ivory-tank':('01-上衣/02-背心与削肩','贴身','无袖','针织','方领短款'),
 'top-v1-butter-cutaway':('01-上衣/02-背心与削肩','贴身','无袖','针织','削肩挂脖'),
 'street-v1-taupe-crop':('01-上衣/02-背心与削肩','贴身','无袖','针织','U领短款'),
 'runway-black-rib-shell':('01-上衣/02-背心与削肩','贴身','无袖','针织','无袖高领'),
 'top-v1-red-henley':('01-上衣/03-T恤与亨利衫','贴身','短袖','针织','短款亨利领'),
 'street-v1-gray-tee':('01-上衣/03-T恤与亨利衫','常规','短袖','棉质','基础圆领'),
 'runway-brown-stripe-tee':('01-上衣/03-T恤与亨利衫','宽松','短袖','棉质','落肩宽版'),
 'top-v1-yellow-polo':('01-上衣/04-Polo衫','贴身','短袖','针织','条纹短袖'),
 'separate-v1-mustard-polo-original':('01-上衣/04-Polo衫','贴身','短袖','针织','条纹短袖原版'),
 'separate-v1-mustard-polo':('01-上衣/04-Polo衫','常规','常规长袖','针织','条纹长袖派生'),
 'separate-v1-ivory-polo-original':('01-上衣/04-Polo衫','贴身','泡泡短袖','针织','短款收腰'),
 'separate-v1-black-check-polo-original':('01-上衣/04-Polo衫','常规','短袖','针织','常规衣长格领'),
 'navy-shirt':('01-上衣/05-衬衫','常规','卷袖','梭织','格纹翻领'),
 'campus-04-navy-tailored-shirt-tie':('01-上衣/05-衬衫','常规','常规长袖','梭织','收腰含领带'),
 'runway-white-crop-shirt':('01-上衣/05-衬衫','宽松','灯笼长袖','梭织','露腰短款'),
 'bookshop-basic-shirt-v1':('01-上衣/05-衬衫','常规','常规长袖','棉质','基础翻领'),
 'tops-hoodie-pullover':('01-上衣/06-卫衣','宽松','落肩长袖','卫衣布','套头连帽'),
 'tops-sweatshirt-crop':('01-上衣/06-卫衣','宽松','灯笼长袖','卫衣布','短款圆领'),
 'tops-sweatshirt-halfzip':('01-上衣/06-卫衣','宽松','灯笼长袖','卫衣布','半拉链立领'),
 'tops-sweatshirt-raglan':('01-上衣/06-卫衣','常规','插肩长袖','卫衣布','撞色插肩'),
 'autumn-colorblock-knit-v1':('01-上衣/07-露肩上衣','贴身','常规长袖','针织','一字露肩拼色'),
 'autumn-layered-shirt-v1':('01-上衣/08-叠穿组合','常规','宽袖长袖','棉质','衬衫叠搭背心'),
 'runway-ivory-fringe-jacket':('02-外套/01-粗花短外套','常规','灯笼长袖','粗花呢','金扣流苏短款'),
 'layered-suede-bomber-v1':('02-外套/02-短夹克','宽松','灯笼长袖','麂皮','立领收摆'),
 'layered-zip-jacket-v1':('02-外套/02-短夹克','常规','常规长袖','棉质','立领拉链'),
 'layered-denim-jacket-v1':('02-外套/02-短夹克','常规','常规长袖','牛仔','多袋短款'),
 'layered-utility-blouson-v1':('02-外套/02-短夹克','宽松','灯笼长袖','棉质','工装落肩'),
 'layered-hooded-knit-v1':('02-外套/03-开衫','常规','常规长袖','针织','连帽拉链'),
 'runway-red-plaid-overshirt':('02-外套/03-开衫','宽松','灯笼长袖','梭织','格纹衬衫式'),
 'street-v1-green-blazer':('02-外套/04-西装','常规','常规长袖','梭织','单排扣翻领'),
 'runway-ivory-black-fringe-coat-v2':('02-外套/05-长外套','宽松','灯笼长袖','粗花呢','长款滚边流苏'),
}
DIRECTIONS={
 '01-抹胸':'锁定胸腰轮廓与上缘，变化扣件、结饰、下摆分割和面料。',
 '02-背心与削肩':'锁定肩带、领口、胸侧覆盖与衣长，变化罗纹、包边和配色。',
 '03-T恤与亨利衫':'区分贴身与宽松母版，变化领型、门襟、条纹和面料。',
 '04-Polo衫':'分别保留短袖、泡泡短袖、长袖轮廓，统一翻领、袖口、条纹比例。',
 '05-衬衫':'锁定肩腋连接与袖型，变化领型、门襟、口袋和衣长细节。',
 '06-卫衣':'区分落肩、插肩、灯笼袖，变化领型、拉链、拼色和袖口细节。',
 '07-露肩针织':'保留露肩领线、肩袖连接，变化针法、拼色及衣长细节。',
 '08-叠穿组合':'沿用组合比例；拆成独立穿脱单品前先确认衣片完整性。',
 '01-粗花短外套':'锁定短衣身与灯笼袖轮廓，统一粗花、滚边、扣件的材质语言。',
 '02-短夹克':'分别保留常规袖与灯笼袖轮廓，变化麂皮、牛仔、工装结构。',
 '03-开衫':'保留开襟负形和前片范围，变化连帽、门襟、纹样；不补背部连接片。',
 '04-西装':'锁定肩宽、翻领与收腰，变化格纹、扣件和衣长细节。',
 '05-长外套':'锁定长衣身和袖肥，变化滚边、面料与扣件；不改变人物遮挡。'}
def build_basics(rows):
 from wardrobe_taxonomy import build_system
 system=build_system(rows,RULES,DIRECTIONS);classified={i['id']:i for i in system['items']}
 OUT.mkdir(exist_ok=True);notes=read(ROOT/'assets/materials/published/garment-notes.json')['items'];deleted=read(ROOT/'assets/materials/published/deleted-garments.json')['items'];selected=[r for r in rows if '基础款' in notes.get(r['id'],{}).get('tags',[]) and not deleted.get(r['id'],{}).get('deleted')];active={r['id'] for r in selected}
 archive=ROOT/'art-archive'/'basic-library-excluded'/datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')
 for marker in list(OUT.rglob('基础款记录.json')):
  old_id=read(marker).get('id');current=next((r for r in selected if r['id']==old_id),None)
  desired=OUT/classified[old_id]['shelf']/(old_id+'__'+current['name']) if current else None
  if old_id in active and marker.parent.resolve()==desired.resolve():continue
  source=marker.parent.resolve();target=(archive/source.relative_to(OUT.resolve())).resolve();assert source.is_relative_to(OUT.resolve()) and source!=OUT.resolve();assert target.is_relative_to((ROOT/'art-archive').resolve());target.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(source),str(target))
 entries=[]
 for r in selected:
  id=r['id'];c=classified[id];shelf,fit,sleeve,fabric,variant=[c[k] for k in ['shelf','fit','sleeve','fabric','variant']];folder=Path(shelf)/(id+'__'+r['name']);dest=OUT/folder;dest.mkdir(parents=True,exist_ok=True);src=INVENTORY/r['folder']
  for file in ['当前彩图.png','当前前片.png','当前后片.png','预览.png']:
   if (src/file).exists():shutil.copy2(src/file,dest/file)
  lines=[]
  for line in r['linearts']:
   target=dest/'线稿'/Path(line['file']).name;target.parent.mkdir(exist_ok=True);shutil.copy2(INVENTORY/line['file'],target);lines.append({**line,'file':target.relative_to(OUT).as_posix()})
  user=notes.get(id,{});flags=[t for t in user.get('tags',[]) if t!='基础款'];correction='当前图是短袖原版，旧名称含“长袖”；保留原名称和 ID。' if id=='separate-v1-mustard-polo-original' else ''
  slot_label={'top':'上衣','coat':'外套'}.get(r['slot'],r['slot']);role='上衣' if shelf.startswith('01-') else '外套' if shelf.startswith('02-') else slot_label
  item={**r,'folder':folder.as_posix(),'image':(folder/'当前彩图.png').as_posix(),'thumbnail':(folder/'预览.png').as_posix(),'linearts':lines,'shelf':shelf,'fit':fit,'sleeve':sleeve,'fabric':fabric,'variant':variant,'role':role,'slotLabel':slot_label,'userFlags':flags,'userNote':user.get('text',''),'classificationNote':correction,'classificationBasis':'按当前有效彩图目视归类；袖型与材质为浏览标签，不改装备槽位。','diversityBrief':DIRECTIONS.get(shelf.split('/')[-1],'先核对当前轮廓，再确定派生范围。'),'productionStatus':'轮廓参考；制作前按最新 SOP 核对，基础款标记不代表已验收。'}
  if id in ['top-v1-yellow-polo','separate-v1-mustard-polo-original','separate-v1-mustard-polo']:item['family']='条纹Polo家族（各 ID 保留）'
  write(dest/'基础款记录.json',item);entries.append(item)
 entries.sort(key=lambda i:(i['shelf'],i['id']));counts=dict(sorted(Counter(i['shelf'] for i in entries).items()));data={'builtAt':datetime.now(timezone.utc).isoformat(),'count':len(entries),'groups':counts,'roles':dict(Counter(i['role'] for i in entries)),'missingRoles':[label for label,slots in [('下装',['bottom']),('连衣裙',['dress']),('鞋袜',['shoes','socks']),('配件',['jewelry','bag'])] if not any(i['slot'] in slots for i in entries)],'items':entries}
 write(OUT/'体系清单.json',data);write(OUT/'基础款-diversity清单.json',entries)
 template=(ROOT/'tools/basic-wardrobe-template.html').read_text(encoding='utf8');(OUT/'index.html').write_text(template.replace('__BASIC_DATA__',json.dumps(data,ensure_ascii=False).replace('<','\\u003c')),encoding='utf8')
 (OUT/'说明.txt').write_text('基础款体系目录：只收录当前已标记且未删除的条目。\n按款式版型分组，另提供版型松量、袖型、材质筛选；不改原装备槽位、用户网格、曲线、印花或备注。\n目录内为有效当前图片和线稿副本，原稿不移动；历史线稿不自动代表当前手调版型。\n重新生成：tools/build_wardrobe_inventory.py 会同时更新本目录。\n已删除或取消基础款的旧目录副本移到项目 art-archive，线上目录不再收录。\n',encoding='utf8')
 print('Basic system:',len(entries),'items /',len(counts),'shape groups; deleted excluded')
