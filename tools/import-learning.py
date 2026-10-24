import csv,json,urllib.request,io,re,hashlib,pathlib,datetime
root=pathlib.Path(__file__).resolve().parents[1];out=root/'assets/learning';cache=root/'outputs/learning-source';cache.mkdir(parents=True,exist_ok=True);(out/'sources').mkdir(parents=True,exist_ok=True)
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WordAtelier/1.0'}),timeout=60).read()
base='https://raw.githubusercontent.com/skywind3000/ECDICT/master/'
p=cache/'ecdict.csv'
if not p.exists(): p.write_bytes(get(base+'ecdict.csv'))
(out/'sources/ECDICT-LICENSE.txt').write_bytes(get(base+'LICENSE'))
extra='https://raw.githubusercontent.com/gungorkaya-eng/toefl-essential-vocabulary-dataset/main/'
toe=json.loads(get(extra+'toefl_essential_vocabulary.json'));(out/'sources/TOEFL-LICENSE.txt').write_bytes(get(extra+'LICENSE'));(cache/'toefl-original.json').write_text(json.dumps(toe,ensure_ascii=False),encoding='utf8')
if isinstance(toe,dict): toe=next((v for v in toe.values() if isinstance(v,list)),[])
examples={r['word'].lower():r for r in toe if isinstance(r,dict) and 'word'in r}
books={'gre':[],'toefl':[]};seen=set()
for r in csv.DictReader(p.open(encoding='utf-8-sig')):
 word=r['word'].lower();tags=r['tag'].split()
 if word in seen or not re.fullmatch('[a-z][a-z-]{2,24}',word) or not r['translation']:continue
 seen.add(word);e=examples.get(word,{})
 item={'id':word,'word':word,'meaning':r['translation'].replace('\\n','；'),'definition':e.get('definition_en') or r['definition'].replace('\\n','; '),'ipa':r['phonetic'],'example':e.get('example_sentence',''),'exampleTranslation':'','source':'ECDICT','exampleSource':'TOEFL Essential Vocabulary / wordlevel.net' if e.get('example_sentence') else '', 'rank':int(r['frq'] or r['bnc'] or 999999)}
 for book in books:
  if book in tags:books[book].append(item)
for book,rows in books.items():
 rows.sort(key=lambda r:r['rank']);(out/(book+'.json')).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf8')
manifest={'importedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'counts':{k:len(v)for k,v in books.items()},'sources':[{'name':'ECDICT','url':'https://github.com/skywind3000/ECDICT','license':'MIT','sha256':hashlib.sha256(p.read_bytes()).hexdigest()},{'name':'TOEFL Essential Vocabulary (AI-enriched)','url':'https://github.com/gungorkaya-eng/toefl-essential-vocabulary-dataset','credit':'https://wordlevel.net','license':'MIT','count':len(examples)}],'questionType':'Locally generated vocabulary exercises; not official ETS questions'}
(out/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(manifest,ensure_ascii=False))
