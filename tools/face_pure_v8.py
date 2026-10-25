"""Import directly generated neckless heads; keep the body's neck in the body layer."""
from pathlib import Path
import argparse,json,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'assets/materials/characters';DEST=ART/'face-pure-v8';OUT=ROOT/'outputs/face-pure-v8'
OUT.mkdir(parents=True,exist_ok=True)
P=argparse.ArgumentParser();P.add_argument('--integrate',action='store_true');args=P.parse_args()
jobs=json.loads((DEST/'generation.json').read_text(encoding='utf8'))['jobs']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def archive(p):
    dest=DEST/'archive'/p.relative_to(ROOT)
    if p.exists() and not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
def landmarks(a):
    h,w=a.shape[:2];alpha=a[:,:,3];central=alpha[:,int(w*.44):int(w*.56)]>200
    top=int(np.where(central.sum(1)>8)[0][0]);luma=a[:,:,:3].astype(float)@np.array([.2126,.7152,.0722]);points=[]
    for lo,hi in [(.27,.45),(.55,.73)]:
        x0,x1=int(w*lo),int(w*hi);y0,y1=int(h*.46),int(h*.60)
        dark=np.clip((125-luma[y0:y1,x0:x1])/125,0,1)**2*(alpha[y0:y1,x0:x1]>220)
        yy,xx=np.indices(dark.shape);total=dark.sum()
        if total<5:raise ValueError('Cannot register eyes: inspect source')
        points.append((float((xx*dark).sum()/total+x0),float((yy*dark).sum()/total+y0)))
    return top,points
# Recover only the upper neck already belonging to the body. The head PNG never contains it.
support=ART/'face-regenerated-v7/body-support';bodies={(t,b):Image.open(support/f'body-{t}-{b}.png').convert('RGBA') for t in range(2) for b in range(2)}
rows=[];tiles=[];chins=[]
for j in jobs:
    id=j['id'];folder=DEST/id;raw_path=folder/'generated.png';raw=Image.open(raw_path).convert('RGBA');a=np.array(raw)
    top,eyes=landmarks(a);ey=(eyes[0][1]+eyes[1][1])/2;cx=(eyes[0][0]+eyes[1][0])/2;s=92/(ey-top);dx=470-cx*s;dy=86-top*s
    hd=Image.new('RGBA',(1000,1100));resized=raw.resize((round(raw.width*s*4),round(raw.height*s*4)),Image.Resampling.LANCZOS)
    hd.alpha_composite(resized,(round((dx-350)*4),round((dy-30)*4)))
    hd.save(folder/'head-hd.png')
    layer=Image.new('RGBA',(939,1676));layer.alpha_composite(hd.resize((250,275),Image.Resampling.LANCZOS),(350,30));layer.save(folder/'head-canvas.png')
    alpha=np.array(hd)[:,:,3];ys,xs=np.where(alpha>200)
    if int(ys.max())>=1060:raise ValueError(f'{id}: head bottom too low; inspect for unwanted neck')
    for (t,b),base in bodies.items():
        composed=np.array(Image.alpha_composite(base,layer));old=np.array(base);composed[300:]=old[300:]
        assert np.array_equal(composed[300:],old[300:])
        Image.fromarray(composed).save(folder/f'body-{t}-{b}.png')
    preview=hd.crop((130,195,830,1010)).resize((350,408),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',preview.size,'#eeeae4');bg.alpha_composite(preview);bg.convert('RGB').save(folder/'head-preview.png')
    im=Image.open(folder/'body-0-0.png').crop((350,65,600,315)).resize((600,600),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',im.size,'#e8eff9');bg.alpha_composite(im);bg.convert('RGB').save(folder/'portrait-preview.png')
    tile=Image.new('RGB',(350,435),'#eeeae4');tile.paste(preview,(0,27),preview);ImageDraw.Draw(tile).text((8,7),id,fill='#293a36');tiles.append(tile)
    chin=Image.new('RGBA',(350,210),'#eeeae4');chin.alpha_composite(hd.crop((220,700,760,1025)).resize((350,210),Image.Resampling.LANCZOS));ImageDraw.Draw(chin).text((8,6),id,fill='#293a36');chins.append(chin.convert('RGB'))
    if args.integrate:
        target=ART/'separated-body-v1/heads'/f'{id}.png';archive(target);shutil.copy2(folder/'head-canvas.png',target)
    rows.append({'id':id,'name':j['name'],'neckless':True,'generated_source_sha256':sha(raw_path),'source_size':list(raw.size),'source_landmarks':{'scalp_top':top,'eyes':eyes},'uniform_transform':{'scale_to_game':s,'left':dx,'top':dy},'head_alpha_bottom_hd':int(ys.max()),'jaw_postprocess':'none; generated head alpha preserved with one uniform registration','body_protected_from_y':268,'visual_reviewed':False})
    print(id,round(s,4),'head alpha bottom',int(ys.max()),flush=True)
sheet=Image.new('RGB',(1400,870),'#eeeae4');chin_sheet=Image.new('RGB',(1400,420),'#eeeae4')
for i,im in enumerate(tiles):sheet.paste(im,(i%4*350,i//4*435))
for i,im in enumerate(chins):chin_sheet.paste(im,(i%4*350,i//4*210))
sheet.save(DEST/'comparison.jpg',quality=96);chin_sheet.save(DEST/'chin-review.jpg',quality=96)
manifest={'version':'face-pure-v8','tool':'built-in image_gen','neckless':True,'integratedFaceIds':[r['id'] for r in rows] if args.integrate else [],'originalFaceSource':str((ART/'face-regenerated-v7/unified-face/head-hd.png').relative_to(ROOT)).replace('\\','/'),'necklessBodySupport':str(support.relative_to(ROOT)).replace('\\','/'),'bodySupportSource':'assets/materials/characters/clean-body-v4','unchanged_body_from_y':268,'rows':rows}
(DEST/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8');print('Built two pure-style neckless heads; integrated',args.integrate,flush=True)
