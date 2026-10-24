"""Slice the user's 5 x 8 transparent jewelry sheet without repainting."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont,ImageFilter
import numpy as np,json,hashlib,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
HOME=ROOT/'assets/materials/sources/modern-jewelry-20261024'
SOURCE=Path('C:/Users/Administrator/AppData/Local/Temp/codex-clipboard-e54563c8-7750-443f-a741-377d244a2c69.png')
GROUPS=[('flow','流线耳饰',34),('tassel','流苏耳饰',37),('wood','木制耳饰',32),('malachite','孔雀石耳饰',34),('geometric','几何不规则耳饰',34)]
XS=[77,246,415,582,748,915,1082,1248,1448];YS=[0,208,434,644,858,1086]
def write(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def seeded_component(mask,anchor):
 yy,xx=np.where(mask);assert len(xx)
 at=np.argmin((xx-anchor[0])**2+(yy-anchor[1])**2);seed=(int(yy[at]),int(xx[at]));keep=np.zeros(mask.shape,dtype='uint8');h,w=mask.shape;todo=[seed];keep[seed]=255
 while todo:
  y,x=todo.pop()
  for dy,dx in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
   ny,nx=y+dy,x+dx
   if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not keep[ny,nx]:keep[ny,nx]=255;todo.append((ny,nx))
 return keep
def run():
 HOME.mkdir(parents=True,exist_ok=True);shutil.copyfile(SOURCE,HOME/'source-sheet.png');source=Image.open(HOME/'source-sheet.png').convert('RGBA');items=[];records=[]
 font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18);sheet=Image.new('RGB',(1440,2250),'#e9e4de');draw=ImageDraw.Draw(sheet)
 for row,(code,label,height) in enumerate(GROUPS):
  for col in range(8):
   number=col+1;metal='gold' if col%2==0 else 'silver';zh='金色' if metal=='gold' else '银色';identity=f'jewel-modern-{code}-{number:02d}';name=f'{label}{number:02d}·{zh}'
   d=HOME/identity;d.mkdir(exist_ok=True)
   box=(XS[col]+4,YS[row]+3,XS[col+1]-4,YS[row+1]-3);raw=source.crop(box);raw.save(d/'source-crop.png');pixels=np.array(raw)
   anchor=((165 if col==0 else (XS[col]+XS[col+1])//2)-box[0],YS[row]+28-box[1]);core=seeded_component(pixels[:,:,3]>24,anchor)
   assert (core>0).sum()>400,(identity,'motif too small')
   support=np.array(Image.fromarray(core).filter(ImageFilter.MaxFilter(5)))>0
   alpha=pixels[:,:,3].copy();alpha[~support]=0;alpha[alpha<12]=0;pixels[:,:,3]=alpha;pixels[alpha==0,:3]=0
   clean=Image.fromarray(pixels);bbox=clean.getbbox();assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<raw.width and bbox[3]<raw.height,(identity,'cutoff',bbox)
   clean=clean.crop(bbox);clean.save(d/'slice.png');gap=max(15,clean.width//2);pair=Image.new('RGBA',(clean.width*2+gap,clean.height));pair.alpha_composite(ImageOps.mirror(clean),(0,0));pair.alpha_composite(clean,(clean.width+gap,0));pair.save(d/'pair.png')
   size=(round(clean.width*height/clean.height),height);right=clean.resize(size,Image.Resampling.LANCZOS);front=Image.new('RGBA',(939,1676));front.alpha_composite(ImageOps.mirror(right),(404-size[0]//2,210));front.alpha_composite(right,(536-size[0]//2,210));front.save(d/'front.png');Image.new('RGBA',front.size).save(d/'back.png')
   record={'id':identity,'name':name,'group':label,'metal':metal,'sourceSheet':'source-sheet.png','sourceSheetSha256':sha(HOME/'source-sheet.png'),'sourceCrop':list(box),'sliceCrop':list(bbox),'sourceRGBPreserved':True,'alphaCleanup':'Top-attachment connected motif, alpha >24 with 2px edge support; alpha <12 discarded. Grid/header and disconnected background excluded.','sliceSha256':sha(d/'slice.png'),'placement':{'canvas':[939,1676],'earPositions':[[404,210],[536,210]],'height':height,'scale':height/clean.height,'leftMirrored':True},'technicalPass':True,'tryonPerformed':False,'wearable_validated':False,'recolor_ready':False};write(d/'item.json',record);records.append(record)
   items.append({'id':identity,'name':name,'slot':'jewelry','directory':identity,'front':'front.png','back':'back.png','sha256':sha(d/'front.png'),'backSha256':sha(d/'back.png'),'originalSize':[939,1676],'canvas':[939,1676],'registrationProvided':True,'wearablePartition':True,'offlineWearableValidated':False,'accessoryType':'earrings','category':'earrings','material':code+'-'+metal,'thumbnailSource':'pair.png'})
   n=row*8+col;x=12+(n%4)*357;y=12+(n//4)*224;draw.rounded_rectangle((x,y,x+340,y+212),10,fill='#d2c8bb' if metal=='gold' else '#343640');thumb=pair.copy();thumb.thumbnail((310,166),Image.Resampling.LANCZOS);sheet.paste(thumb,(x+(340-thumb.width)//2,y+6+(166-thumb.height)//2),thumb);draw.text((x+10,y+181),name,font=font,fill='#3b353b' if metal=='gold' else '#f2eeeb')
 sheet.save(HOME/'overview.jpg',quality=95);write(HOME/'items.json',{'count':40,'groups':[g[1] for g in GROUPS],'items':records})
 if '--deliver' in sys.argv:write(HOME/'delivery.json',{'kind':'approved-front-only-registered-import','technicalPass':True,'count':40,'tryonPerformed':False,'items':items})
 print('40 motifs sliced, grid removed, matched pairs and registered canvases ready')
if __name__=='__main__':run()
