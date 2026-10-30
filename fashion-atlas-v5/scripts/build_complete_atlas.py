"""Combine the 30 readings with the 90 active fashion illustrations."""
from pathlib import Path
import json,html,re
R=Path(__file__).resolve().parent.parent;A=R/'card-art'
def read(p):return json.loads(p.read_text())
e=lambda s:html.escape(str(s or ''))
def para(s,cls=''):return '<p class="'+cls+'">'+e(s)+'</p>'
def link(url,label):return '<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(label)+'</a>'if url else e(label)
content=read(R/'content.json');active=read(A/'fashion-manifest.json');contexts=read(R/'references/overall-content-context.json');ordinary=read(A/'manifest.json')
cache={}
def artdata(row):
 path=R/row['manifest']
 if str(path)not in cache:cache[str(path)]=read(path)
 d=next(x.copy()for x in cache[str(path)]if x.get('id',x.get('card_id'))==row['card_id'])
 s=d.get('source',{}).copy()
 if not s:
  s={'brand':d['brand_reference'],'url':d['source_url']}
  sources=read(path.parent/'sources.json')if(path.parent/'sources.json').exists()else read(A/'brand-research.json')['sources']
  if isinstance(sources,list):
   s.update(next((x for x in sources if x.get('brand')==s['brand']),{}))
 s['url']=s.get('url',s.get('collection_url',d.get('source_url','')))
 s['image']=s.get('image',s.get('photo_source_url',''))
 if not s.get('season')or'沿用'in s['season']or'具体系列'in s['season']:
  m=re.search(r'/(fall|spring)-(\d{4})-(ready-to-wear|couture)/',s['url'])
  s['season']=(m[2]+' '+('秋冬'if m[1]=='fall'else'春夏')+('高级定制'if m[3]=='couture'else'成衣'))if m else('1926 年 robe de style · 博物馆藏品'if d.get('ref')=='lanvin'else'产品／公开造型参考')
 d['source']=s;d['row']=row;return d
arts=[artdata(r)for r in active]
def render_card(d,sid):
 row=d['row'];s=d['source'];cid=row['card_id'];ctx=contexts.get(sid,{}).get('contexts',{}).get(cid)
 out=['<article class="fashion-look" id="'+cid+'">',link(row['path'],'') .replace('></a>','><img loading="lazy" width="887" height="1774" src="'+e(row['path'])+'" alt="'+e(row['title_zh'])+' 全身卡面"></a>'),'<div class="look-copy"><small>'+cid+'</small><h3>'+e(row['title_zh'])+'</h3>'+para(row['title_en'],'en card-en'),'<h4>'+e(s['brand'])+'</h4>',para(s['season'],'source-meta'),'<p class="source-links">'+link(s['url'],'系列／产品出处')+(' · '+link(s['image'],'参考图')if s.get('image')else'')+'</p>']
 if ctx:out+=['<div class="context"><b>'+e(ctx['label'])+'</b>'+para(ctx['text'])+link(ctx['url'],'查看出处报道')+'</div>']
 if d.get('palette'):out+=['<div class="swatches">'+''.join('<span style="background:'+e(c)+'"></span>'for c in d['palette'])+'</div>',para(d.get('palette_zh',''),'source-meta')]
 out+=[para(d.get('review_zh',d.get('transformation','')))]
 if d.get('silhouette_zh'):out+=[para('廓形：'+d['silhouette_zh'])]
 if d.get('fabric_zh'):out+=[para('面料设计：'+d['fabric_zh'])]
 out+=['<details><summary>逐件品牌参考与改造</summary><ul class="garments">']
 sources_path=R/row['manifest'];sp=sources_path.parent/'sources.json';srcs=read(sp)if sp.exists()else[];sm={x.get('key'):x for x in srcs if isinstance(x,dict)}if isinstance(srcs,list)else{}
 items=d.get('items')or[[d.get('reference_focus','服装层次'),'brand',d.get('transformation','')],['鞋履与发饰','original','原创搭配；以成图为准。']]
 for it in items:
  if isinstance(it,dict):name=it.get('item_zh','单品');brand=it.get('reference_brand','原创搭配');url=it.get('source_url');note=it.get('transformation_zh','')
  else:
   name,kind,note=it;ref=s if kind=='brand'else sm.get(kind);brand=ref['brand']if ref else'原创搭配';url=ref.get('url')if ref else None
   if cid=='S27-F03'and name=='鞋履、包与发饰':name='日常芭蕾鞋';note='仅鞋履参考 Repetto 的浅口和带状结构；包与发饰为原创搭配。'
  out+=['<li><b>'+e(name)+'</b><p>'+link(url,brand)+'</p>'+para(note)+'</li>']
 out+=['</ul></details></div></article>'];return ''.join(out)
def quiz(q,uid):
 if q['type']=='discussion':return '<article class="discussion"><h4>聊聊你的看法</h4>'+para(q['prompt_en'],'en')+'<label for="'+uid+'">中文或英文都可以</label><textarea id="'+uid+'"></textarea>'+para(q['rubric_zh'],'source-meta')+'</article>'
 out=['<form class="quiz" data-answer="'+str(q['answer_index'])+'" data-explanation="'+e(q['explanation_zh'])+'"><fieldset><legend class="en">'+e(q['prompt_en'])+'</legend>']
 for i,v in enumerate(q['options_en']):out+=['<label><input type="radio" name="'+uid+'" value="'+str(i)+'"><span class="en">'+chr(65+i)+'. '+e(v)+'</span></label>']
 out+=['</fieldset><button type="submit">检查答案</button> <button type="reset" class="secondary">重试</button><p class="feedback" aria-live="polite"></p><details><summary>答案与依据</summary>'+para(chr(65+q['answer_index'])+'. '+q['options_en'][q['answer_index']],'en')+para(q['explanation_zh'])+'</details></form>'];return ''.join(out)
output=['<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fashion Atlas · 30关完整图鉴</title><link rel="stylesheet" href="scripts/complete-atlas.css"></head><body><header class="masthead"><div><h1>Fashion Atlas</h1><p>30关完整图鉴</p></div><p class="mast-intro">从品牌与公开文章出发，看廓形、面料、配色如何落在一张卡上。每关三张时尚卡，接着读一段双语导读，再做三道题。</p><nav><a href="chapters/y2k/index.html">试玩 Y2K 完整章节</a><a href="card-art/fashion-index.html">只看90张时尚卡</a><a href="card-art/index.html">普通卡对照</a></nav></header><main><section id="directory"><h2>选一关，连着看。</h2><div class="toolbar"><label for="search">查找关卡或品牌</label><input id="search" type="search" placeholder="如 Art Deco、Simone Rocha、S29"><span id="count">30 关</span><button id="clear" class="secondary">显示全部</button></div><nav class="directory">']
for s in content['series']:
 sid=s['series_id'];title=contexts.get(sid,{}).get('title_zh',s['title_zh']);ds=[x for x in arts if x['row']['series_id']==sid];brands=' / '.join(dict.fromkeys(x['source']['brand']for x in ds));search=title+' '+s['title_en']+' '+brands+' '+sid
 output+=['<a class="directory-item" href="#'+sid+'" data-search="'+e(search)+'"><small>'+sid+'</small><b>'+e(title)+'</b><span>'+e(brands)+'</span></a>']
output+=['</nav><p id="empty" hidden>没有匹配的关卡。换个品牌名或编号试试。</p></section>']
for s in content['series']:
 sid=s['series_id'];ctx=contexts.get(sid,{});title=ctx.get('title_zh',s['title_zh']);ds=[x for x in arts if x['row']['series_id']==sid];brands=' / '.join(dict.fromkeys(x['source']['brand']for x in ds));search=title+' '+s['title_en']+' '+brands+' '+sid
 intro=ctx.get('intro_zh')or ds[0].get('atmosphere_zh')or'结合三张卡的剪裁、材质和配色，对照下方品牌系列与阅读。'
 output+=['<section class="series" id="'+sid+'" data-search="'+e(search)+'"><header class="series-header"><div class="series-number">'+sid[1:]+'</div><div><h2>'+e(title)+'</h2>'+para(brands,'brand-line')+para(intro)+'<p class="series-nav"><a href="#'+sid+'-reading">读文章与做题</a> · <a href="#directory">关卡目录</a></p></div></header>']
 if sid=='S04':output+=['<aside class="scene-note"><b>完整学习章节已上线</b><p>6个小关 · 24个词 · 4篇完整课文 · 36题 · 通关收集这三张卡。</p><a href="chapters/y2k/index.html">进入 Y2K 完整章节</a></aside>']
 if ctx.get('scene_zh'):output+=[para(ctx['scene_zh'],'scene-note')]
 output+=['<div class="looks">'+''.join(render_card(x,sid)for x in ds)+'</div>']
 ords=[x for x in ordinary if x.get('series_id')==sid or x.get('card_id','')[1:3]==sid[1:]]
 if ords:
  output+=['<details class="ordinary"><summary>普通卡对照 · '+str(len(ords))+' 张</summary><div class="looks">']
  for x in ords:output+=['<figure><img loading="lazy" width="887" height="1774" src="'+e(x['path'])+'" alt="'+e(x.get('title_zh',x['card_id']))+'"><figcaption>'+e(x.get('title_zh',x['card_id']))+'</figcaption></figure>']
  output+=['</div></details>']
 r=s['reading'];src=r['source']
 output+=['<div class="reading" id="'+sid+'-reading"><div class="reading-main"><h3>'+e(r['title_zh'])+'</h3><p class="source-meta">根据公开来源编写的双语导读</p><div class="bilingual">'+para(r['guide_en'],'en guide')+para(r['guide_zh'],'guide zh')+'</div>'+para(r['focus_zh'],'source-meta')+'</div><aside class="reading-source"><h4>'+e(src['publisher'])+'</h4><p>'+link(src['url'],src['title'])+'</p>'+para(' · '.join(x for x in [src.get('author'),src.get('date')]if x),'source-meta')+'<blockquote>'+para(src['quote_en'],'en')+para(src['quote_zh'])+'</blockquote><small>原文短摘录 · 中文为本版译文</small><p>'+link(src['url'],'感兴趣，继续读原文')+'</p></aside></div><div class="questions">'+''.join(quiz(q,sid+'q'+str(i))for i,q in enumerate(r['questions']))+'</div></section>']
output+=['</main><footer><p>卡面为基于品牌视觉参考的原创重组；画面场景为创作设定，有真实活动出处时在卡面旁注明。面料是设计目标，品牌原图链接原站。</p><p>导读与题目由本版编写，短摘录与出处归原作者及机构。作答仅留在当前页面，刷新清空。普通卡与旧版设计保留在对应图鉴。</p><a href="#directory">回到目录</a></footer><script src="scripts/complete-atlas.js"></script></body></html>']
(R/'index.html').write_text(''.join(output))
print('Built integrated atlas:',len(active),'fashion cards;',len(content['series']),'readings;',sum(len(s['reading']['questions'])for s in content['series']),'questions')
