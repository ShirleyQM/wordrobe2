from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json,re
ROOT=Path(__file__).resolve().parent.parent
d=json.loads((ROOT/'content.json').read_text())
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.anchors=[];self.forms=0;self.choices=0;self.discussions=0;self.links=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if 'id'in a:self.ids.append(a['id'])
  if t=='a':
   self.links.append(a.get('href',''))
   if a.get('href','').startswith('#'):self.anchors.append(a['href'][1:])
  if t=='form':self.forms+=1
  if t=='input'and a.get('type')=='radio':self.choices+=1
  if t=='textarea':self.discussions+=1
page=Page();page.feed((ROOT/'index.html').read_text())
assert len(page.ids)==len(set(page.ids)),'Duplicate HTML id'
assert not(set(page.anchors)-set(page.ids)),'Broken internal anchors'
assert (page.forms,page.choices,page.discussions)==(60,180,30)
assert len(d['series'])==30
assert sum(len(s['cards']) for s in d['series'])==90
assert len(set(s['reading']['source']['url'] for s in d['series']))==30
positions=Counter()
for s in d['series']:
 r=s['reading'];src=r['source'];assert src['url'].startswith('https://')
 assert src['url'] in page.links
 assert 0<len(src['quote_en'].split())<=25
 assert len(r['questions'])==3
 for q in r['questions'][:2]:
  assert len(q['options_en'])==len(set(q['options_en']))==3
  assert 0<=q['answer_index']<3
  assert q['explanation_zh']
  positions[q['answer_index']]+=1
 word=re.search('“(.*?)”',r['questions'][1]['prompt_en']).group(1)
 assert word.lower() in (r['guide_en']+' '+src['quote_en']).lower()
assert positions=={0:20,1:20,2:20}
print('PASS: 30 unique sources; 90 preserved designs; 60 answer keys; 30 discussions; 180 choices; unique IDs; all local anchors; all vocabulary in context; answers A/B/C = 20/20/20.')
