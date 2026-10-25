"""Remove the inherited extra jaw rim with a local alpha mask; retain artwork and registration."""
from pathlib import Path
import argparse, json, hashlib, shutil
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/materials/characters'
OUT=ROOT/'outputs/face-chin-cleanup'
MASKS=ART/'face-chin-cleanup-v1'
OUT.mkdir(parents=True,exist_ok=True);MASKS.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--game-only',action='store_true');args=parser.parse_args()
ids=['unified-face','cool','gentle','poised','slender','soft-small','sharp-small']
new_manifest=ART/'face-regenerated-v7/manifest.json'
if not new_manifest.exists():new_manifest=ART/'face-regenerated-v6/manifest.json'
if new_manifest.exists():
    replaced=json.loads(new_manifest.read_text(encoding='utf8')).get('integratedFaceIds',[])
    ids=[id for id in ids if id not in replaced]
    if not ids:
        print('Legacy jaw mask skipped: all seven faces were regenerated with complete head/neck anatomy.')
        raise SystemExit(0)
def load(p):return np.array(Image.open(p).convert('RGBA'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def original(p):
    backup=OUT/'before'/p.relative_to(ROOT)
    if not backup.exists():backup.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,backup)
    return backup
def save(a,p):
    Image.fromarray(a).save(p)
source=ART/'face-variants-v1/original-head-neckless.png'
before=load(original(source))
alpha=np.array(Image.open(MASKS/'jaw-before-alpha.png').convert('L')) if (MASKS/'jaw-before-alpha.png').exists() else before[:,:,3]
# Shift only the lower-jaw alpha boundary inward by 10 HD pixels (=2.5 game pixels).
# Nose, mouth, eyes, upper cheeks, ears and head placement receive no transform.
shift=np.zeros_like(alpha);shift[:-10]=alpha[10:]
weight=np.clip((np.arange(1100)-720)/70,0,1)[:,None]
clean=np.minimum(alpha,np.rint(alpha*(1-weight)+shift*weight).astype('uint8'))
Image.fromarray(alpha).save(MASKS/'jaw-before-alpha.png')
Image.fromarray(clean).save(MASKS/'jaw-clean-alpha.png')
old_native=np.array(Image.fromarray(alpha).resize((250,275),Image.Resampling.LANCZOS))
new_native=np.array(Image.fromarray(clean).resize((250,275),Image.Resampling.LANCZOS))
band=(old_native.astype(int)-new_native.astype(int)>0)
band[:185]=False
entries=[]
def record(p,old,new,method):
    changed=np.any(old!=new,axis=2)
    entries.append({'path':str(p.relative_to(ROOT)),'changed_pixels':int(changed.sum()),'sha256':sha(p),'method':method})
hd_paths=[source]+[ART/'face-variants-v1'/i/'head-hd.png' for i in ['cool','gentle','poised']]+[ART/'face-variants-v2'/i/'head-hd.png' for i in ['poised','slender','soft-small','sharp-small']]
if not args.game_only:
    for p in hd_paths:
        a=load(original(p));b=a.copy();b[:,:,3]=np.minimum(a[:,:,3],clean);b[b[:,:,3]==0]=0
        assert np.array_equal(a[:720],b[:720])
        save(b,p);record(p,a,b,'lower-jaw alpha only; all retained RGB exact')
def hd_for(id):
    if id=='unified-face':return source
    return ART/('face-variants-v2' if id in ['poised','slender','soft-small','sharp-small'] else 'face-variants-v1')/id/'head-hd.png'
def fix_registered(p,hd,backup_source=True):
    old=load(original(p) if backup_source else p);new=old.copy()
    native=np.array(Image.open(hd).convert('RGBA').resize((250,275),Image.Resampling.LANCZOS))
    for ny,nx in np.argwhere(band):
        y=int(ny)+30;x=int(nx)+350
        if y<215 or y>268 or old[y,x,3]==0:continue
        # An existing neck strip sits behind the cutout. Reuse that same neck's texture,
        # rather than leaving a transparent slit between the clean chin and the neck.
        donor=old[max(270,min(y+12,280)),x].copy()
        neck=(442<=x<=500 and donor[3]>30 and y>=238)
        front=native[ny,nx].astype(float);fa=front[3]/255
        if neck:
            new[y,x,:3]=np.rint(front[:3]*fa+donor[:3]*(1-fa)).clip(0,255)
            new[y,x,3]=old[y,x,3]
        else:new[y,x]=native[ny,nx]
    # Only the precomputed jaw edge ring may change.
    allowed=np.zeros(old.shape[:2],bool);allowed[30:305,350:600]=band
    new[(new[:,:,3]==0)&allowed]=0
    assert not np.any(np.any(old!=new,axis=2)&~allowed)
    save(new,p);record(p,old,new,'jaw-ring mask; existing neck behind cutout')
for id in ids:
    hd=hd_for(id)
    if not args.game_only:
        roots=[]
        if id!='unified-face':
            roots=[ART/('face-variants-v2' if id in ['poised','slender','soft-small','sharp-small'] else 'face-variants-v1')/id]
            if id=='poised':roots.append(ART/'face-variants-v1/poised')
        for folder in roots:
            body=folder/'body-0-0.png'
            fix_registered(body,hd)
            overlay=folder/'face-overlay.png';a=load(original(overlay));b=a.copy()
            full=np.zeros(a.shape[:2],np.uint8);full[30:305,350:600]=new_native
            b[:,:,3]=np.minimum(a[:,:,3],full);b[b[:,:,3]==0]=0
            save(b,overlay);record(overlay,a,b,'same clean jaw alpha')
            preview=folder/'portrait-preview.png';original(preview)
            im=Image.open(body).convert('RGBA').crop((350,30,600,305)).resize((600,660),Image.Resampling.LANCZOS)
            bg=Image.new('RGBA',im.size,'#e8eff9');bg.alpha_composite(im);bg.convert('RGB').save(preview)
    game=ART/'separated-body-v1/heads'/f'{id}.png'
    fix_registered(game,hd,backup_source=not args.game_only)
manifest=MASKS/'manifest.json'
if args.game_only and manifest.exists():
    prior=json.loads(manifest.read_text(encoding='utf-8')).get('files',[])
    merged={e['path']:e for e in prior}
    merged.update({e['path']:e for e in entries});entries=list(merged.values())
manifest.write_text(json.dumps({'method':'Local lower-jaw alpha mask; no feature repaint, head scaling or wardrobe edits','affected_face_ids':ids,'hd_inset_pixels':10,'protected_above_hd_y':720,'files':entries},ensure_ascii=False,indent=2),encoding='utf-8')
# Before/after at enlarged game scale, including the real neck join.
sheet=Image.new('RGB',(700,len(ids)*190),'#eeeae3');draw=ImageDraw.Draw(sheet)
for row,id in enumerate(ids):
    p=ART/'separated-body-v1/heads'/f'{id}.png'
    for col,q in enumerate([original(p),p]):
        im=Image.open(q).convert('RGBA').crop((405,218,535,286)).resize((325,170),Image.Resampling.LANCZOS)
        sheet.paste(im,(col*350,row*190+20),im)
        draw.text((col*350+5,row*190+3),id+(' / before' if col==0 else ' / clean'),fill='#283833')
sheet.save(OUT/'before-after.png')
print(json.dumps({'faces':len(ids),'files':len(entries),'preview':str(OUT/'before-after.png')},ensure_ascii=False))
