"""Register a generated upper-neck insert; preserve the existing body below y268."""
from pathlib import Path
import json, shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/materials/characters'
DEST=ART/'body-neck-extension-v1'

def apply():
    generated=Image.open(DEST/'generated.png').convert('RGBA').resize((640,540),Image.Resampling.LANCZOS)
    # Interior skin from the generated neck; background never enters the insert.
    skin=np.array(generated.crop((225,30,420,240)).resize((59,38),Image.Resampling.LANCZOS))
    records=[]
    for name in ['body.png']+[f'body-{a}-{b}.png' for a in range(2) for b in range(2)]:
        source=ART/'clean-body-v4'/name
        original=np.array(Image.open(source).convert('RGBA'))
        archive=DEST/'archive'/name
        archive.parent.mkdir(exist_ok=True)
        if not archive.exists():shutil.copy2(source,archive)
        result=original.copy();patch=skin.copy()
        # Join to the actual neck's edge colors and silhouette, above its old cutoff only.
        lower=original[268,442:501]
        blend=np.clip((np.arange(38)-24)/13,0,1)[:,None,None]
        patch[:,:,:3]=np.rint(patch[:,:,:3]*(1-blend)+lower[None,:,:3]*blend).astype('uint8')
        patch[:,:,3]=lower[None,:,3]
        patch[:3,:,3]=np.rint(patch[:3,:,3]*np.array([0.35,0.7,1])[:,None]).astype('uint8')
        result[230:268,442:501]=patch
        assert np.array_equal(original[268:],result[268:])
        Image.fromarray(result).save(source)
        if name!='body.png':
            # Compatibility with already exported face packs and runtime URLs.
            Image.fromarray(result).save(ART/'face-regenerated-v7/body-support'/name)
            for group,ids in [('face-regenerated-v7',['unified-face','cool','gentle','poised','slender','soft-small','sharp-small']),('face-pure-v8',['pure-black','pure-brown'])]:
                for face in ids:
                    folder=ART/group/face
                    layer=Image.open(folder/'head-canvas.png').convert('RGBA')
                    Image.alpha_composite(Image.fromarray(result),layer).save(folder/name)
        records.append({'file':name,'unchanged_from_y':268,'extension_top':230})
    (DEST/'manifest.json').write_text(json.dumps({'version':1,'neck_in_body_layer':True,'records':records},indent=2),encoding='utf8')
    print('Extended base neck to y230; all pixels y268 and below unchanged before junction repair.')
    if (ART/'body-neck-join-v2/generated.png').exists():
        from repair_neck_join_v2 import apply as repair_join
        repair_join()

if __name__=='__main__':apply()
