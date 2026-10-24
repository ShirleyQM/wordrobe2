"""Produce five redesigned, front-only hairstyles from archived generated art."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from build_sclub_hair import recolor, font

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/materials/characters/sclub-single-five-v1'
BODY=ROOT/'assets/materials/characters/underwear-integrated-v1/body-0-0.png'
SPECS=[
 dict(id='lofa',name='Lofa · 柔顺长直',scale=.28,eye=470,center=512),
 dict(id='chelsea',name='Chelsea · 单侧流卷',scale=.30,eye=450,center=570),
 dict(id='n03',name='N03 · 偏分层卷',scale=.28,eye=500,center=560),
 dict(id='jen',name='JEN · 松编双辫',scale=.27,eye=470,center=520),
 dict(id='070124',name='070124 · 侧分轻卷',scale=.25,eye=532,center=480),
]
COLORS=[('黑','#252b35'),('棕','#79513b'),('金','#c9ad75'),('粉','#c88caa')]


def clean(im):
 a=np.array(im.convert('RGBA'))
 # Each source inspected: exterior/face alpha 0, interiors 252..254.
 a[:,:,3]=np.round(np.clip((a[:,:,3].astype(float)-8)/245,0,1)*255).astype('uint8')
 g=np.round(a[:,:,0]*.2126+a[:,:,1]*.7152+a[:,:,2]*.0722).astype('uint8')
 a[:,:,:3]=g[:,:,None];a[a[:,:,3]==0]=0
 return Image.fromarray(a)


def main():
 qa=OUT/'qa';qa.mkdir(exist_ok=True)
 body=Image.open(BODY).convert('RGBA')
 overview=Image.new('RGB',(1200,2250),'#eeeae4')
 catalog=[];rows=[]
 for i,spec in enumerate(SPECS):
  folder=OUT/'items'/spec['id'];folder.mkdir(parents=True,exist_ok=True)
  for kind in ['lineart','gray']:
   art=clean(Image.open(OUT/'sources'/f"{spec['id']}-{kind}.png"))
   production=Image.new('RGBA',(720,1112));production.alpha_composite(art.resize((664,996),Image.Resampling.LANCZOS),(28,58));production.save(folder/f'front-{kind}.png')
   if kind=='gray':
    scale=spec['scale'];left=round(470-spec['center']*scale);top=round(180-spec['eye']*scale)
    game=Image.new('RGBA',(939,1676));game.alpha_composite(art.resize((round(1024*scale),round(1536*scale)),Image.Resampling.LANCZOS),(left,top));game.save(folder/'front-game-gray.png')
  row=Image.new('RGB',(1200,450),'#eeeae4')
  for n,(label,color) in enumerate(COLORS):
   front=recolor(game,color);front.save(folder/f'front-{n}.png')
   worn=body.copy();worn.alpha_composite(front);worn.save(folder/f'tryon-{n}.png')
   head=worn.crop((255,20,685,605));head.save(folder/f'head-{n}.png')
   tile=Image.new('RGBA',(290,395),'#eeeae4');tile.alpha_composite(head.resize((290,395),Image.Resampling.LANCZOS));row.paste(tile.convert('RGB'),(n*300+5,32));ImageDraw.Draw(row).text((n*300+10,6),spec['name']+' · '+label,font=font(15),fill='#333333')
  row.save(qa/f"{spec['id']}-four-colors.jpg",quality=94);overview.paste(row,(0,i*450))
  edges=Image.new('RGB',(1080,556))
  for n,color in enumerate(['#111111','#808080','#ffffff']):
   tile=Image.new('RGBA',(360,556),color);tile.alpha_composite(production.resize((360,556),Image.Resampling.LANCZOS));edges.paste(tile.convert('RGB'),(n*360,0))
  edges.save(qa/f"{spec['id']}-edges.jpg",quality=95)
  catalog.append({**spec,'frontId':str(24+i),'front':f"items/{spec['id']}/front-game-gray.png",'back':None,'bounds':list(game.getchannel('A').getbbox()),'canvas':[720,1112],'anchor':[470,180]})
  rows.append(f'<section><div><h2>{spec["name"]}</h2><img class="ref" src="sources/{spec["id"]}-reference.png"><p>参考造型，已重绘细节<br>单片头发，无后片</p><a href="items/{spec["id"]}/front-lineart.png">线稿</a> / <a href="items/{spec["id"]}/front-gray.png">灰度母版</a> / <a href="qa/{spec["id"]}-edges.jpg">透明边缘</a></div>'+''.join(f'<a class="try" data-color="{n}" href="items/{spec["id"]}/tryon-{n}.png" target="_blank"><b>{label}发</b><img loading="lazy" src="items/{spec["id"]}/head-{n}.png"></a>' for n,(label,color) in enumerate(COLORS))+'</section>')
 overview.save(qa/'five-styles-four-colors.jpg',quality=94)
 brown=Image.new('RGB',(1080,1040),'#eeeae4');draw=ImageDraw.Draw(brown)
 for i,spec in enumerate(SPECS):
  head=Image.open(OUT/'items'/spec['id']/'head-1.png');head.thumbnail((350,475));tile=Image.new('RGBA',head.size,'#eeeae4');tile.alpha_composite(head);x=i%3*360;y=i//3*520;brown.paste(tile.convert('RGB'),(x+(360-head.width)//2,y+35));draw.text((x+12,y+8),spec['name'],font=font(20),fill='#352e28')
 brown.save(qa/'five-styles-brown.jpg',quality=95)
 (OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
 page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>五款单片头发 · 原创重绘</title><style>body{margin:0;background:#f2eee8;color:#3c332d;font:15px system-ui}header{position:sticky;top:0;background:#fffaf5ee;padding:18px 28px;border-bottom:1px solid #d8cbbb;z-index:2}h1{font-size:24px;margin:0}p{color:#82766b;line-height:1.6}button{padding:10px 20px;border-radius:8px;border:1px solid #c5b49f;background:white;cursor:pointer;margin-right:8px}.active{background:#6e5442;color:white}main{max-width:1300px;margin:auto;padding:24px}section{display:grid;grid-template-columns:160px repeat(4,1fr);gap:12px;background:#fffcf8;border-radius:14px;padding:18px;margin-bottom:24px}h2{font-size:16px}.ref{width:104px}.try img{width:100%;background:#eeeae4;border-radius:10px}.try b{display:block;margin:8px 0}a{color:inherit;font-size:13px;text-decoration:none}.focus .try{display:none}.focus .try.show{display:block}.focus section{grid-template-columns:180px 350px}@media(max-width:800px){section{grid-template-columns:110px 1fr 1fr}section>div{grid-row:span 2}}</style><header><h1>五款单片头发 · 统一画风重绘</h1><p>依据所选预览重新设计发束、分缝与发尾；按项目人物校准。无后片，下面均为单片素材的实际叠图试戴。</p><button class="active" data-show="all">四色对照</button>BUTTONS</header><main>ROWS</main><script>document.querySelectorAll('button').forEach(b=>b.onclick=()=>{document.body.classList.toggle('focus',b.dataset.show!=='all');document.querySelectorAll('button').forEach(v=>v.classList.toggle('active',v===b));document.querySelectorAll('.try').forEach(v=>v.classList.toggle('show',v.dataset.color===b.dataset.show))});</script></html>'''
 page=page.replace('BUTTONS',''.join(f'<button data-show="{n}">{label}发</button>' for n,(label,color) in enumerate(COLORS))).replace('ROWS',''.join(rows))
 (OUT/'index.html').write_text(page,encoding='utf-8')
 (OUT/'README.txt').write_text('五款单片头发：Lofa、Chelsea、N03、JEN、070124。\n使用内置 image_gen 参考造型重新设计，画风统一到项目日式半写实哑光丝滑风格。\n无后片，不制作空白后片冒充完成素材。\nfront-lineart.png 是独立线稿，front-gray.png 是 720×1112 透明灰度母版，front-game-gray.png 是 939×1676 已定位画布。\nfront-0..3 为黑棕金粉；tryon 是当前游戏人物与单片素材实际叠图。\n灰度图合并明暗、高光与发丝，不宣称有未分离的绘画层。\n完整提示词、参考与原始生成图见 sources。\n游戏入口：发型 → 单片发型 · 五款。选中后不显示旧后发；切回其他款式后原有后发可继续使用。\n',encoding='utf-8')
 print(json.dumps(catalog,ensure_ascii=False))


if __name__=='__main__':main()
