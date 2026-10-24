from email.utils import parsedate_to_datetime
import urllib.request,xml.etree.ElementTree as ET,json,pathlib,datetime,html,re,hashlib
from html.parser import HTMLParser
root=pathlib.Path(__file__).resolve().parents[1];out=root/'assets/learning/articles.json'
class Paragraphs(HTMLParser):
 def __init__(self):super().__init__();self.depth=0;self.skip=0;self.text=[];self.rows=[]
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
  if t=='p':self.depth+=1;self.text=[]
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip=max(0,self.skip-1)
  if t=='p' and self.depth:
   s=re.sub(r'\s+',' ',''.join(self.text)).strip()
   if len(s)>35:self.rows.append(s)
   self.depth-=1
 def handle_data(self,s):
  if self.depth and not self.skip:self.text.append(s)
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WordAtelierReader/1.0'}),timeout=20).read()
feeds=[('NASA','https://www.nasa.gov/feed/'),('VOA Learning English','https://learningenglish.voanews.com/api/zkm-ql-vomx-tpej-rqi')];items=[];errors=[]
for source,url in feeds:
 try:
  tree=ET.fromstring(get(url))
  for r in tree.findall('.//item')[:8]:
   title=html.unescape(r.findtext('title') or '');link=r.findtext('link') or '';body=r.findtext('{http://purl.org/rss/1.0/modules/content/}encoded') or '';mode='article'
   if not body:body=r.findtext('description') or '';mode='summary'
   p=Paragraphs();p.feed(body);paragraphs=p.rows
   if not paragraphs:
    clean=html.unescape(re.sub('<[^>]+>',' ',body));paragraphs=[re.sub(r'\s+',' ',clean).strip()]
   if not title or not any(paragraphs):continue
   items.append({'id':hashlib.sha256(link.encode()).hexdigest()[:16],'title':title,'url':link,'source':source,'publishedAt':r.findtext('pubDate'),'paragraphs':paragraphs[:35],'contentMode':mode,'rights':'NASA editorial text; original link retained; no third-party images' if source=='NASA' else 'VOA RSS summary; original link retained'})
 except Exception as e:errors.append({'source':source,'message':str(e)})
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
if not items:
 if out.exists():
  old=json.loads(out.read_text(encoding='utf8'));old.update({'lastAttemptAt':now,'errors':errors});out.write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf8')
 raise SystemExit('No feeds available: '+str(errors))
items.sort(key=lambda r:parsedate_to_datetime(r['publishedAt']).timestamp() if r['publishedAt'] else 0,reverse=True)
out.write_text(json.dumps({'updatedAt':now,'lastAttemptAt':now,'items':items,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'count':len(items),'sources':list(set(i['source']for i in items)),'errors':errors},ensure_ascii=False))
