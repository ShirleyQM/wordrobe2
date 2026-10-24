"""Build six original hairstyles inspired by local thumbnails, with real try-ons."""
import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from build_sclub_hair import recolor,font
from build_sclub_single_hair import clean

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/materials/characters/hair-inspiration-v1'
BODY=ROOT/'assets/materials/characters/underwear-integrated-v1/body-0-0.png'
REAR=ROOT/'assets/materials/characters/generic-rear-hair-v1/game/shoulder-back-gray.png'
SPECS=[
 dict(id='pixie',name='雾羽短碎',scale=.24,eye=920,center=512),
 dict(id='bob',name='微风卷波波',scale=.22,eye=770,center=520),
 dict(id='bun',name='松云高髻',scale=.19,eye=1100,center=520),
 dict(id='space',name='双团软髻',scale=.23,eye=820,center=520),
 dict(id='pony',name='侧束轻马尾',scale=.28,eye=550,center=460),
 dict(id='bangs',name='碎星空气刘海',scale=.18,eye=865,center=512,backId='25',backScale=.9),
]
COLORS=[('黑','#252b35'),('棕','#79513b'),('金','#c9ad75'),('粉','#c88caa')]


def rear_layer():
 im=Image.open(REAR).convert('RGBA');out=Image.new('RGBA',(939,1676))
 # Back fit .9 means .75 of the project's 1.2 nominal placement, at same anchor.
 out.alpha_composite(im.resize((704,1257),Image.Resampling.LANCZOS),(118,45))
 return out


def main():
 qa=OUT/'qa';qa.mkdir(exist_ok=True)
 body=Image.open(BODY).convert('RGBA');rear=rear_layer();rear.save(OUT/'sources'/'existing-shoulder-preview-gray.png')
 catalog=[];rows=[];overview=Image.new('RGB',(1200,2700),'#eeeae4');brown=Image.new('RGB',(1080,1040),'#eeeae4')
 for i,spec in enumerate(SPECS):
  folder=OUT/'items'/spec['id'];folder.mkdir(parents=True,exist_ok=True)
  for kind in ['lineart','gray']:
   art=clean(Image.open(OUT/'sources'/f"{spec['id']}-{kind}.png"))
   if spec['id']=='bangs':
    # An isolated generated vertical scratch below y=1000 is outside this
    # forehead-only asset. No intended fringe reaches this area.
    a=np.array(art);a[1000:]=0;art=Image.fromarray(a)
   production=Image.new('RGBA',(720,1112));production.alpha_composite(art.resize((664,996),Image.Resampling.LANCZOS),(28,58));production.save(folder/f'front-{kind}.png')
   if kind=='gray':
    scale=spec['scale'];left=round(470-spec['center']*scale);top=round(180-spec['eye']*scale)
    game=Image.new('RGBA',(939,1676));game.alpha_composite(art.resize((round(1024*scale),round(1536*scale)),Image.Resampling.LANCZOS),(left,top));game.save(folder/'front-game-gray.png')
  row=Image.new('RGB',(1200,450),'#eeeae4')
  for n,(label,color) in enumerate(COLORS):
   foreground=recolor(game,color);foreground.save(folder/f'front-{n}.png')
   worn=recolor(rear,color) if spec['id']=='bangs' else Image.new('RGBA',(939,1676));worn.alpha_composite(body);worn.alpha_composite(foreground);worn.save(folder/f'tryon-{n}.png')
   head=worn.crop((255,0,685,585));head.save(folder/f'head-{n}.png');tile=Image.new('RGBA',(290,395),'#eeeae4');tile.alpha_composite(head.resize((290,395),Image.Resampling.LANCZOS));row.paste(tile.convert('RGB'),(n*300+5,32));ImageDraw.Draw(row).text((n*300+10,6),spec['name']+' · '+label,font=font(16),fill='#333333')
   if n==1:
    thumb=head.copy();thumb.thumbnail((350,475));tile=Image.new('RGBA',thumb.size,'#eeeae4');tile.alpha_composite(thumb);x=i%3*360;y=i//3*520;brown.paste(tile.convert('RGB'),(x+(360-thumb.width)//2,y+35));ImageDraw.Draw(brown).text((x+12,y+8),spec['name'],font=font(21),fill='#352e28')
  row.save(qa/f"{spec['id']}-four-colors.jpg",quality=94);overview.paste(row,(0,i*450))
  edges=Image.new('RGB',(1080,556))
  for n,color in enumerate(['#111111','#808080','#ffffff']):
   tile=Image.new('RGBA',(360,556),color);tile.alpha_composite(production.resize((360,556),Image.Resampling.LANCZOS));edges.paste(tile.convert('RGB'),(n*360,0))
  edges.save(qa/f"{spec['id']}-edges.jpg",quality=95)
  catalog.append({**spec,'frontId':str(33+i),'front':f"items/{spec['id']}/front-game-gray.png",'back':None,'bounds':list(game.getchannel('A').getbbox()),'canvas':[720,1112],'anchor':[470,180],'kind':'independent-fringe' if spec['id']=='bangs' else 'complete-front-only'})
  detail='独立刘海；试戴搭配现有通用齐肩后发' if spec['id']=='bangs' else '整款单片发型；无新后片'
  rows.append(f'<section><div><h2>{spec["name"]}</h2><img class="ref" src="sources/{spec["id"]}-reference.png"><p>造型灵感参考<br>{detail}</p><a href="items/{spec["id"]}/front-lineart.png">独立线稿</a> / <a href="items/{spec["id"]}/front-gray.png">灰度母版</a> / <a href="qa/{spec["id"]}-edges.jpg">透明边缘</a></div>'+''.join(f'<a class="try" data-color="{n}" href="items/{spec["id"]}/tryon-{n}.png" target="_blank"><b>{label}发</b><img loading="lazy" src="items/{spec["id"]}/head-{n}.png"></a>' for n,(label,color) in enumerate(COLORS))+'</section>')
 brown.save(qa/'six-styles-brown.jpg',quality=95);overview.save(qa/'six-styles-four-colors.jpg',quality=94)
 (OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
 template=(ROOT/'assets/materials/characters/sclub-single-five-v1/index.html').read_text(encoding='utf-8')
 start=template.index('<main>');end=template.index('</main>')
 page=template[:start]+'<main>'+''.join(rows)+template[end:]
 page=page.replace('五款单片头发 · 原创重绘','灵感新款 · 稀疏刘海').replace('五款单片头发 · 统一画风重绘','灵感新款 · 稀疏刘海').replace('依据所选预览重新设计发束、分缝与发尾；按项目人物校准。无后片，下面均为单片素材的实际叠图试戴。','五款不同轮廓的新发型，加一片独立稀疏空气刘海。只借造型灵感，重新设计细节与画风；下面均为当前角色实际叠图。')
 (OUT/'index.html').write_text(page,encoding='utf-8')
 (OUT/'README.txt').write_text('灵感新款六件：雾羽短碎、微风卷波波、松云高髻、双团软髻、侧束轻马尾、碎星空气刘海。\n从本地预览选择不同轮廓作为灵感；独立线稿生成、重新设计结构后绘制项目画风灰度母版。不是直接抠原作者图片。\n前五件是整款单片发型；最后一件只包含刘海，可独立搭配现有后发。刘海试戴图借用了已有通用齐肩后发，未声称是新后片。\n每件有720×1112灰度母版、独立线稿、939×1676已定位游戏片、黑棕金粉四色及实际人物叠图。\n灰度母版合并了阴影、高光和细丝，不宣称分离手绘层。sources存原始图、造型参考、完整提示词；qa存边缘和实际试戴图。\n游戏入口：发型 → 灵感新款。原有多片搭配、位置保存、前后层切换仍可使用。\n',encoding='utf-8')
 print(json.dumps([{'id':i['id'],'frontId':i['frontId'],'bounds':i['bounds']} for i in catalog]))


if __name__=='__main__':main()
