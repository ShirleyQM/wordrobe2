"""Deterministic local registration/feature extraction; all creative repairs are image_gen originals."""
import json, math, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/materials/characters/face-live-workflow-v1'
SOURCE=ROOT/'assets/materials/characters/face-variants-v1/original-head-neckless.png'
BOXES={'eye-r':(254,554,442,681),'eye-l':(518,554,710,681),'brow-r':(262,510,439,565),'brow-l':(519,510,705,565),'mouth':(394,767,566,883)}
def mask(size,fade=10):
    w,h=size;a=np.zeros((h,w),dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            d=min(x,y,w-1-x,h-1-y); t=max(0,min(1,d/fade));a[y,x]=round(255*t*t*(3-2*t))
    return Image.fromarray(a)
def patch(im,box,file):
    p=im.crop(box);a=np.asarray(mask(p.size)).copy()
    if file.startswith('mouth-'):
        yy,xx=np.indices(a.shape);oval=np.clip((1-((xx-86)/78)**2-((yy-58)/51)**2)*9,0,1);a=np.rint(a*oval).astype(np.uint8)
    a=np.minimum(a,np.asarray(p.getchannel('A')));p.putalpha(Image.fromarray(a));p.save(OUT/'parts'/file)
    return {'file':'parts/'+file,'rect':[box[0],box[1],box[2]-box[0],box[3]-box[1]]}
def main():
    (OUT/'parts').mkdir(exist_ok=True);(OUT/'normalized').mkdir(exist_ok=True)
    original=Image.open(SOURCE).convert('RGBA');original.save(OUT/'original.png')
    images={'original':original}
    for item in json.loads((OUT/'generation.json').read_text(encoding='utf8')):
        im=Image.open(OUT/'originals'/f"{item['tag']}.png").convert('RGBA').resize(original.size,Image.Resampling.LANCZOS)
        images[item['tag']]=im;im.save(OUT/'normalized'/f"{item['tag']}.png")
    parts={};base=original.copy()
    for key,box in BOXES.items():
        c=images['clean'].crop(box);base.paste(c,box[:2],mask(c.size));parts[key+'-clean']=patch(images['clean'],box,key+'-clean.png')
        for state in (['original','white-eyes','half','closed'] if key.startswith('eye') else ['original'] if key.startswith('brow') else ['original','smile','mouth-open','mouth-round']):parts[key+'-'+state]=patch(images[state],box,key+'-'+state+'.png')
    base.save(OUT/'parts/face-base.png')
    # Iris source pixels, independent of the eyelid. Shape is clipped by the eyeball opening at runtime.
    for key,cx,cy in [('eye-r',355,613),('eye-l',606,613)]:
        box=(cx-38,cy-38,cx+38,cy+38);p=original.crop(box);a=np.zeros((76,76),np.uint8)
        for y in range(76):
            for x in range(76):
                radius=math.hypot(x-38,y-38);a[y,x]=round(255*max(0,min(1,(36-radius)/1.5)))
        p.putalpha(Image.fromarray(a));p.save(OUT/'parts'/f'{key}-iris.png');parts[key+'-iris']={'file':f'parts/{key}-iris.png','rect':[box[0],box[1],76,76]}
    # Lip pigment masks: detect chroma only inside the per-pose lip region, excluding the mouth cavity.
    for state in ['original','smile','mouth-open','mouth-round']:
        box=BOXES['mouth'];p=images[state].crop(box);rgb=np.asarray(p)[:,:,:3].astype(float);red=(rgb[:,:,0]-rgb[:,:,1]);a=np.clip((red-46)/32,0,1)
        yy,xx=np.indices(a.shape);ellipse=((xx-86)/74)**2+((yy-52)/47)**2;a*=np.clip((1-ellipse)*8,0,1)
        if state=='mouth-open':a*=np.clip((((xx-86)/42)**2+((yy-56)/23)**2-1)*5,0,1)
        if state=='mouth-round':a*=np.clip((((xx-86)/21)**2+((yy-53)/18)**2-1)*5,0,1)
        rgba=np.full((*a.shape,4),255,np.uint8);rgba[:,:,3]=np.rint(a*255).astype(np.uint8);Image.fromarray(rgba).save(OUT/'parts'/f'lip-mask-{state}.png');parts['lip-mask-'+state]={'file':f'parts/lip-mask-{state}.png','rect':[box[0],box[1],p.width,p.height]}
    layers=[{'id':'face','name':'face','image':{'path':'parts/face-base.png','width':1000,'height':1100},'rect':{'left':0,'top':0,'width':1000,'height':1100},'tags':['face']}]
    for key,tag in [('eye-r-white-eyes',['eye','white','right']),('eye-l-white-eyes',['eye','white','left']),('eye-r-iris',['eye','iris','right']),('eye-l-iris',['eye','iris','left']),('brow-r-original',['brow','right']),('brow-l-original',['brow','left']),('mouth-original',['mouth','closed'])]:
        p=parts[key];x,y,w,h=p['rect'];layers.append({'id':key,'name':key,'image':{'path':p['file'],'width':w,'height':h},'rect':{'left':x,'top':y,'width':w,'height':h},'tags':tag})
    layout={'format':'psd2live-layout','version':1,'name':'OriginalFaceTrial','canvas':{'width':1000,'height':1100},'layers':layers}
    (OUT/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2),encoding='utf8')
    config={'version':1,'canvas':[1000,1100],'source':'original.png','sourceHash':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'parts':parts,'eyeCenters':{'eye-r':[355,613],'eye-l':[606,613]},'makeupMode':'lip recolor and additive eye-shadow/blush over original makeup; full bare-skin removal not claimed','production':'image_gen localized repairs + deterministic alpha and registration; browser sprite prototype; engine export separately reported'}
    (OUT/'manifest.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf8');print('Prepared',len(parts),'feature/mask assets; original preserved')
if __name__=='__main__':main()
