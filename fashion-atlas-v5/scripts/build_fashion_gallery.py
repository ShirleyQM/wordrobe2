"""Build standalone fashion-card batch galleries from reviewed manifest data."""
from pathlib import Path
import json,html,sys,zipfile
ROOT=Path(__file__).resolve().parent.parent
e=lambda s:html.escape(str(s))
def build(folder):
 p=ROOT/'card-art'/folder;ds=json.loads((p/'manifest.json').read_text());series={s['series_id']:s for s in json.loads((ROOT/'archive/content-v4.json').read_text())['series']}
 css='''*{box-sizing:border-box}body{margin:0;background:#eeece8;color:#292c33;font:15px/1.8 system-ui,-apple-system,"PingFang SC",sans-serif}main{max-width:1600px;margin:auto;padding:42px 3vw}h1{font:clamp(30px,4vw,54px)/1.25 Georgia,serif}h2{font-size:29px;margin-top:60px}h3{font-size:23px;margin-bottom:0}p{color:#667078}small{color:#805f68;letter-spacing:.07em}a{color:#4c566d;text-underline-offset:4px}nav{display:flex;gap:20px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}article{min-width:0}img{width:100%;height:auto;display:block;border-radius:14px}.item{border-left:2px solid #c0b6b4;padding-left:12px;margin:17px 0}.item p{margin:4px 0}details{border-top:1px solid #ccc0bd;margin-top:18px;padding-top:14px}summary{cursor:pointer;font-weight:600}footer{border-top:1px solid #ccc0bd;margin-top:40px;padding-top:25px;color:#667078;font-size:13px}@media(max-width:760px){.grid{grid-template-columns:1fr}}'''
 out=[f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>品牌参考时尚卡 · {e(folder)}</title><style>{css}</style><main><small>FASHION ATLAS / FASHION EDITION</small><h1>品牌参考时尚卡</h1><p>先研究品牌，再转译面料、廓形和比例。每关三张共享主题气氛，分别设计姿势与发型。单品标注的是设计参考关系，不是品牌在售产品。</p><nav><a href="../fashion-index.html">全部时尚卡</a><a href="../index.html">普通卡总览</a><a href="prompts.json">完整提示词</a><a href="sources.json">研究来源清单</a></nav>']
 for sid in sorted({d['group']for d in ds}):
  out.append(f'<section><h2>{e(series[sid]["title_zh"])}</h2><p>{e(next(d["atmosphere_zh"]for d in ds if d["group"]==sid))}</p><div class="grid">')
  for d in ds:
   if d['group']!=sid:continue
   s=d['source'];out.append(f'<article><a href="{d["path"]}"><img src="{d["path"]}" alt="{e(d["title"])} 时尚卡"></a><small>{d["id"]}</small><h3>{e(d["title"])}</h3><p><i>{e(d["en"])}</i></p><p>研究：<a href="{e(s["url"])}">{e(s["brand"])}</a><br>{e(s["season"])}</p><p>{e(d["review_zh"])}</p><details open><summary>逐件品牌参考与改造</summary>')
   for it in d['items']:
    brand=f'<a href="{e(s["url"])}">{e(s["brand"])}</a>'if it[1]=='brand'else'原创搭配'
    out.append(f'<div class="item"><b>{e(it[0])}</b><p>{brand}</p><p>{e(it[2])}</p></div>')
   out.append('</details></article>')
  out.append('</div></section>')
 out.append('<footer>使用内置 image_gen 生成。所有款式经过重组，不代表品牌产品或联名。品牌原图不收入交付包，仅提供公开来源链接。实际细节以成图为准，提示词保留设计意图。</footer></main></html>');(p/'index.html').write_text(''.join(out))
 (p/'README.md').write_text('# 品牌参考时尚卡\n\n打开 index.html 查看卡面、逐件品牌参考与改造。\n\n内置 image_gen 生成；prompts.json 为完整提示词，sources.json 为研究链接，manifest.json 为成图清单与视觉核查。\n\n原品牌照片不收入交付包。普通卡保持独立。\n')
 zpath=ROOT.parent/('Fashion_Atlas_'+folder.replace('-','_')+'.zip')
 with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED)as z:
  for q in p.iterdir():
   if q.is_file():z.write(q,folder+'/'+q.name)
 print(folder,len(ds),'cards',zpath)
if __name__=='__main__':build(sys.argv[1])
