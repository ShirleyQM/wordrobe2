from pathlib import Path
import base64,collections,html,json,re,zipfile
ROOT=Path(__file__).resolve().parent.parent
e=lambda x:html.escape(str(x))
def p(x,cls=''):return f'<p class="{cls}">{e(x)}</p>'
d=json.loads((ROOT/'archive/content-v4.json').read_text())
curated=json.loads((ROOT/'references/curated-readings-v5.json').read_text())
# Preserve V4's established typography and design cards; do not execute its old builder.
CSS=(ROOT/'scripts/base-v4.css').read_text()
CSS+='''
.masthead h1{max-width:1100px}.reading-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.reading-link{display:block;padding:24px;background:#fffdf7;border:1px solid var(--line);text-decoration:none}.reading-link h3{font-size:23px;line-height:1.5}.reading-link small{color:var(--muted)}.reading-link:hover{border-color:var(--accent)}.reading-link .publisher{color:var(--accent);font-size:13px}.source{background:#e9e4d8;padding:26px;margin:26px 0}.source h4{margin-top:6px;font:22px/1.4 Georgia,serif}.meta{font-size:13px;color:var(--muted)}.source a{overflow-wrap:anywhere}.source blockquote{border-left:3px solid var(--accent);margin:22px 0;padding:0 0 0 20px}.source blockquote .en{font-size:24px;line-height:1.65;margin-bottom:8px}.source .read-more{display:inline-block;padding:9px 18px;background:var(--blue);color:white;text-decoration:none}.guide-label{font-size:12px;color:var(--accent);letter-spacing:.08em}.source-note{font-size:13px;color:var(--muted)}.questions{display:grid;grid-template-columns:1fr 1fr;gap:22px}.quiz{border:1px solid var(--line);padding:22px;background:#fffdf7;min-width:0}.quiz legend{font-size:18px;padding:0 6px}.quiz label{display:flex;align-items:start;gap:10px;padding:8px 12px;margin:8px 0;border:1px solid var(--line);cursor:pointer}.quiz input[type=radio]{flex:none;min-width:0;margin-top:8px;accent-color:var(--accent)}.quiz fieldset{padding:10px 0;border:0;min-width:0}.quiz .feedback{min-height:1.8em;font-size:14px;margin-top:15px}.quiz .selected-right{background:#e3ecdf;border-color:#547749}.quiz .selected-wrong{background:#f3dfdb;border-color:#a44f3f}.quiz button{padding:8px 14px}.quiz .retry{background:transparent;color:var(--blue)}.open-question{grid-column:1/-1}.open-question textarea{width:100%;min-height:100px;background:#fffdf7;border:1px solid var(--line);padding:12px;font:inherit}.toggle-notes{margin:30px 0}.guide-reading{max-width:1100px}.guide-reading .en{font-size:23px}.guide-reading .zh{color:#51554e}.reading-index-intro{max-width:750px}.filter-controls select{font:inherit;padding:12px;background:#fffdf7;border:1px solid var(--line)}.progress{font-size:14px;color:var(--muted)}.sticky-top{position:fixed;bottom:20px;right:20px;padding:8px 15px;background:var(--blue);color:white;text-decoration:none;z-index:3}.download-notice{max-width:850px}details.legacy-brands p{font-size:14px}.original-url{display:none}@media(max-width:950px){.reading-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.reading-grid,.questions{grid-template-columns:1fr}.source{padding:20px}.source h4{font-size:20px}.guide-reading .en{font-size:21px}.source blockquote .en{font-size:22px}.open-question{grid-column:auto}}@media print{.reading-grid,.toolbar,.sticky-top,.filter-controls,.stats{display:none}main>section:not(.series){display:none}.series{break-before:page}.questions{grid-template-columns:1fr 1fr}.quiz input,.quiz button,.open-question textarea,.progress{display:none}.quiz label{border:0;margin:0;padding:1px 0}.quiz .answer-details{display:block}.source{background:white;border:1px solid #aaa;padding:14px}.source blockquote .en,.guide-reading .en{font-size:12pt}.source .read-more{color:black;background:white;padding:0}.original-url{display:block;font-size:8pt;word-break:break-all}.quiz{padding:12px}.look-reference,.toggle-notes{display:none}.questions .en{font-size:10pt}}'''

def palette(cs):
 return '<div class="palette">'+''.join(f'<span style="flex:{x["target_percent"]};background:{x["hex"]}" title="{e(x["name_zh"])}"></span>' for x in cs)+'</div><div class="colour-labels">'+''.join(f'<span>{e(x["name_zh"])} {x["target_percent"]}%</span>' for x in cs)+'</div>'
def card(c):
 pieces=''.join(f'<li><b>{e(i["name_zh"])}</b><span class="en item-en">{e(i["name_en"])}</span>{p(i["construction_zh"])}<small>{e(i["design_item_id"])}</small></li>' for i in c['items'])
 ref=''
 if c.get('legacy_reference'):
  b64=base64.b64encode((ROOT/c['legacy_reference']).read_bytes()).decode()
  ref=f'<details class="reference"><summary>旧版参考图</summary><img loading="lazy" src="data:image/jpeg;base64,{b64}" alt="{e(c["card_id"])} 旧版参考图">{p("旧图仅供对比，不代表下列设计已出图。")}</details>'
 return f'<article class="look"><div class="eyebrow">{e(c["card_id"])} / DESIGN NOTES</div><h3>{e(c["title_zh"])}</h3>{p(c["title_en"],"en title-en")}{palette(c["palette"])}<h4>轮廓</h4>{p(c["silhouette_zh"])}<h4>材料</h4>{p(c["surface_study_zh"])}{p(c["design_en"],"en design-copy")}<h4>单品与结构</h4><ul class="items">{pieces}</ul>{p(c["scene_and_action_zh"])}{ref}</article>'

def question(q,uid,n):
 if q['type']=='discussion':
  return f'<article class="quiz open-question"><span class="eyebrow">03 / YOUR VIEW</span>{p(q["prompt_en"],"en")}<label for="{uid}-thought">写下你的看法（可选，不提交）</label><textarea id="{uid}-thought" placeholder="用中文或英文都可以。"></textarea>{p(q["rubric_zh"],"source-note")}</article>'
 options=''.join(f'<label><input type="radio" name="{uid}" value="{i}"><span class="en">{chr(65+i)}. {e(o)}</span></label>' for i,o in enumerate(q['options_en']))
 return f'<form class="quiz" data-answer="{q["answer_index"]}" data-explanation="{e(q["explanation_zh"])}"><span class="eyebrow">0{n+1} / {"READING" if n==0 else "WORD IN CONTEXT"}</span><fieldset><legend class="en">{e(q["prompt_en"])}</legend>{options}</fieldset><button type="submit">检查答案</button> <button type="reset" class="retry">重试</button><div class="feedback" aria-live="polite"></div><details class="answer-details"><summary>答案与依据</summary>{p(chr(65+q["answer_index"])+" · "+q["options_en"][q["answer_index"]],"en")}{p(q["explanation_zh"])}<small>{e(q["evidence_basis"])}</small></details></form>'

for s,r in zip(d['series'],curated):
 assert s['series_id']==r['series_id']
 s['legacy_reading_v4']=s.pop('reading'); s['legacy_questions_v4']=s.pop('questions');s['legacy_vocabulary_v4']=s.pop('vocabulary')
 s['reading']=r;s['questions']=r['questions'];s['research_status']='V5 public-source guide; V4 design notes retained separately'
d['meta'].update(version='5.0-public-reading',reading_count=30,question_count=90,objective_question_count=60,open_question_count=30,historical_review='30个来源正文已读取；原文观点以署名与机构归属呈现。',copyright_note='短摘录与编写导读，不收录第三方全文；原文链接供延伸阅读。')
(ROOT/'content.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))

def section(s):
 r=s['reading'];src=r['source'];sid=s['series_id']
 author=src['author'] or src['publisher']+'（未确认个人署名）'
 date=src['date'] or '未确认发布日期'
 source=f'''<aside class="source"><span class="eyebrow">THE SOURCE / {e(src['publisher'])}</span><h4 class="en"><a href="{e(src['url'])}" target="_blank" rel="noopener noreferrer">{e(src['title'])}</a></h4>{p(author+' · '+date,'meta')}<blockquote>{p(src['quote_en'],'en')}{p(src['quote_zh'],'zh')}<small>原文短摘录 · 中文为本版译文</small></blockquote><a class="read-more" href="{e(src['url'])}" target="_blank" rel="noopener noreferrer">感兴趣？读原文 ↗</a><p class="original-url">{e(src['url'])}</p>{p('公开页面核验：'+src['checked_on']+' · '+src['access_note'],'source-note')}</aside>'''
 brands=''.join(f'<article><h4>{e(b["name"])}</h4>{p(b["analysis_zh"])}{p(b["analysis_en"],"en")}</article>' for b in s['brand_comparisons'])
 return f'''<section class="series" id="{sid}" data-search="{e(s['title_zh']+' '+s['title_en']+' '+r['title_zh']+' '+src['publisher']+' '+src['title'])}" data-kind="{e(r['kind'])}"><header class="series-header"><span class="eyebrow">{sid} / {e(r['kind'])}</span><h2>{e(r['title_zh'])}</h2>{p(s['title_zh']+' / '+s['title_en'],'subtitle')}</header>{source}<div class="guide-reading"><span class="guide-label">READING GUIDE / 根据来源编写的导读，非媒体原文</span>{p(r['guide_en'],'en')}{p(r['guide_zh'],'zh')}{p(r['focus_zh'],'source-note')}</div><div class="discussion"><h3>读一点，想一点。</h3>{p('根据本页英文导读即可作答。两道选择题＋一道开放题；原文留给想继续了解的人。')}<div class="questions">{''.join(question(q,sid+'-q'+str(i),i) for i,q in enumerate(r['questions']))}</div></div><details class="toggle-notes"><summary>展开本系列 3 套服装设计参考</summary>{p('以下为 V4 保留的原创概念设计，与上方媒体文章分开；不表示作者或品牌认可这些方案。','source-note')}<div class="looks">{''.join(card(c) for c in s['cards'])}</div><details class="legacy-brands"><summary>V4 品牌研究笔记</summary>{p('保留作设计过程参考，未作为本版来源导读的事实依据。','source-note')}<div class="brands">{brands}</div></details></details><a class="top" href="#reading-index">↑ 回到阅读目录</a></section>'''
links=''.join(f'<a class="reading-link" href="#{s["series_id"]}" data-search="{e(s["title_zh"]+" "+s["title_en"]+" "+s["reading"]["title_zh"]+" "+s["reading"]["source"]["publisher"]+" "+s["reading"]["source"]["title"])}" data-kind="{e(s["reading"]["kind"])}"><span class="eyebrow">{s["series_id"]} / {e(s["reading"]["kind"])}</span><h3>{e(s["reading"]["title_zh"])}</h3><p class="publisher">{e(s["reading"]["source"]["publisher"])}</p><small>{e(s["title_zh"])} · 2 道选择题＋1 道开放题</small></a>' for s in d['series'])
kinds=''.join(f'<option>{e(k)}</option>' for k in dict.fromkeys(r['kind'] for r in curated))
JS='''
const search=document.querySelector('#search'),kind=document.querySelector('#kind');
function filter(){const q=search.value.trim().toLowerCase(),k=kind.value;let n=0;document.querySelectorAll('.series,.reading-link').forEach(el=>{const ok=(el.dataset.search+' '+(el.id||el.hash||'')).toLowerCase().includes(q)&&(!k||el.dataset.kind===k);el.hidden=!ok;if(ok&&el.classList.contains('series'))n++;});document.querySelector('#count').textContent=n+' 个系列';document.querySelector('#empty').hidden=n>0;}
search.addEventListener('input',filter);kind.addEventListener('change',filter);document.querySelector('#print').addEventListener('click',()=>window.print());
const attempted=new Map();function progress(){let correct=0;for(const v of attempted.values())if(v)correct++;document.querySelector('#progress').textContent=`已检查 ${attempted.size} / 60 题 · 当前答对 ${correct} 题`;}
document.querySelectorAll('form.quiz').forEach((f,i)=>{f.addEventListener('submit',ev=>{ev.preventDefault();const selected=f.querySelector('input:checked');const feedback=f.querySelector('.feedback');if(!selected){feedback.textContent='先选一个答案，再检查。';return;}const ok=Number(selected.value)===Number(f.dataset.answer);attempted.set(i,ok);f.querySelectorAll('label').forEach(l=>l.classList.remove('selected-right','selected-wrong'));selected.closest('label').classList.add(ok?'selected-right':'selected-wrong');feedback.textContent=(ok?'答对了。':'再想想。')+f.dataset.explanation;progress();});f.addEventListener('reset',()=>{f.querySelectorAll('label').forEach(l=>l.classList.remove('selected-right','selected-wrong'));f.querySelector('.feedback').textContent='';attempted.delete(i);progress();});});
// Printing includes the answer key even when its disclosure is collapsed on screen.
let printDetails=[];window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('.answer-details')].map(el=>[el,el.open]);printDetails.forEach(([el])=>el.open=true);});window.addEventListener('afterprint',()=>printDetails.forEach(([el,open])=>el.open=open));
'''
PAGE=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fashion Atlas V5 · 时尚阅读室</title><style>{CSS}</style></head><body><header class="masthead"><div class="eyebrow">FASHION ATLAS / THE READING ROOM / EDITION 05</div><h1>Fashion, with<br>a point of view.<span>读一点真正的时尚。</span></h1><p>从品牌、秀场到衣服背后的故事。精选公开网页中的评论、访谈与博物馆文章，读一段导读，做几道题；有兴趣，再去读原文。</p><div class="stats"><div><b>30</b><span>精选来源</span></div><div><b>60</b><span>选择题</span></div><div><b>30</b><span>开放讨论</span></div><div><b>90</b><span>服装参考方案</span></div></div></header><main><section id="reading-index"><span class="eyebrow">PICK A STORY</span><h2>今天想了解什么？</h2><p class="reading-index-intro">看看一个品牌怎样建立辨识度，一场秀为何引发争论，或一条裙子藏着怎样的工艺。每篇保留出处与短摘录，导读和题目可离线阅读。</p><div class="toolbar filter-controls"><label for="search">查找</label><input id="search" type="search" placeholder="品牌、主题、媒体或编号，如 Toteme / 旗袍 / S05"><label for="kind">类型</label><select id="kind"><option value="">全部类型</option>{kinds}</select><button id="print">打印 / 存为 PDF</button><span id="count">30 个系列</span></div><p id="progress" class="progress" aria-live="polite">已检查 0 / 60 题 · 当前答对 0 题</p><p id="empty" hidden>没有匹配的阅读。试试品牌名、系列名或编号。</p><div class="reading-grid">{links}</div><details class="notes"><summary>怎样阅读这本图鉴</summary><p>先读英文导读和原文短摘录，再做题。中文辅助理解；原文按钮通往来源网站。选择题附答案与依据，开放题没有唯一审美答案。作答只在当前页面中保留，刷新即清空，不会上传。</p><p>导读为本版根据来源编写，不冒充媒体原文；摘录旁保留媒体、署名和日期。未确认的信息明确标记，不以访问日期代替发布日期。公开可读不代表可全文转载，因此这里只收录短摘录与导读。核验日为 2026-10-29，外站可能调整访问条件。</p><p>部分主题使用相关的历史或视觉文化材料：例如 City Pop 配艺术家访谈、Ballet Noir 配舞台服装研究，均已标明关联范围。V4 的 90 套原创服装方案位于各篇末尾的折叠区。原始 V4 完整数据保留在 archive 目录。</p></details></section>{''.join(section(s) for s in d['series'])}</main><a class="sticky-top" href="#reading-index">↑ 目录</a><footer>Fashion Atlas V5 · 公开来源阅读版 · 2026-10-29<br>短摘录与出处归相应作者及机构；导读、题目与概念设计分开标注。网页离线可用，访问原文需联网。</footer><script>{JS}</script></body></html>'''
(ROOT/'index.html').write_text(PAGE)
(ROOT/'scripts/ui-v5.js').write_text(JS)
md=['# Fashion Atlas V5 · 公开来源阅读清单','\n每系列：来源、短摘录、双语导读、2道选择题与1道开放题。核验日：2026-10-29。\n']
for s in d['series']:
 r=s['reading'];src=r['source'];md.extend([f'## {s["series_id"]} {r["title_zh"]}',f'[{src["title"]}]({src["url"]})',f'{src["publisher"]} · {src["author"] or "未确认个人署名"} · {src["date"] or "未确认发布日期"}',f'> {src["quote_en"]}',src['quote_zh'],'\n**根据来源编写的导读**',r['guide_en'],r['guide_zh'],r['focus_zh']])
 for n,q in enumerate(r['questions'],1):
  md.append(f'\n{n}. {q["prompt_en"]}')
  if q.get('options_en'):
   md.extend(f'   - {chr(65+i)}. {o}' for i,o in enumerate(q['options_en']));md.append(f'   答案：{chr(65+q["answer_index"])}。{q["explanation_zh"]}')
  else:md.append('   '+q['rubric_zh'])
(ROOT/'阅读清单与题目_V5.md').write_text('\n\n'.join(md))
(ROOT/'README_V5.md').write_text('''# Fashion Atlas V5

双击 index.html 即可离线使用。30个系列各有一条核实过正文的公开来源、原文短摘录、双语导读、2道选择题与1道开放题，共90题。60道客观题支持检查、解释与重试。开放题仅在页面临时输入，不上传、不持久化。

原文链接需要联网；核验时公开可读，未来站点访问条件可能变化。未确认个人署名或日期时，页面如实标注。收藏品的制作日期与文章发布日期分开处理，不混用。

导读与题目由本版编写，明确区别于第三方短摘录。没有第三方全文、图片下载或付费内容绕过。V4的90套设计以折叠区保留，旧品牌研究笔记不是V5来源证据。

文件：
- index.html：可离线打开的完整阅读版，含交互练习与打印样式。
- content.json：完整V5数据与原有设计；旧阅读在 legacy_* 字段保存。
- 阅读清单与题目_V5.md：可编辑的全部来源、导读与题目。
- references/curated-readings-v5.json：30条来源与题目，可直接维护。
- archive/content-v4.json：原始V4数据。
- reference-images/：V4已有的9张旧版参考图。
- scripts/build_v5.py：从来源清单与V4数据重建V5。不要运行旧版 build.py，后者会重建V4。

重建：python3 scripts/build_v5.py

需要PDF时点击网页的“打印 / 存为 PDF”；本包不混入旧版PDF。
''')
print('Built V5:',len(PAGE),'characters; 30 readings, 60 interactive choices, 30 discussions')
