"""Register the generated neck repair beneath the unchanged head and fitted body."""
from pathlib import Path
import json,shutil,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'assets/materials/characters';DEST=ART/'body-neck-join-v2'
def apply():
    crop=Image.open(DEST/'generated.png').convert('RGBA').resize((270,324),Image.Resampling.LANCZOS)
    patch=np.array(crop)[165:255,70:192].astype(float) # game x410:532 y230:320
    records=[]
    for name in ['body.png']+[f'body-{a}-{b}.png' for a in range(2) for b in range(2)]:
        p=ART/'clean-body-v4'/name;before=np.array(Image.open(p).convert('RGBA'))
        archive=DEST/'archive'/name;archive.parent.mkdir(exist_ok=True)
        if not archive.exists():shutil.copy2(p,archive)
        # Reruns always start from the retained first input, never accumulate adjustments.
        after=before.copy();old=np.array(Image.open(archive).convert('RGBA'))[230:320,410:532].astype(float)
        yy,xx=np.indices((90,122));weight=np.minimum(np.clip((xx-3)/9,0,1),np.clip((118-xx)/9,0,1))*np.clip((89-yy)/20,0,1)
        weight*=patch[:,:,3]/255
        new=old.copy();new[:,:,:3]=np.rint(old[:,:,:3]*(1-weight[:,:,None])+patch[:,:,:3]*weight[:,:,None])
        # Generated curved edges can narrow the upper neck, but never enlarge the body.
        new[:,:,3]=np.minimum(old[:,:,3],patch[:,:,3])
        blend=np.clip((yy-65)/24,0,1);new[:,:,3]=np.rint(new[:,:,3]*(1-blend)+old[:,:,3]*blend)
        after[230:320,410:532]=new.astype('uint8')
        assert np.array_equal(after[320:],before[320:]);assert np.array_equal(after[:230],before[:230])
        Image.fromarray(after).save(p)
        if name!='body.png':
            Image.fromarray(after).save(ART/'face-regenerated-v7/body-support'/name)
            for group,ids in [('face-regenerated-v7',['unified-face','cool','gentle','poised','slender','soft-small','sharp-small']),('face-pure-v8',['pure-black','pure-brown'])]:
                for id in ids:
                    folder=ART/group/id;head=Image.open(folder/'head-canvas.png').convert('RGBA')
                    Image.alpha_composite(Image.fromarray(after),head).save(folder/name)
        records.append({'file':name,'unchanged_below_y':320})
    (DEST/'manifest.json').write_text(json.dumps({'version':2,'repair_rect':[410,230,122,90],'head_images_changed':False,'generated_sha256':hashlib.sha256((DEST/'generated.png').read_bytes()).hexdigest(),'records':records},indent=2),encoding='utf8')
    print('Neck junction repaired; head assets and body below y320 unchanged.')
if __name__=='__main__':apply()
