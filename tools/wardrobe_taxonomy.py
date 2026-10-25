"""Shared shape taxonomy for every active garment and accessory, plus basic subsets."""
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
import re,json
ROOT=Path(__file__).resolve().parents[1]
def match(pattern,text):return bool(re.search(pattern,text,re.I))
def classify(row,raw,rules):
 id=row['id'];n=row['name'];slot=row['slot'];text=n+' '+id;material=str(raw.get('material',''));t=text+' '+material
 if id in rules:return rules[id]
 sleeve='无袖' if match('无袖|吊带|背心|挂脖|抹胸|削肩|胸衣',text) else '灯笼长袖' if match('灯笼',text) else '泡泡短袖' if match('泡泡|puff',text) else '短袖' if match('短袖|tee|T ?恤|盖袖|飞袖',text) else '常规长袖' if match('长袖|衬衫|毛衣|卫衣|外套|夹克|开衫|大衣|blouse|shirt|sweat|coat|jacket|knit',text) else '未注明'
 fit='宽松' if match('宽松|宽版|落肩|阔腿|灯笼|茧型|oversize|loose|blouson|palazzo',text) else '贴身' if match('贴身|修身|合身|包臀|束身|束腰|胸衣|抹胸|背心|削肩|挂脖|bustier|corset|fitted|bandeau',text) else '常规'
 fabric=next((label for pattern,label in [('麂皮|suede','麂皮'),('牛仔|denim|jeans|丹宁','牛仔'),('蕾丝|lace','蕾丝'),('薄纱|轻纱|纱裙|雪纺|tulle|chiffon|纱','纱'),('丝绒|velvet','丝绒'),('粗花|tweed','粗花呢'),('绒毛|绒面|shearling|pile|fur','绒毛'),('羊毛|wool','羊毛'),('卫衣|sweat|hoodie','卫衣布'),('针织|罗纹|毛衣|knit|rib|crochet','针织'),('皮革|皮质|皮裙|亮皮|leather','皮革'),('丝缎|缎面|satin','缎面'),('棉|cotton|jersey','棉质'),('尼龙|nylon','尼龙'),('木制|wood','木材'),('孔雀石|malachite','孔雀石'),('珍珠|pearl','珍珠'),('金色|gold|银色|silver','金属')] if match(pattern,t)),material or '未注明')
 if slot=='top':
  leaf=next((v for p,v in [('抹胸|bandeau','01-抹胸'),('束身|束腰|胸衣|corset|bustier','09-束身胸衣'),('叠搭|叠穿|layered-shirt|argyle','08-叠穿组合'),('背心|吊带|挂脖|削肩|cami|tank|shell','02-背心与削肩'),('Polo','04-Polo衫'),('卫衣|sweat|hoodie','06-卫衣'),('衬衫|blouse|(?<!sweat)shirt','05-衬衫'),('露肩|一字肩|bardot|offshoulder','07-露肩上衣'),('亨利|T ?恤|tee|henley','03-T恤与亨利衫'),('针织|毛衣|knit|rib','10-针织衫'),('长袖|高领|ruched','11-打底长袖'),('荷叶|飞袖|ruffle|peplum|裹身','12-褶饰与裹身上衣'),('长上衣|tunic','13-长款上衣')] if match(p,text)), '14-常规上衣');shelf='01-上衣/'+leaf
 elif slot=='coat':
  if match('T ?恤|tee',text):shelf='01-上衣/03-T恤与亨利衫';sleeve='短袖'
  else:shelf='02-外套/'+next((v for p,v in [('西装|blazer','04-西装'),('风衣|trench','06-风衣'),('大衣|长外套|coat-v2|wool-coat','05-长外套'),('开衫|cardigan|hoodie|hooded|bolero','03-开衫'),('粗花|流苏|fringe','01-粗花短外套'),('茧型|cocoon','07-茧型外套'),('夹克|jacket|工装|overshirt','02-短夹克')] if match(p,text)), '02-短夹克')
 elif slot=='bottom':
  pants=match('裤|pants|trouser|jogger|jeans|palazzo',text)
  if pants:shelf='03-下装/'+('01-短裤' if match('短裤|shorts|skort',text) else '02-阔腿裤' if match('阔腿|wide|palazzo',text) else '03-喇叭裤' if match('喇|flare',text) else '04-弧形裤' if match('弧线|barrel',text) else '05-运动与束口裤' if match('运动|瑜伽|jogger|yoga|cuffed',text) else '06-直筒与工装裤')
  else:shelf='03-下装/'+('07-百褶短裙' if match('百褶|pleat',text) and not match('长裙|中裙|long',text) else '08-A字与短裙' if match('短裙|mini|short-|skort',text) else '09-包臀与裹身裙' if match('包臀|裹|wrap|pencil',text) else '10-鱼尾裙' if match('鱼尾|mermaid',text) else '11-层叠与荷叶裙' if match('层|荷叶|tier|flounce',text) else '12-薄纱与蕾丝裙' if match('纱|蕾丝|lace|tulle',text) else '13-百褶中长裙' if match('褶|pleat',text) else '14-直筒与A字中长裙')
  sleeve='不适用'
 elif slot=='dress':
  shelf='04-连衣裙/'+next((v for p,v in [('礼裙|礼服|gown|拖尾|缎面长裙','01-礼服长裙'),('衬衫裙|shirt|tailored|翻领','02-衬衫与翻领裙'),('露肩|抹胸|offshoulder|bardot|bubble|一字肩','03-露肩与抹胸裙'),('泡泡|灯笼|puff|balloon','04-泡泡与灯笼袖裙'),('挂脖|halterneck|halter','05-挂脖裙'),('吊带|背带|cami|pinafore','06-吊带与背带裙'),('针织|knit|修身','07-针织与修身裙'),('裹|wrap|斜摆|drape','08-裹身与垂褶裙')] if match(p,text)), '09-常规连衣裙')
 elif slot=='bra':shelf='05-内衣/'+('01-无肩带与抹胸' if match('无肩带|抹胸|bandeau',text) else '02-运动内衣' if match('运动|sport',text) else '03-蕾丝与装饰杯' if match('蕾丝|圆杯|荷叶杯|刺绣|束身|bustier|lace',text) else '04-三角与比基尼' if match('三角|比基尼|bikini|triangle',text) else '05-背心与基础内衣');fit='贴身';sleeve='不适用'
 elif slot=='briefs':shelf='06-内裤/'+('01-比基尼' if match('比基尼|bikini',text) else '02-蕾丝内裤' if match('蕾丝|lace',text) else '03-运动内裤' if match('运动|sport',text) else '04-基础内裤');fit='贴身';sleeve='不适用'
 elif slot=='socks':shelf='07-袜子/'+('01-短袜' if match('短袜|ankle',text) else '02-中筒袜' if match('中筒|crew',text) else '03-及膝袜' if match('及膝|knee',text) else '04-大腿与长筒袜');fit='贴身';sleeve='不适用'
 elif slot=='shoes':shelf='08-鞋履/'+('01-靴子' if match('靴|boot|combat',text) else '02-乐福鞋' if match('乐福|loaf',text) else '03-运动鞋' if match('运动|跑鞋|板鞋|sneaker|sport|贝壳头|shell',text) else '04-拖鞋与凉拖' if match('拖鞋|凉拖|slides',text) else '05-草编与编织鞋' if match('草编|编织|espadrille|woven',text) else '06-芭蕾平底鞋' if match('芭蕾|ballet',text) else '07-尖头与踝带鞋' if match('尖头|踝带|point',text) else '08-圆头与方头鞋');fit='不适用';sleeve='不适用'
 elif slot=='jewelry':
  leaf=next((v for p,v in [('围裙|裙片|系腰|waist-tie|tied-cardigan|wrap-v1','01-腰间叠穿配件'),('皮带|腰带|belt','02-皮带'),('帽|cap|hat|beanie|beret','03-帽子'),('墨镜|眼镜|cat-eye|glasses','04-眼镜'),('项链|necklace|pendant|chains','05-项链'),('袖套|armwarmer','06-袖套'),('流线|modern-flow','07-流线耳饰'),('流苏耳|modern-tassel','08-流苏耳饰'),('木制|modern-wood','09-木制耳饰'),('孔雀石|modern-malachite','10-孔雀石耳饰'),('不规则|modern-geometric','11-几何耳饰'),('大圈|大圆圈|large-hoop|smooth-hoop|braided-hoop|double-hoop','12-大圈耳环'),('耳扣|小圆圈|huggie|small-hoop','13-小圈与耳扣'),('爱心|粉心|heart','14-爱心耳饰'),('耳钉|stud|prong|wrapped-pearl','15-耳钉'),('耳坠|baroque|bow-pearl','16-垂坠耳饰'),('耳饰|耳环|earring|jewel-','17-其他耳饰'),('发夹|发箍|hairclip|headband','18-发饰')] if match(p,text)),'19-装饰配件');shelf='09-配件/'+leaf;fit='不适用';sleeve='不适用'
 elif slot=='bag':shelf='10-包袋/'+('01-肩包' if match('肩包|法棍|baguette|hobo',text) else '02-手提与翻盖包');fit='不适用';sleeve='不适用'
 else:shelf='11-其他/'+str(slot);fit='不适用';sleeve='不适用'
 return shelf,fit,sleeve,fabric,n
def build_system(rows,rules,directions):
 raw_items=json.loads((ROOT/'assets/materials/garments/collection.json').read_text(encoding='utf8'))['items'];raw={i['id']:i for i in raw_items};items=[];labels={'top':'上衣','coat':'外套','bottom':'下装','dress':'连衣裙','bra':'内衣','briefs':'内裤','socks':'袜子','shoes':'鞋履','jewelry':'配件','bag':'包袋'}
 for r in rows:
  shelf,fit,sleeve,fabric,variant=classify(r,raw.get(r['id'],{}),rules);role=re.sub(r'^\d+-','',shelf.split('/')[0]);user=r.get('notes',{});item={**r,'shelf':shelf,'fit':fit,'sleeve':sleeve,'fabric':fabric,'variant':variant,'role':role,'slotLabel':labels.get(r['slot'],r['slot']),'userFlags':[t for t in user.get('tags',[]) if t!='基础款'],'userNote':user.get('text',''),'classificationBasis':'已核对基础款用目视规则；其余依据品名、装备类型及原材质记录归类，未注明的维度不臆测。','diversityBrief':directions.get(shelf.split('/')[-1],'沿用本款轮廓与结构；区分贴身或宽松、袖型、面料后再制作派生。'),'productionStatus':'分类记录不等于制作或试穿验收。','classificationNote':'当前图为短袖原版，保留旧名称。' if r['id']=='separate-v1-mustard-polo-original' else ''}
  if r['id'] in ['top-v1-yellow-polo','separate-v1-mustard-polo-original','separate-v1-mustard-polo']:item['family']='条纹Polo家族（各 ID 保留）'
  items.append(item)
 data={'builtAt':datetime.now(timezone.utc).isoformat(),'count':len(items),'inWardrobe':sum(i['inWardrobe'] for i in items),'basicCount':sum(i['basicTemplate'] for i in items),'groups':dict(sorted(Counter(i['shelf'] for i in items).items())),'items':items};(ROOT/'assets/wardrobe-organized/分类体系.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8');return data
