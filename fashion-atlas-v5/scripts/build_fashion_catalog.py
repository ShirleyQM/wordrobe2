"""Build the active 30-series fashion collection, preserving earlier variants."""
from pathlib import Path
import json,html
R=Path(__file__).resolve().parent.parent;A=R/'card-art';e=lambda x:html.escape(str(x))
def read(p):return json.loads(p.read_text())
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
folders=['fashion-s01-s03','fashion-s04-s05','fashion-s06','fashion-s07-s09']+['fashion-s%02d-s%02d'%(n,n+2)for n in range(10,29,3)]+['fashion-s07-s08-v2']
active={}
for f in folders:
 for d in read(A/f/'manifest.json'):
  cid=d.get('id',d.get('card_id'));s=d.get('source',{})
  active[cid]=dict(card_id=cid,series_id=cid[:3],tier='fashion',title_zh=d.get('title',d.get('title_zh')),title_en=d.get('en',d.get('title_en')),path='card-art/'+f+'/'+d['path'],details_page='card-art/'+f+'/index.html#'+cid[:3],brand_reference=s.get('brand',d.get('brand',d.get('brand_reference'))),manifest='card-art/'+f+'/manifest.json',palette=d.get('palette',[]),palette_zh=d.get('palette_zh',''))
rows=[active[k]for k in sorted(active)];assert len(rows)==90
for n in range(1,31):assert sum(x['series_id']=='S%02d'%n for x in rows)==3
save(A/'fashion-manifest.json',rows)
series={s['series_id']:s for s in read(R/'archive/content-v4.json')['series']}
for sid,ctx in read(R/'references/overall-content-context.json').items():
 if ctx.get('title_zh'):series[sid]['title_zh']=ctx['title_zh']
css='body{margin:0;background:#edeae4;color:#252731;font:15px/1.7 system-ui}main{max-width:1450px;margin:auto;padding:36px 4vw}h1{font-size:42px}h2{margin-top:56px}a{color:inherit}nav{display:flex;gap:14px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}img{width:100%;border-radius:14px}small{color:#75636c}.sw{display:inline-block;width:18px;height:18px;border-radius:50%;margin-right:7px}@media(max-width:650px){.grid{grid-template-columns:1fr}}'
out=['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fashion Atlas · 30关时尚卡</title><style>'+css+'</style><main><small>FASHION ATLAS / 90 FASHION CARDS</small><h1>30关 · 品牌参考时尚卡</h1><p>每关三张，以品牌研究转译廓形、面料与配色。点击卡面查看逐件参考和原站图片。森林与芭蕾采用新版，早期版本保留在原批次中。</p><p><a href="../index.html">30关文字与卡面整合版</a> · <a href="index.html">普通卡总览</a> · <a href="brand-research.json">品牌研究清单</a></p><nav>']
for n in range(1,31):out.append('<a href="#S%02d">%02d</a>'%(n,n))
out.append('</nav>')
for sid in sorted(series):
 ds=[d for d in rows if d['series_id']==sid]
 out.append('<section id="'+sid+'"><h2>'+sid+' · '+e(series[sid]['title_zh'])+'</h2><div class="grid">')
 for d in ds:
  out.append('<article><a href="'+e(d['details_page'].replace('card-art/','',1))+'"><img loading="lazy" src="'+e(d['path'].replace('card-art/','',1))+'" alt="'+e(d['title_zh'])+'"></a><small>'+d['card_id']+'</small><h3>'+e(d['title_zh'])+'</h3><p>'+e(d['title_en'])+'</p><p>'+e(d['brand_reference']or'见逐件品牌说明')+'</p>'+''.join('<span class="sw" style="background:'+e(c)+'"></span>'for c in d['palette'])+'<p>'+e(d['palette_zh'])+'</p></article>')
 out.append('</div></section>')
out.append('<footer><p>内置 image_gen 生成；设计参考不代表品牌产品、联名或授权。面料标注为设计目标；原品牌照片仅链接原站。</p></footer></main></html>');(A/'fashion-index.html').write_text(''.join(out))
print('Active collection:',len(rows))
