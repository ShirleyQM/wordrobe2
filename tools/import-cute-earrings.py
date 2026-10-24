"""Import supplied individual transparent ear motifs; preserve archive bytes."""
from pathlib import Path,PurePosixPath
from PIL import Image,ImageOps,ImageDraw,ImageFont
import zipfile,json,hashlib,shutil,sys,re
ROOT=Path(__file__).resolve().parents[1]
HOME=ROOT/'assets/materials/sources/cute-earrings-20261024'
ZIP=Path('C:/Users/Administrator/Downloads/%E5%8F%AF%E7%88%B1%E9%A3%8E%E8%80%B3%E9%A5%B0_40%E6%A0%BC%E7%8B%AC%E7%AB%8B%E9%80%8F%E6%98%8EPNG.zip')
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def extract():
 HOME.mkdir(parents=True,exist_ok=True);originals=HOME/'originals';originals.mkdir(exist_ok=True)
 shutil.copyfile(ZIP,HOME/'original-package.zip')
 with zipfile.ZipFile(ZIP) as z:
  for f in z.infolist():
   if f.is_dir():continue
   safe=PurePosixPath(f.filename.replace('\\','/'))
   assert len(safe.parts)==1 and safe.suffix.lower()=='.png' and f.file_size<20_000_000
   (originals/safe.name).write_bytes(z.read(f))
 files=sorted(originals.glob('*.png'));motifs=[p for p in files if '预览' not in p.stem]
 assert len(motifs)==40,len(motifs)
 font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
 sheet=Image.new('RGB',(1400,1350),'#e8e2db');draw=ImageDraw.Draw(sheet)
 for n,p in enumerate(motifs):
  im=Image.open(p).convert('RGBA');bbox=im.getbbox();print(json.dumps({'name':p.name,'size':im.size,'bbox':bbox,'alpha':im.getchannel('A').getextrema()}))
  assert bbox and im.getchannel('A').getextrema()[0]==0
  im=im.crop(bbox);im.thumbnail((145,128),Image.Resampling.LANCZOS);x=(n%8)*175;y=(n//8)*270
  for j,color in enumerate(['#d5ccc0','#33353e']):
   draw.rectangle((x+4,y+j*125,x+170,y+j*125+120),fill=color)
   thumb=im.copy();thumb.thumbnail((145,112),Image.Resampling.LANCZOS);sheet.paste(thumb,(x+(175-thumb.width)//2,y+j*125+(120-thumb.height)//2),thumb)
  draw.text((x+3,y+249),p.stem,font=font,fill='#39343c')
 sheet.save(HOME/'source-overview.jpg',quality=95)
 write(HOME/'source-list.json',[p.name for p in motifs])
 return motifs
def stage():
 groups={'大圆圈耳环':('large-hoop',35),'小圆圈耳环':('small-hoop',21),'巴洛克珍珠耳坠':('baroque-pearl',34),'爱心耳环':('heart',28),'珍珠耳钉':('pearl-stud',15)}
 files=json.loads((HOME/'source-list.json').read_text(encoding='utf8'));items=[];records=[]
 sheet=Image.new('RGB',(1440,2280),'#eee9e3');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18)
 for n,filename in enumerate(files):
  source=HOME/'originals'/filename;match=re.fullmatch(r'(.+)_款式([1-4])_(金色|银色)',source.stem);assert match
  group,style,color=match.groups();code,height=groups[group];metal='gold' if color=='金色' else 'silver'
  identity='jewel-cute-'+code+'-'+style+'-'+metal;folder=HOME/identity;folder.mkdir(exist_ok=True)
  shutil.copyfile(source,folder/'original.png');original=Image.open(source).convert('RGBA');bbox=original.getbbox();motif=original.crop(bbox)
  gap=max(20,motif.width//3);pair=Image.new('RGBA',(motif.width*2+gap,motif.height));pair.alpha_composite(ImageOps.mirror(motif),(0,0));pair.alpha_composite(motif,(motif.width+gap,0));pair.save(folder/'pair.png')
  size=(round(motif.width*height/motif.height),height);right=motif.resize(size,Image.Resampling.LANCZOS)
  front=Image.new('RGBA',(939,1676));front.alpha_composite(ImageOps.mirror(right),(404-size[0]//2,210));front.alpha_composite(right,(536-size[0]//2,210));front.save(folder/'front.png');Image.new('RGBA',front.size).save(folder/'back.png')
  item={'id':identity,'name':source.stem,'slot':'jewelry','directory':identity,'front':'front.png','back':'back.png','sha256':sha(folder/'front.png'),'backSha256':sha(folder/'back.png'),'originalSize':[939,1676],'canvas':[939,1676],'registrationProvided':True,'wearablePartition':True,'offlineWearableValidated':False,'accessoryType':'earrings','category':'earrings','material':metal,'thumbnailSource':'pair.png'}
  record={'id':identity,'name':source.stem,'designId':code+'-'+style,'variant':metal,'originalFile':'originals/'+filename,'originalSha256':sha(source),'originalPixelsPreserved':True,'pairMethod':'Original alpha/RGB retained; cropped to alpha bbox; left mirrored, right unchanged.','placement':{'canvas':[939,1676],'earPositions':[[404,210],[536,210]],'height':height,'scale':height/motif.height},'technicalPass':True,'visual_reviewed':True,'visualEvidence':'../source-overview.jpg','tryonPerformed':False,'wearable_validated':False,'recolor_ready':False}
  write(folder/'item.json',record);items.append(item);records.append(record)
  x=12+(n%4)*357;y=12+(n//4)*226;draw.rounded_rectangle((x,y,x+340,y+214),10,fill='#d5ccc0' if metal=='gold' else '#33353e')
  thumb=pair.copy();thumb.thumbnail((310,158),Image.Resampling.LANCZOS);sheet.paste(thumb,(x+(340-thumb.width)//2,y+8+(158-thumb.height)//2),thumb)
  draw.text((x+8,y+180),source.stem,font=font,fill='#3b343a' if metal=='gold' else '#f2eeeb')
 sheet.save(HOME/'overview.jpg',quality=95)
 write(HOME/'items.json',{'designCount':20,'variantCount':40,'items':records})
 if '--deliver' in sys.argv:write(HOME/'delivery.json',{'kind':'approved-front-only-registered-import','technicalPass':True,'count':40,'tryonPerformed':False,'items':items})
 print('40 matching pairs and registered canvases ready')
if __name__=='__main__':
 if '--stage' in sys.argv or '--deliver' in sys.argv:stage()
 else:extract()
