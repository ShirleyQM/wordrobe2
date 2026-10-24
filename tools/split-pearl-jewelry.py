"""Deterministic slices of the user supplied transparent sheet; no repainting."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps
import numpy as np,json,hashlib,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
HOME=ROOT/'assets/materials/sources/pearl-jewelry-20261024'
SOURCE=Path('C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-a777721b-c2ca-49ae-87f3-0cdceac3809b.png')
SPECS=[
 ('prong-pearl','四爪珍珠耳钉',10,[(25,85,185,270),(195,85,378,280)]),
 ('wrapped-pearl','缠绕珍珠耳钉',17,[(400,80,585,280),(605,80,805,290)]),
 ('baroque-pearl','巴洛克珍珠耳坠',34,[(820,0,990,320),(995,0,1170,320)]),
 ('bow-pearl','蝴蝶结珍珠耳坠',42,[(1180,0,1350,375),(1350,0,1536,380)]),
 ('pink-heart-pearl','粉心珍珠耳钉',20,[(50,300,245,490),(250,300,460,500)]),
 ('puffed-heart','爱心钻坠耳饰',20,[(485,320,650,500),(655,315,825,505)]),
 ('open-heart','镂空爱心耳饰',19,[(835,320,1035,495),(1040,320,1250,500)]),
 ('smooth-hoop','光面水滴大圈耳环',34,[(10,490,270,800),(275,490,535,800)]),
 ('braided-hoop','麻花大圈耳环',32,[(535,495,790,800),(790,490,1050,800)]),
 ('star-double-hoop','星芒双圈耳环',39,[(1070,490,1280,810),(1290,490,1515,810)]),
 ('diamond-huggie','排钻小圈耳扣',19,[(45,800,180,1000),(200,800,340,1000)]),
 ('twist-huggie','扭纹小圈耳扣',19,[(385,790,525,1000),(550,790,705,1000)]),
 ('beaded-huggie','圆珠小圈耳扣',20,[(785,790,940,1005),(965,790,1125,1005)]),
 ('bold-huggie','宽面小圈耳扣',18,[(1210,800,1355,1005),(1365,800,1515,1005)]),
]
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def component(mask):
 seen=np.zeros_like(mask);best=[];h,w=mask.shape
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  points=[];todo=[(y,x)];seen[y,x]=True
  while todo:
   cy,cx=todo.pop();points.append((cy,cx))
   for dy,dx in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
    ny,nx=cy+dy,cx+dx
    if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;todo.append((ny,nx))
  if len(points)>len(best):best=points
 keep=np.zeros_like(mask,dtype='uint8')
 for y,x in best:keep[y,x]=255
 return keep
def run():
 HOME.mkdir(parents=True,exist_ok=True);shutil.copyfile(SOURCE,HOME/'source-sheet.png');src=Image.open(HOME/'source-sheet.png').convert('RGBA')
 rows=[];records=[]
 font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',17)
 title=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',25)
 overview=Image.new('RGB',(1280,1620),'#eee9e3');draw=ImageDraw.Draw(overview)
 draw.text((24,16),'珍珠与爱心耳饰 · 14 款 × 金 / 银 · 28 组',font=title,fill='#302c35')
 for n,(design,name,height,boxes) in enumerate(SPECS):
  for variant,(metal,zh) in enumerate([('gold','金色'),('silver','银色')]):
   identity='jewel-pearl-'+design+'-'+metal;folder=HOME/identity;folder.mkdir(exist_ok=True)
   box=boxes[variant];raw=src.crop(box);raw.save(folder/'source-crop.png');a=np.array(raw)
   core=component(a[:,:,3]>24)
   assert (core>0).sum()>1000,identity
   support=np.array(Image.fromarray(core).filter(ImageFilter.MaxFilter(5)))>0
   alpha=a[:,:,3].copy();alpha[~support]=0;alpha[alpha<4]=0;a[:,:,3]=alpha;a[alpha==0,:3]=0
   clean=Image.fromarray(a);bbox=clean.getbbox();assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<raw.width and bbox[3]<raw.height,(identity,'crop cuts object',bbox)
   clean=clean.crop(bbox);clean.save(folder/'slice.png')
   # One original motif becomes a matched pair; retain full resolution slices.
   gap=max(12,clean.width//3);pair=Image.new('RGBA',(clean.width*2+gap,clean.height));pair.alpha_composite(ImageOps.mirror(clean),(0,0));pair.alpha_composite(clean,(clean.width+gap,0));pair.save(folder/'pair.png')
   size=(round(clean.width*height/clean.height),height);right=clean.resize(size,Image.Resampling.LANCZOS);left=ImageOps.mirror(right)
   front=Image.new('RGBA',(939,1676));front.alpha_composite(left,(404-size[0]//2,210));front.alpha_composite(right,(536-size[0]//2,210));front.save(folder/'front.png')
   Image.new('RGBA',front.size).save(folder/'back.png')
   record={'id':identity,'name':name+'·'+zh,'designId':design,'variant':metal,'slot':'jewelry','accessoryType':'earrings','sourceSheet':'source-sheet.png','sourceSheetSha256':sha(HOME/'source-sheet.png'),'sourceCrop':list(box),'sliceCrop':list(bbox),'sliceSha256':sha(folder/'slice.png'),'pairSha256':sha(folder/'pair.png'),'sourceRGBPreserved':True,'alphaCleanup':'Largest connected alpha>24 motif plus 2px edge; remove alpha<4 and disconnected background specks. Original RGB unchanged within nonzero cleaned alpha.','placement':{'canvas':[939,1676],'earAttachments':[[404,210],[536,210]],'height':height,'scale':height/clean.height,'leftMirrored':True,'rightMirrored':False},'technicalPass':True,'tryonPerformed':False,'wearable_validated':False,'recolor_ready':False,'originalLineartAvailable':False}
   write(folder/'item.json',record);records.append(record)
   rows.append({'id':identity,'name':record['name'],'slot':'jewelry','directory':identity,'front':'front.png','back':'back.png','sha256':sha(folder/'front.png'),'backSha256':sha(folder/'back.png'),'originalSize':[939,1676],'canvas':[939,1676],'registrationProvided':True,'wearablePartition':True,'offlineWearableValidated':False,'accessoryType':'earrings','category':'earrings','material':'gold-pearl' if metal=='gold' else 'silver-pearl'})
   idx=n*2+variant;x=16+(idx%4)*316;y=62+(idx//4)*222
   draw.rounded_rectangle((x,y,x+300,y+210),10,fill='#d4ccc1' if variant==0 else '#383a43')
   thumb=pair.copy();thumb.thumbnail((260,160),Image.Resampling.LANCZOS);overview.paste(thumb,(x+(300-thumb.width)//2,y+7+(160-thumb.height)//2),thumb)
   draw.text((x+10,y+174),record['name'],font=font,fill='#373139' if variant==0 else '#f5f1eb')
 overview.save(HOME/'overview.jpg',quality=94)
 write(HOME/'slices.json',{'designCount':14,'variantCount':28,'items':records})
 # Publish only after the standalone slice overview has been reviewed.
 if '--deliver' in sys.argv:write(HOME/'delivery.json',{'kind':'approved-front-only-registered-import','technicalPass':True,'count':len(rows),'tryonPerformed':False,'items':rows})
 print('28 source crops, cleaned slices, paired images and registered front/back files ready')
if __name__=='__main__':run()
