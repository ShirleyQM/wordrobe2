"""Register newly generated complete heads/short necks without inheriting the rejected jaw mask."""
from pathlib import Path
import argparse,json,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'assets/materials/characters';DEST=ART/'face-regenerated-v6';OUT=ROOT/'outputs/face-regenerated-v6'
OUT.mkdir(parents=True,exist_ok=True)
P=argparse.ArgumentParser();P.add_argument('--integrate',action='store_true');args=P.parse_args()
jobs=json.loads((DEST/'generation-final.json').read_text(encoding='utf8'))['jobs']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def archive(p):
    target=DEST/'archive'/p.relative_to(ROOT)
    if p.exists() and not target.exists():target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
def eye_landmarks(a):
    h,w=a.shape[:2];alpha=a[:,:,3]
    central=alpha[:,int(w*.44):int(w*.56)]>200
    top=int(np.where(central.sum(1)>8)[0][0])
    luma=a[:,:,:3].astype(float)@np.array([.2126,.7152,.0722])
    points=[]
    for lo,hi in [(.27,.45),(.55,.73)]:
        x0,x1=int(w*lo),int(w*hi);y0,y1=int(h*.48),int(h*.60)
        dark=np.clip((125-luma[y0:y1,x0:x1])/125,0,1)**2*(alpha[y0:y1,x0:x1]>220)
        yy,xx=np.indices(dark.shape);total=dark.sum()
        if total<5:raise ValueError('Cannot register compact eyes: inspect source landmarks')
        points.append((float((xx*dark).sum()/total+x0),float((yy*dark).sum()/total+y0)))
    return top,points
rows=[];tiles=[];chin_tiles=[]
body_source=ART/'separated-body-v1/body-0-0.png';body_array=np.array(Image.open(body_source).convert('RGBA'))
for j in jobs:
    id=j['id'];folder=DEST/id;raw_path=folder/'generated.png';raw=Image.open(raw_path).convert('RGBA');a=np.array(raw)
    top,points=eye_landmarks(a);ey=(points[0][1]+points[1][1])/2;cx=(points[0][0]+points[1][0])/2
    s=(178-86)/(ey-top);dx=470-cx*s;dy=86-top*s
    # One uniform transform for all face features. Natural jaw is the generated artwork itself.
    hd=Image.new('RGBA',(1000,1100));resized=raw.resize((round(raw.width*s*4),round(raw.height*s*4)),Image.Resampling.LANCZOS)
    hd.alpha_composite(resized,(round((dx-350)*4),round((dy-30)*4)));hd.save(folder/'head-hd.png')
    native=hd.resize((250,275),Image.Resampling.LANCZOS)
    layer=Image.new('RGBA',(939,1676));layer.alpha_composite(native,(350,30));r=np.array(layer)
    # Feather the bottom of the neck onto the existing body. No mask touches the chin.
    luminance=r[:,467:474,:3].mean((1,2))
    chin_y=min(range(242,274),key=lambda y:luminance[y+2]-luminance[y-2])
    # The generated neck base flares slightly. Constrain only its lateral neck tissue,
    # below a protected region extending past the generated jaw, to the body's neck width.
    xx=np.arange(939);neck_alpha=body_array[270,:,3].astype(float)/255
    start=chin_y-np.abs(xx-470)*.6+3
    for y in range(235,268):
        keep=np.maximum(np.clip((start+5-y)/5,0,1),neck_alpha)
        r[y,:,3]=np.rint(r[y,:,3]*keep).astype('uint8')
    fade=np.clip((298-np.arange(1676))/22,0,1)
    for y in range(268,298):r[y,:,3]=np.rint(r[y,:,3]*fade[y]*body_array[y,:,3]/255).astype('uint8')
    r[298:]=0;r[r[:,:,3]==0]=0;layer=Image.fromarray(r);layer.save(folder/'head-canvas.png')
    bodies=[]
    for t in range(2):
        for b in range(2):
            p=ART/'separated-body-v1'/f'body-{t}-{b}.png';base=Image.open(p).convert('RGBA');before=np.array(base)
            body=np.array(Image.alpha_composite(base,layer));body[300:]=before[300:]
            assert np.array_equal(body[300:],before[300:])
            Image.fromarray(body).save(folder/f'body-{t}-{b}.png');bodies.append({'file':f'body-{t}-{b}.png','protected_body_changes':0})
    preview=Image.open(folder/'body-0-0.png').crop((350,65,600,315)).resize((600,600),Image.Resampling.LANCZOS)
    bg=Image.new('RGBA',preview.size,'#e8eff9');bg.alpha_composite(preview);bg.convert('RGB').save(folder/'portrait-preview.png')
    tile=Image.new('RGB',(300,370),'#eeeae4');face=hd.crop((130,195,830,1100)).resize((300,388),Image.Resampling.LANCZOS);tile.paste(face,(0,25),face);ImageDraw.Draw(tile).text((8,7),id,fill='#293a36');tiles.append(tile)
    chin=Image.new('RGB',(350,220),'#eeeae4');patch=layer.crop((405,215,535,295)).resize((350,215),Image.Resampling.LANCZOS);chin.paste(patch,(0,5),patch);ImageDraw.Draw(chin).text((8,6),id,fill='#293a36');chin_tiles.append(chin)
    row={'id':id,'name':j['name'],'raw_sha256':sha(raw_path),'source_canvas':list(raw.size),'raw_landmarks':{'scalp_y':top,'eyes':points},'uniform_transform':{'scale_to_game':s,'left':dx,'top':dy},'game_eye_line':178,'game_scalp_top':86,'neck_shadow_y':chin_y,'head_holds_generated_neck':True,'jaw_mask':'none; generated anatomy preserved; only lower lateral neck transitions to the existing body','head':str((folder/'head-canvas.png').relative_to(ROOT)).replace('\\','/'),'head_hd':str((folder/'head-hd.png').relative_to(ROOT)).replace('\\','/'),'bodies':bodies,'visual_reviewed':False}
    if args.integrate:
        target=ART/'separated-body-v1/heads'/f'{id}.png';archive(target);shutil.copy2(folder/'head-canvas.png',target)
    rows.append(row);print(id,'scale',round(s,4),'raw eye line',round(ey,1),flush=True)
sheet=Image.new('RGB',(1200,740),'#eeeae4')
for i,im in enumerate(tiles):sheet.paste(im,(i%4*300,i//4*370))
sheet.save(DEST/'comparison.jpg',quality=96)
chins=Image.new('RGB',(1400,440),'#eeeae4')
for i,im in enumerate(chin_tiles):chins.paste(im,(i%4*350,i//4*220))
chins.save(DEST/'chin-review.jpg',quality=96)
manifest={'version':'face-regenerated-v6','source':'Built-in image_gen; seven individual generated full heads and short necks','integratedFaceIds':[r['id'] for r in rows] if args.integrate else [],'originalFaceSource':str((DEST/'unified-face/head-hd.png').relative_to(ROOT)).replace('\\','/'),'rows':rows}
(DEST/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('Built',len(rows),'heads; integrated',args.integrate,flush=True)
