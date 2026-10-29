"""Validate the exported reading pack without changing repository files."""
from pathlib import Path
from html.parser import HTMLParser
import collections
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent

def words(value):
    return re.findall(r"[\w]+(?:[’'-][\w]+)*", value.lower())

class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=[]
        self.links=[]
        self.looks=0
        self.sections=0
        self.inline_images=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='a' and a.get('href','').startswith('#'):self.links.append(a['href'][1:])
        if tag=='article' and a.get('class')=='look':self.looks+=1
        if tag=='section' and a.get('class')=='series':self.sections+=1
        if tag=='img' and a.get('src','').startswith('data:image/jpeg;base64,'):self.inline_images+=1

def main():
    d=json.loads((ROOT/'content.json').read_text())
    series=d['series']
    assert len(series)==30, 'The reading pack must contain all 30 series.'
    assert len({s['reading']['body_en'] for s in series})==30, 'Repeated article body.'
    assert len({s['reading']['body_zh'] for s in series})==30, 'Repeated translation.'
    sizes=[]
    answers=collections.Counter()
    for s in series:
        r=s['reading'];body=r['body_en'];sizes.append(len(body.split()))
        assert 170<=len(body.split())<=260, (s['series_id'],'Unexpected reading length.')
        assert len(body.split('\n\n'))>=4, 'Lost paragraph structure.'
        assert not re.search(r'\b(our three|this collection|our collection|our designs|our cards)\b',body,re.I), 'Design-brief template in reading.'
        assert r['body_zh'] and len(s['vocabulary'])==6
        q,discussion=s['questions']
        assert len(q['options_en'])==3 and len(set(q['options_en']))==3
        assert 0<=q['answer_index']<3
        evidence=' '.join(words(q['evidence_en']))
        assert evidence in ' '.join(words(body)), (s['series_id'],'Answer evidence not in article.')
        assert q['evidence_type']=='quotation_from_this_original_reading'
        assert discussion['assessment']=='open'
        assert r['external_citations']==[] and r['citation_status']=='pending_external_source_access', 'An unverified source was presented as a citation.'
        answers[q['answer_index']]+=1
        assert len(s['cards'])==3 and len(s['brand_comparisons'])==3
    cards=[c for s in series for c in s['cards']]
    assert len({c['card_id'] for c in cards})==90
    assert len({c['design_en'] for c in cards})==90
    items=[i for c in cards for i in c['items']]
    assert len({i['design_item_id'] for i in items})==len(items)
    for c in cards:
        assert len(c['palette'])==3 and sum(v['target_percent'] for v in c['palette'])==100
        assert all(re.fullmatch(r'#[0-9a-fA-F]{6}',v['hex']) for v in c['palette'])
        assert c['illustration_status']=='not_generated'
        if c['legacy_reference']:assert (ROOT/c['legacy_reference']).is_file()
        assert 'tier' not in c and 'reward_item_ids' not in c
    page=Document();page.feed((ROOT/'index.html').read_text())
    assert len(page.ids)==len(set(page.ids)), 'Duplicate HTML anchor.'
    assert set(page.links)<=set(page.ids), 'Broken series link.'
    assert (page.sections,page.looks,page.inline_images)==(30,90,9)
    print(json.dumps({'status':'passed','readings':30,'card_designs':90,'brand_comparisons':90,'vocabulary_pairs':180,'reading_questions':30,'open_questions':30,'word_count_range':[min(sizes),max(sizes)],'answer_distribution':dict(answers),'working_anchors':True,'embedded_legacy_images':9,'verified_external_citations':0},ensure_ascii=False,indent=2))

if __name__=='__main__':
    try:main()
    except (AssertionError,ValueError,KeyError) as exc:
        print('FAILED:',exc,file=sys.stderr)
        raise SystemExit(1)
