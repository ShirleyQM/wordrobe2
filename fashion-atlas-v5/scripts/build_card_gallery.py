from pathlib import Path
import json,html,os
ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/'content.json').read_text())
ART={r['card_id']:r for r in json.loads((ROOT/'card-art/manifest.json').read_text())}
e=lambda s:html.escape(str(s))
CSS='''*{box-sizing:border-box}body{margin:0;background:#f6f2e9;color:#283239;font:16px/1.75 system-ui,-apple-system,"PingFang SC",sans-serif}main{max-width:1500px;margin:auto;padding:36px max(3vw,18px)}h1{font-size:clamp(28px,4vw,48px);font-weight:600;line-height:1.35}h2{margin:42px 0 20px;font-size:28px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}article{min-width:0}img{display:block;width:100%;height:auto;border-radius:13px}h3{margin:12px 0 3px;font-size:20px;line-height:1.45}p{color:#64685f;margin:7px 0 12px}small{color:#8e493b;letter-spacing:.04em}a{color:#344d59;text-underline-offset:4px}nav{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}nav a{padding:7px 14px;border:1px solid #cbcfc3;text-decoration:none}.swatch{display:inline-block;width:16px;height:16px;border-radius:50%;vertical-align:middle;margin-right:5px}.pose{color:#344d59;font-size:14px}.english{font:16px/1.6 Georgia,serif;color:#73766c}.note{font-size:13px;margin-top:40px}@media(max-width:650px){.grid{grid-template-columns:1fr}h2{font-size:24px}}@media print{section{break-before:page}.grid{grid-template-columns:repeat(3,1fr);gap:12px}img{max-height:185mm;object-fit:contain}nav{display:none}h1{font-size:28pt}h3{font-size:12pt}p{font-size:9pt}}'''
def build(destination,series_ids,title):
 dest=ROOT/destination;dest.parent.mkdir(exist_ok=True,parents=True)
 rel=lambda path:os.path.relpath(ROOT/path,dest.parent)
 nav='{nav}'
 chunks=[f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><style>{CSS}</style><main><small>FASHION ATLAS / CLEAN FASHION ILLUSTRATION</small><h1>{e(title)}</h1><p>干净的插画画风，分别设计的动作与发型。点击卡面查看原尺寸 PNG。</p><nav><a href="{rel("card-art/fashion-s04-s05/index.html")}">第4—5关 · 时尚卡</a><a href="{rel("card-art/fashion-s06/index.html")}">暗黑学院 · 时尚卡</a><a href="{rel("index.html")}">双语阅读版</a><a href="{rel("card-art/index.html")}">第4—9关 · 全部18张</a><a href="{rel("card-art/clean-v2/index.html")}">第4—6关</a><a href="{rel("card-art/levels07-09/index.html")}">第7—9关</a></nav>']
 count=0
 for s in DATA['series']:
  if s['series_id'] not in series_ids:continue
  chunks.append(f'<section><h2>{e(s["series_id"]+" "+s["title_zh"])}</h2><div class="grid">')
  for c in s['cards']:
   a=ART[c['card_id']];img=rel(a['path']);count+=1
   colours=' '.join(f'<span class="swatch" style="background:{x["hex"]}"></span>{e(x["name_zh"])}' for x in c['palette'])
   chunks.append(f'<article><a href="{e(img)}" target="_blank" rel="noopener"><img loading="lazy" src="{e(img)}" alt="{e(c["card_id"]+" "+c["title_zh"])}"></a><small>{e(c["card_id"])}</small><h3>{e(c["title_zh"])}</h3><p class="english">{e(c["title_en"])}</p><p class="pose"><b>动作：</b>{e(a["action_zh"])}<br><b>发型：</b>{e(a["hair_zh"])}</p><p>{e(c["silhouette_zh"])}</p><p>{colours}</p><p>{e(c["surface_study_zh"])}</p></article>')
  chunks.append('</div></section>')
 chunks.append('<p class="note">使用内置 image_gen 制作。配色面积为设计目标，非像素实测。完整提示词与各批次清单随卡面包保留。</p></main></html>');dest.write_text(''.join(chunks));print(destination,count,'cards')
available=sorted({int(a['card_id'][1:3]) for a in ART.values()})
last=max(available)
NAV=[('index.html','双语阅读版'),('card-art/index.html',f'第4—{last}关 · 全部{len(ART)}张')]
groups=[]
for n in range(4,last+1,3):
 ids=[f'S{i:02d}' for i in range(n,n+3)]
 if all(any(k.startswith(f'C{i:02d}-') for k in ART) for i in range(n,n+3)):
  path='card-art/clean-v2/index.html' if n==4 else f'card-art/levels{n:02d}-{n+2:02d}/index.html'
  groups.append((path,ids,f'第 {n}—{n+2} 关 · 卡面设计'))
  NAV.append((path,f'第{n}—{n+2}关'))
build('card-art/index.html',[f'S{i:02d}' for i in available],f'第 4—{last} 关 · 卡面总览')
for args in groups:build(*args)
