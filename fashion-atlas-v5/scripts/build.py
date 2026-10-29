from pathlib import Path
import json, re, html, base64
from readings import READINGS
from designs import BLOCKS
from brands import BRANDS
from card_copy import COPY

ROOT = Path(__file__).parent
OUT = ROOT.parent
OUT.mkdir(exist_ok=True)
ORIGINAL = json.loads((OUT/'references/original-content-v2.json').read_text())
TITLES = {
0:('Mob Wife · 都市张扬','Mob Wife · Presence and Power'),
2:('Blokette · 球衣混搭','Blokette · Beyond the Stadium'),
3:('Cyber Y2K · 复古未来','Cyber Y2K · Yesterday’s Future'),
4:('Scandi · 北欧城市日常','Scandi · Everyday Decisions'),
8:('Coquette · 结饰与自主','Coquette · Ornament and Choice'),
13:('Art Deco · 几何与节拍','Art Deco · Geometry and Rhythm'),
14:('Equestrian · 马术语汇','Equestrian · Function and Symbol'),
16:('Sculptural Fashion · 雕塑服装','Sculptural Fashion · Space and Support'),
17:('Poetcore · 书写日常','Poetcore · Writing as an Action'),
18:('香港影像与街头','Hong Kong · Screen and Street'),
19:('City Pop · 音乐的视觉转译','City Pop · A Visual Translation'),
23:('Utility · 口袋与功能','Utility · Pockets and Histories'),
25:('Coastal Ease · 海边日常','Coastal Ease · Room to Move'),
26:('Ballet Noir · 演出间隙','Ballet Noir · Between Performances'),
}

SERIES = []
assert all(len(data)==30 for data in (ORIGINAL['series'], READINGS, BLOCKS, BRANDS, COPY))
for n, (old, ed, block, brands, copies) in enumerate(zip(ORIGINAL['series'], READINGS, BLOCKS, BRANDS, COPY)):
    assert len(ed)==10 and len(copies)==3 and len(brands)==3
    title_zh, title_en = TITLES.get(n,(old['title_zh'],old['title_en']))
    cards=[]
    for j, line in enumerate(block.splitlines()):
        title, shape, colours, surface, pieces, scene=line.split('|')
        zh,en=title.split('~')
        palette=[{'name_zh':s.split(':')[0],'hex':s.split(':')[1],'target_percent':r} for s,r in zip(colours.split(','),[60,30,10])]
        items=[]
        for k,raw in enumerate(re.split('[;；]',pieces)):
            a,b,c=raw.split('~')
            kind='component' if a in ['窄滚边','抽象线绣'] else 'prop' if a in ['旧数码相机','帆布折叠椅'] else 'design_item'
            items.append({'design_item_id':f'S{n+1:02d}-{chr(65+j)}-D{k+1:02d}', 'name_zh':a,'name_en':b,'construction_zh':c,'type':kind,'status':'concept_only'})
        card_id=f'C{n+1:02d}-{chr(65+j)}'
        cards.append({'card_id':card_id,'revision':3,'title_zh':zh,'title_en':en,'silhouette_zh':shape,'palette':palette,'surface_study_zh':surface,'design_en':copies[j], 'items':items,'scene_and_action_zh':scene,'illustration_status':'not_generated','legacy_reference':f'reference-images/{card_id}.jpg' if n<3 else None})
    series={'series_id':old['series_id'],'title_zh':title_zh,'title_en':title_en,'previous_title_zh':old['title_zh'],'category_zh':old['category_zh'],
        'reading':{'title_en':ed[0],'title_zh':ed[1],'body_en':ed[2],'body_zh':ed[3],'word_count':len(ed[2].split()),'status':'original_English_first_draft','external_citations':[],'citation_status':'pending_external_source_access'},
        'vocabulary':[dict(zip(['en','zh'],p.split('|'))) for p in ed[9]],
        'questions':[{'type':'reading_inference','prompt_en':ed[4],'options_en':ed[5],'answer_index':ed[6],'evidence_en':ed[7],'evidence_type':'quotation_from_this_original_reading'}, {'type':'discussion','prompt_en':ed[8],'assessment':'open','rubric_zh':'指出具体可观察的细节，并说明判断依据；开放题没有唯一审美答案。'}],
        'brand_comparisons':[dict(zip(['name','analysis_zh','analysis_en'],p.split('|'))) for p in brands],
        'research_status':'editorial analysis; historical attribution and specific collection claims require primary-source checking', 'cards':cards}
    SERIES.append(series)

CONTRASTS=[
('S08 / S27','Balletcore 与 Ballet Noir','练习、可脱卸软层、休息 → 演出间隙、结构衣身、长剪裁外层；不能只把粉色改黑。'),
('S09 / S08','Coquette 与 Balletcore','扣合与装饰的自主选择 → 练习层次的工作逻辑；缎带不承担相同任务。'),
('S06 / S18','Dark Academia 与 Poetcore','想象中的教育空间与门槛 → 实际书写、修改和注意力；避免同一件棕马甲换背景。'),
('S10 / S21','Boho Chic 与 Moto Boho','工艺描述与来源精确性 → 上下身材料重量的交换；不能靠多加皮夹克完成分组。'),
('S11 / S26','Dolce Vita 与 Coastal Ease','具体假日活动与鲜明配色 → 不限年龄的穿脱与活动便利；拒绝两组全是白麻衣。'),
('S14 / S30','Art Deco 与 Opera Night','重复几何、珠串运动与节拍 → 仪式中的等待、步行和聆听；前者不是后者的“复古皮肤”。'),
('S01 / S13','Mob Wife 与 90s Supermodel','公开出场感与权力图像 → 同年代中克制、强结构与色彩展示的并存；不共用黑色包身模板。'),
('S04 / S17','Cyber Y2K 与 Sculptural Fashion','技术想象、反光与可调整结构 → 支撑、负形和离身空间；不都等于银色盔甲。'),
]

DATA={'meta':{'version':'4.0-reading-rewrite','scope':'reading and fashion-card design only','series_count':30,'card_design_count':90,'new_images':0,'legacy_reference_images':9,'palette_note':'60/30/10 是服装及配件可见色面目标，不含人物皮肤、头发与背景；比例为设计指导，非图像测量结果。','historical_review':'正文重新按英语阅读写作；未加入无法访问核验的外部引文，评论来源仍待补齐。','production_scope':'收藏卡与服装设计说明，不是已制成的透明衣服、打样纸样或游戏接入文件。'},'series':SERIES,'cross_series_contrasts':CONTRASTS}
(OUT/'content.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2))
(OUT/'reference-images').mkdir(exist_ok=True)

e=lambda s:html.escape(str(s))
def p(s,cls=''):return f'<p class="{cls}">{e(s)}</p>'
def palette(cs):return '<div class="palette">'+''.join(f'<span style="flex:{c["target_percent"]};background:{c["hex"]}" title="{e(c["name_zh"])} {c["hex"]} · {c["target_percent"]}%"></span>' for c in cs)+'</div><div class="colour-labels">'+''.join(f'<span>{e(c["name_zh"])} {c["hex"]} · {c["target_percent"]}%</span>' for c in cs)+'</div>'
def card(c):
    reference=''
    if c['legacy_reference']:
        b64=base64.b64encode((OUT/c['legacy_reference']).read_bytes()).decode()
        reference=f'<details class="reference"><summary>查看旧版参考图 · 不代表新版款式</summary><img loading="lazy" src="data:image/jpeg;base64,{b64}" alt="{c["card_id"]} 旧版参考图"><p>仅保留作修订比较。上方设计说明为新版方案，尚未出图。</p></details>'
    items=''.join(f'<li><b>{e(i["name_zh"])}</b><span class="en item-en">{e(i["name_en"])}</span><p>{e(i["construction_zh"])}</p><small>{i["design_item_id"]}'+(' · 结构部件' if i['type']=='component' else ' · 场景道具' if i['type']=='prop' else '')+'</small></li>' for i in c['items'])
    return f'<article class="look"><div class="eyebrow">{c["card_id"]} / DESIGN 03</div><h3>{e(c["title_zh"])}</h3><p class="en title-en">{e(c["title_en"])}</p>{palette(c["palette"])}<h4>轮廓 / Silhouette</h4>{p(c["silhouette_zh"])}<h4>材料关系 / Surfaces</h4>{p(c["surface_study_zh"])}{p(c["design_en"],"en design-copy")}<h4>单品与结构 / Pieces</h4><ul class="items">{items}</ul><h4>卡面动作与场景</h4>{p(c["scene_and_action_zh"])}{reference}</article>'

def section(s):
    r=s['reading'];q,t=s['questions']
    answers=''.join(f'<li>{e(o)}</li>' for o in q['options_en'])
    brands=''.join(f'<article><h4>{e(b["name"])}</h4>{p(b["analysis_zh"])}{p(b["analysis_en"],"en")}</article>' for b in s['brand_comparisons'])
    vocab=''.join(f'<div><b class="en">{e(v["en"])}</b><span>{e(v["zh"])}</span></div>' for v in s['vocabulary'])
    return f'''<section class="series" id="{s['series_id']}" data-search="{e(s['title_zh']+' '+s['title_en']+' '+r['title_zh']+' '+r['title_en'])}">
    <header class="series-header"><span class="eyebrow">{s['series_id']} / {e(s['category_zh'])}</span><h2>{e(s['title_zh'])}</h2><p class="en subtitle">{e(s['title_en'])}</p></header>
    <div class="reading-head"><span class="eyebrow">READING / 原创双语阅读</span><h3>{e(r['title_zh'])}</h3><p class="en title-en">{e(r['title_en'])} · {r['word_count']} words</p><p class="citation-status">原创阅读稿 · 外部评论引用尚待核验补充</p></div>
    <div class="bilingual"><div class="en reading-text">{''.join(p(x) for x in re.split(r'\n\n|(?<=\.)\s+(?=Our |We |The three |Their |One card)',r['body_en']))}</div><div class="reading-text zh">{''.join(p(x) for x in r['body_zh'].split('\n\n'))}</div></div>
    <div class="vocab">{vocab}</div>
    <div class="discussion"><h3>阅读与观察 / Read & Reflect</h3><div class="discussion-grid"><div><p class="en"><b>{e(q['prompt_en'])}</b></p><ol type="A" class="en">{answers}</ol><details><summary>展开阅读答案</summary><p>答案：{chr(65+q['answer_index'])}</p><p class="en">{e(q['options_en'][q['answer_index']])}</p><p>依据：{e(q["evidence_en"])}（引自本篇原创正文，不是外部媒体引文。）</p></details></div><div><p class="en"><b>{e(t['prompt_en'])}</b></p><p>{e(t['rubric_zh'])}</p></div></div></div>
    <details class="brand-notes" open><summary>品牌比较：看设计方法，而非只记名字</summary><div class="brands">{brands}</div></details>
    <div class="look-head"><span class="eyebrow">THREE INTERPRETATIONS</span><h3>同一问题，三种穿法</h3><p>色面目标仅统计服装与配件；各卡均为新版设计，尚未出图。</p></div>
    <div class="looks">{''.join(card(c) for c in s['cards'])}</div>
    <a class="top" href="#reading-index">↑ 回阅读目录</a></section>'''

CSS='''
:root{--paper:#f6f2e9;--ink:#282e31;--muted:#656963;--line:#d6d5c9;--accent:#8e493b;--blue:#344d59}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:32px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.85 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}a{color:var(--blue);text-decoration-thickness:1px;text-underline-offset:4px}button,input{font:inherit}.masthead{padding:70px max(6vw,24px) 42px;background:#253e48;color:#f4ead7}.masthead .eyebrow{color:#b9c8c8}.masthead h1{font:clamp(42px,7vw,86px)/1.08 Georgia,serif;margin:22px 0}.masthead h1 span{font:500 clamp(22px,3vw,34px)/1.4 system-ui;display:block;margin-top:22px}.masthead p{max-width:790px;color:#e1e5dd}.stats{display:flex;flex-wrap:wrap;gap:28px;margin-top:30px}.stats b{font:32px Georgia}.stats span{font-size:13px;margin-left:10px}main{max-width:1450px;margin:auto;padding:44px max(4vw,22px)}.eyebrow{font:12px/1.5 system-ui;letter-spacing:.14em;color:var(--accent);text-transform:uppercase}h2{font-size:clamp(28px,3vw,44px);line-height:1.4;margin:12px 0}h3{font-size:23px;line-height:1.5;margin:12px 0}h4{font-size:15px;margin:23px 0 8px}p{margin:10px 0 18px}.en{font-family:Georgia,"Times New Roman",serif;line-height:1.8}.title-en{font-size:18px;color:var(--muted);margin:0 0 22px}.subtitle{font-size:22px;margin:4px 0;color:var(--muted)}.toolbar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:30px 0}input{border:1px solid #bfc5bc;background:#fffdf7;padding:12px 16px;flex:1;min-width:240px;border-radius:0}button{border:1px solid var(--blue);background:var(--blue);color:white;padding:12px 20px;cursor:pointer}button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible{outline:3px solid #d4a246;outline-offset:4px}.matrix-wrap{overflow:auto}.matrix{border-collapse:collapse;width:100%;min-width:900px}.matrix th{text-align:left;font-size:13px;letter-spacing:.08em;color:var(--muted);padding:14px 12px;border-bottom:2px solid var(--ink)}.matrix td{vertical-align:top;padding:18px 12px;border-bottom:1px solid var(--line);width:26%}.matrix td:first-child{width:22%}.matrix small{display:block;color:var(--muted);line-height:1.6}.matrix .palette{height:12px;margin:8px 0}.matrix a{font-weight:650}.series{margin-top:90px;border-top:1px solid var(--ink);padding-top:32px}.series-header{padding-bottom:26px;border-bottom:1px solid var(--line);margin-bottom:28px}.reading-head{margin:28px 0}.bilingual{display:grid;grid-template-columns:1fr 1fr;gap:52px}.reading-text{font-size:18px}.reading-text.en{font-size:21px;line-height:1.9}.reading-text.zh{line-height:2.1;color:#454b46}.vocab{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;border-block:1px solid var(--line);padding:22px 0;margin:28px 0}.vocab b,.vocab span{display:block}.vocab span{font-size:13px;color:var(--muted)}summary{cursor:pointer;font-weight:650;padding:14px 0}details{border-top:1px solid var(--line)}.brands{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;padding-bottom:22px}.brands p{font-size:14px}.brands .en{color:var(--muted);font-size:16px}.look-head{margin:42px 0 22px}.look-head p{font-size:14px;color:var(--muted)}.looks{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start}.look{background:#fffdf7;border:1px solid var(--line);padding:25px;min-width:0}.palette{display:flex;height:36px;overflow:hidden;border:1px solid #0001}.colour-labels{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:11px;line-height:1.7;color:var(--muted);margin:8px 0 20px}.design-copy{font-size:17px;color:#4d5550;padding-top:12px}.items{padding:0;list-style:none}.items li{padding:13px 0;border-bottom:1px solid #e3e1d6}.items p{font-size:14px;margin:5px 0}.items small{font-size:10px;letter-spacing:.04em;color:var(--muted)}.item-en{display:block;font-size:15px;color:var(--muted)}.reference{margin-top:20px;font-size:13px}.reference img{display:block;width:100%;max-width:360px;margin:auto}.discussion{background:#e8ebe2;padding:28px;margin:32px 0}.discussion-grid{display:grid;grid-template-columns:1fr 1fr;gap:45px}.discussion .en{font-size:18px}.discussion li{padding:4px 0}.top{display:block;font-size:13px;text-align:right}.contrast{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}.contrast article{border:1px solid var(--line);padding:20px}.contrast p{font-size:14px}.notes{font-size:14px;color:var(--muted);margin:40px 0}.notes a{overflow-wrap:anywhere}.empty{padding:24px;border:1px solid var(--line)}[hidden]{display:none!important}footer{padding:36px max(6vw,24px);background:#e7e4d9;font-size:13px}#count{font-size:13px;color:var(--muted)}@media(max-width:950px){.looks{grid-template-columns:1fr}.look{padding:24px}.brands{grid-template-columns:1fr}.bilingual{gap:28px}.vocab{grid-template-columns:repeat(3,1fr)}.contrast{grid-template-columns:1fr}.look .palette{max-width:500px}}@media(max-width:620px){.bilingual,.discussion-grid{grid-template-columns:1fr}.reading-text.en{font-size:20px}.masthead{padding-top:44px}.series{margin-top:60px}.stats{gap:18px}.vocab{grid-template-columns:repeat(2,1fr)}.discussion{padding:22px}.matrix{min-width:800px}}@media print{body{background:white;font-size:11pt}.masthead{background:white!important;color:black;padding:0}.masthead p,.masthead .eyebrow{color:black}.masthead h1{font-size:36pt}.toolbar,.top,.reference,.matrix-wrap,.no-print{display:none}main{padding:0;max-width:none}.series{break-before:page;margin-top:0}.bilingual{gap:20px}.reading-text,.reading-text.en{font-size:11pt}.looks{grid-template-columns:repeat(3,1fr);gap:9px}.look{padding:12px;break-inside:auto}.look h3{font-size:14pt}.look p,.items p,.design-copy{font-size:9pt}.colour-labels{font-size:7pt}.brands{gap:15px}.brands p,.brands .en{font-size:9pt}.palette{print-color-adjust:exact;-webkit-print-color-adjust:exact}.discussion{padding:15px}.discussion .en{font-size:10pt}h2,h3,h4{break-after:avoid}.notes{font-size:9pt}}
'''

CSS += '''.reading-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.reading-link{display:block;padding:24px;background:#fffdf7;border:1px solid var(--line);text-decoration:none}.reading-link h3{font-size:25px;font-weight:500;line-height:1.3;margin:14px 0}.reading-link p{color:var(--ink);margin:12px 0}.reading-link small{color:var(--muted)}.reading-link:hover{border-color:var(--accent)}.design-overview{margin-top:70px}.citation-status{font-size:12px;color:var(--muted)}@media(max-width:900px){.reading-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.reading-grid{grid-template-columns:1fr}}@media print{main>section:not(.series){display:none}.bilingual,.discussion-grid{grid-template-columns:1fr 1fr}.brands{grid-template-columns:repeat(3,1fr)}.vocab{grid-template-columns:repeat(6,1fr)}body{line-height:1.65}.look h4{font-size:9pt;margin:14px 0 5px}.look .items b{font-size:9pt}.look .items li{padding:7px 0}.look .items small{font-size:6pt}.look .items .en{font-size:8pt}.masthead{margin-bottom:20mm}.series-header{margin-bottom:12px;padding-bottom:12px}.look-head{margin:20px 0 12px}.notes{display:none}}'''
rows=''.join('<tr data-search="'+e(s['series_id']+' '+s['title_zh']+' '+s['title_en']+' '+s['reading']['title_zh']+' '+s['reading']['title_en'])+'"><td><a href="#'+s['series_id']+'">'+s['series_id']+' '+e(s['title_zh'])+'</a><small>'+e(s['reading']['title_zh'])+'</small></td>'+''.join('<td><b>'+e(c['title_zh'])+'</b><small>'+e(c['silhouette_zh'])+'</small>'+palette(c['palette'])+'</td>' for c in s['cards'])+'</tr>' for s in SERIES)
contrasts=''.join(f'<article><span class="eyebrow">{a}</span><h4>{b}</h4><p>{c}</p></article>' for a,b,c in CONTRASTS)
sources=''.join('<li><a href="'+e(r['url'])+'">'+e(r['url'])+'</a></li>' for r in json.loads((OUT/'references/source-access.json').read_text()))

reading_links=''.join('<a class="reading-link" href="#'+s['series_id']+'" data-search="'+e(s['series_id']+' '+s['title_zh']+' '+s['title_en']+' '+s['reading']['title_zh']+' '+s['reading']['title_en'])+'"><span class="eyebrow">'+s['series_id']+' / '+e(s['title_en'])+'</span><h3 class="en">'+e(s['reading']['title_en'])+'</h3><p>'+e(s['reading']['title_zh'])+'</p><small>'+str(s['reading']['word_count'])+' words · 中英对照</small></a>' for s in SERIES)
PAGE=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fashion Atlas V4 · 阅读与服装设计稿</title><style>{CSS}</style></head><body>
<header class="masthead"><div class="eyebrow">FASHION ATLAS / READING & DESIGN / EDITION 04</div><h1>Clothes with<br>Something to Say.<span>让衣服有话可说。</span></h1><p>从一件衣服、一种面料、一幅街景开始。30篇双语短文，聊穿衣里值得多看一眼的细节；90套服装方案另作设计参考。</p><div class="stats"><div><b>30</b><span>重写的双语阅读</span></div><div><b>90</b><span>差异化造型方案</span></div><div><b>90</b><span>品牌比较条目</span></div><div><b>0</b><span>本轮新生成图片</span></div></div></header>
<main><section id="reading-index"><span class="eyebrow">THE READING ROOM</span><h2>先读一篇。</h2><p>每篇从具体细节开始，附中文对照、词汇与阅读题。服装方案放在正文之后，可以分开阅读。</p><div class="toolbar"><label class="sr-label" for="search">查找系列</label><input id="search" type="search" placeholder="搜索编号或中英文系列名，如 S05 / 北欧 / Ballet"><button id="print" type="button">打印 / 存为 PDF</button><span id="count" aria-live="polite">30 个系列</span></div><p id="empty" class="empty" hidden>没有匹配的系列。试试系列编号、中文名或英文名。</p><div class="reading-grid">{reading_links}</div></section><section id="overview" class="design-overview"><span class="eyebrow">DESIGN INDEX</span><h2>先看整套的差异。</h2><p>每组的三张卡改变轮廓、材质或使用方式；同款换色不计作另一套设计。色面比例按主色 60%、辅色 30%、点色 10% 组织，含鞋与配件，不含人物及背景。</p><div class="matrix-wrap"><table class="matrix"><thead><tr><th>系列与核心问题</th><th>造型 A</th><th>造型 B</th><th>造型 C</th></tr></thead><tbody>{rows}</tbody></table></div></section>
<section><h3>容易混淆的系列，怎样分开？</h3><div class="contrast">{contrasts}</div></section>
<details class="notes"><summary>版本说明与资料边界</summary><p>V4重写30篇正文、中文译文、词汇与题目，保留V3的90套设计及品牌比较。取消等级、奖励和游戏接口字段。原始文件独立保留，没有覆盖现有游戏或素材库。单品结构说明以中文为制作主稿，附英文名称与每套英文设计解读；这些是概念说明，尚未打样或生成透明服装。</p><p>阅读为原创编辑稿，讨论设计与文化问题。品牌条目是比较线索，不是品牌合作或命名起源证明。新版已删除未经核实的“某人某年首创”式断言。具体历史归属、系列日期与藏品论证仍需一手资料核查，本轮不标作研究定稿。</p><p>以下为建议研究入口。本环境请求被网络代理以403拒绝，未能验证页面内容；链接不作为已阅读的引文。每个研究主张需在发表前补具体文章、藏品编号、日期与所支持的句子。</p><ul>{sources}</ul><p>旧版9张图片仅在对应卡下折叠展示，均标记为旧版参考，不代表新版方案，也不作为成图验收记录。</p></details>
{''.join(section(s) for s in SERIES)}</main><footer>Fashion Atlas · V4 Reading Edition / 2026-10-29 · 原创阅读与概念设计稿。可离线打开，无第三方字体、接口或脚本依赖。</footer>
<script>
const search=document.getElementById('search');
function filter(){{const q=search.value.trim().toLowerCase();let n=0;document.querySelectorAll('.series').forEach(s=>{{const match=(s.id+' '+s.dataset.search).toLowerCase().includes(q);s.hidden=!match;if(match)n++;}});document.querySelectorAll('.reading-link').forEach(a=>a.hidden=!a.dataset.search.toLowerCase().includes(q));document.querySelectorAll('.matrix tbody tr').forEach(tr=>tr.hidden=!tr.dataset.search.toLowerCase().includes(q));document.getElementById('count').textContent=n+' 个系列';document.getElementById('empty').hidden=n!==0;}}
search.addEventListener('input',filter);document.getElementById('print').addEventListener('click',()=>window.print());
</script></body></html>'''
(OUT/'index.html').write_text(PAGE)

md=['# Fashion Atlas V4：阅读与服装设计主稿','\n范围：原创双语阅读、品牌比较、90套服装与卡面设计。本轮不出新图、不接游戏。','\n配色面积为设计目标，按服装与配件统计，不含人物和背景。']
for s in SERIES:
    r=s['reading'];md.extend([f'\n## {s["series_id"]} {s["title_zh"]}',f'\n### {r["title_zh"]} / {r["title_en"]}',r['body_en'],r['body_zh'],'\n### 品牌比较'])
    for b in s['brand_comparisons']:md.extend([f'\n**{b["name"]}**',b['analysis_zh'],b['analysis_en']])
    md.append('\n### 阅读与观察')
    q,t=s['questions'];md.extend([q['prompt_en'],*[f'{chr(65+i)}. {x}' for i,x in enumerate(q['options_en'])],f'答案：{chr(65+q["answer_index"])}',t['prompt_en'],t['rubric_zh']])
    md.append('\n### 词汇与设计表达')
    md.extend([f'- {v["en"]}：{v["zh"]}' for v in s['vocabulary']])
    for c in s['cards']:
        md.extend([f'\n### {c["card_id"]} {c["title_zh"]} / {c["title_en"]}',f'轮廓：{c["silhouette_zh"]}', '配色：'+'；'.join(f'{v["name_zh"]} {v["hex"]} {v["target_percent"]}%' for v in c['palette']),f'材料：{c["surface_study_zh"]}',c['design_en'],'\n单品：'])
        md.extend([f'- {i["design_item_id"]} {i["name_zh"]} / {i["name_en"]}：{i["construction_zh"]}'+('【结构部件】' if i['type']=='component' else '【场景道具】' if i['type']=='prop' else '') for i in c['items']])
        md.append('卡面：'+c['scene_and_action_zh'])
md.extend(['\n## 研究状态','原创编辑与设计稿；具体起源、日期与系列归属尚未完成一手资料核查。建议研究入口见 references/source-access.json，本轮请求均被代理403拒绝，不能当作已核实引文。','\n## 跨系列区别'])
md.extend([f'- {a} {b}：{c}' for a,b,c in CONTRASTS])
(OUT/'设计与阅读主稿.md').write_text('\n\n'.join(md))

CHANGELOG='''# V2 → V4 修订说明

本轮范围：素材内容与设计；不修改游戏，不生成新图片。

## 实质修订

- 30篇从英语重新写作的独立阅读及中文对照，去掉设计说明书式正文；另有90段逐套英文设计解读。
- 每系列设具体问题：身份、劳动、阶层、运动、观看、文化借用、材质或结构，不以抽象形容词填篇幅。
- 90套造型逐套指定轮廓、三色面积目标、表面关系、单品结构和动作；三套不是三次换色。
- 90条中英文品牌比较，区别历史对象、当代比较与大众零售语境，不把品牌关联写成风格起源。
- 180组中英词汇与设计表达；每系列1道阅读辨析与1项开放设计观察，共60项，不保留无意义重复题。
- 单品重新建立中英文对应及设计ID；结构部件和场景道具独立标记，不冒充可穿脱单品。
- 8组跨系列对照防止主题重叠；澄清 Coquette/洛可可、港风/千禧、Cyber Y2K/太空时代等混合分类。
- 取消等级、奖励、积分及游戏接入字段，保留原系列编号和卡编号以便追踪。

## 原版已确认问题举例

- S01-I09：中文“墨镜”，英文“Statement belt”。
- S02-I06：中文“厚底靴”，英文“Sequin skirt”。
- S02-I08：中文“银链项链”，英文“Combat boots”。
- S02-I10：中文“链条包”，英文“Digital camera”。
- 原版三卡的搭配提示多为清单切片，存在同时列两双鞋、只有配件而无完整服装等情况。
- 原版 S04 等填空将形容词直接放在 features 后面，且答案可缺乏唯一语义依据。

## 文件

- index.html：可离线单独打开的主图鉴，内嵌9张旧参考图；支持系列搜索与打印。
- content.json：新版编辑与设计数据，供继续修改。
- 设计与阅读主稿.md：便于批注、复制的全文。
- references/original-content-v2.json：原始数据原样保留；没有默默覆盖或假称逐条修复原版303件物品。
- reference-images/：原版9张参考，不对应新版款式。
- references/source-access.json：研究入口访问记录，不是已读参考文献。
- validation.json：交付结构与一致性检查记录。

## 当前完成度

已完成：30篇英语优先写作的新正文、中文对照、对应词汇与阅读题；保留90套造型规划、双语品牌比较与离线图鉴。
未完成：一手来源逐条核查、具体系列与藏品案例的研究扩写、成图、打样、透明服装拆件与逐件视觉验收。
单品结构说明以中文为主；英文覆盖阅读、品牌比较、词汇、名称和每套设计解读，不是双语生产技术包。
本版不将概念说明冒充已经制作或验收的衣服。
'''
(OUT/'修订说明.md').write_text(CHANGELOG)

if __name__=='__main__': print('Built',OUT)
