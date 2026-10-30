from pathlib import Path
import json
R=Path(__file__).resolve().parent.parent;P=R/'chapters/y2k';d=json.loads((P/'chapter.json').read_text());payload=json.dumps(d,ensure_ascii=False).replace('<','\\u003c')
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cyber Y2K · 完整学习章节</title><link rel="stylesheet" href="style.css"></head><body><header><a href="../../index.html#S04">返回30关图鉴</a><h1>Cyber Y2K</h1><p>记忆里的未来 · 完整学习章节</p><p id="progress" aria-live="polite"></p><small id="storage"></small><nav aria-label="章节导航"><button data-view="map">关卡地图</button><button data-view="words">词本与错题</button><button data-view="cards">我的收藏</button><button data-view="design">完整策划与内容</button></nav></header><main tabindex="-1"></main><noscript>试玩需要启用 JavaScript。可直接查看 <a href="design.md">完整策划说明</a>与 <a href="chapter.json">课文、单词和题目配置</a>。</noscript><footer>三张卡为原创重组设计；品牌系列供参考。课文与题目为原创教学内容，公开文章保留原站链接。存档仅在当前浏览器本地，不上传。</footer><script id="chapter-data" type="application/json">'''+payload+'''</script><script src="core.js"></script><script src="app.js"></script></body></html>'''
(P/'index.html').write_text(page);print('Built Y2K chapter:',len(page),'characters')
# Export a complete editable manuscript alongside the playable chapter.
if d.get('items'):
 md=['# Y2K 单品教学完整素材册','12件单品，24核心词＋8拓展词，4篇完整阅读，12道不计分随堂题＋36道计分关卡题。品牌原图链接原站；正文描述本节原创卡面设计，不代表品牌官方产品文案。']
 for c in d['cards']:
  md+=['## '+c['title']+' / '+c['brand']]
  for it in d['items']:
   if it['card_id']!=c['id']:continue
   md+=['### '+it['name_zh']+' · '+it['name_en'],'参考归属：'+it['reference_brand'],it['reference_scope_zh']]
   if it['source_url']:md+=['[品牌系列出处]('+it['source_url']+')']
   md += [it['body_en'],it['body_zh'],'观察：'+it['focus_zh'],'重点词：'+', '.join(it['word_ids']),'随堂题：'+it['practice']['prompt']]
   md+=['- '+chr(65+i)+'. '+v for i,v in enumerate(it['practice']['options'])]
   md+=['答案：'+it['practice']['answer'],it['practice']['explanation']]
 for label,words in [('24个核心词',d['words']),('8个拓展词',d['extension_words'])]:
  md+=['## '+label]
  for w in words:md+=['### '+w['en']+' '+w['pos'],w['zh'],w['collocation'],w['example'],w['translation']]
 md+=['## 四篇完整阅读']
 for t in d['texts']:
  md+=['### '+t['title_zh']+' / '+t['title'],str(t['word_count'])+' words · '+t['kind']]
  for n,en,zh in t['paragraphs']:md += ['#### '+n,en,zh]
  for src in d['sources']:
   if src['id']in t['source_ids']:md+=['[延伸来源：'+src['title']+']('+src['url']+')']
 md+=['## 六关计分题与依据']
 for l in d['levels']:
  md+=['### 第'+str(l['id'])+'关 '+l['title'],l['goal']]
  for n,q in enumerate(l['questions'],1):
   md += [str(n)+'. '+q['prompt']]
   md += ['- '+chr(65+i)+'. '+v for i,v in enumerate(q['options'])]if q['options']else['拼写题']
   md += ['答案：'+q['answer'],q['explanation'],'依据：'+q['evidence'],'关联单品：'+', '.join(q['item_ids'])]
 md+=['## 通关与奖励','每关6题，答对4／5／6题得1／2／3星。每题10XP，整节最高360XP、18星。第2／4／6关首次通过各得一张卡。重玩只按最佳正确数补XP差额；12道随堂题不加XP，不计入星级。']
 (P/'单品教学素材.md').write_text('\n\n'.join(md))
 print('Exported all bilingual item copy, 32 word entries, four readings and 48 exercises.')
