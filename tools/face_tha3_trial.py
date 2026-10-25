"""Reproducible THA3 inference on the unchanged original face. No hand-drawn expression patches."""
from pathlib import Path
import os, sys, json, math, time, hashlib, argparse
from PIL import Image, ImageDraw
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT/'.tools/face-workflow/tha3'
OUT=ROOT/'outputs/face-tha3'
OUT.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(REPO))
sys.path.insert(0,str(ROOT/'.tools/face-workflow/tha3-pydeps'))
os.chdir(REPO)
os.environ['MPLCONFIGDIR']=str(ROOT/'.tools/face-workflow/matplotlib-cache')
import torch
from tha3.poser.modes.pose_parameters import get_pose_parameters
from tha3.util import extract_pytorch_image_from_PIL_image, rgba_to_numpy_image

parser=argparse.ArgumentParser()
parser.add_argument('--variant',default='standard_float',choices=['standard_float','separable_float'])
parser.add_argument('--frames',type=int,default=80)
args=parser.parse_args()
if args.variant=='standard_float':
    from tha3.poser.modes.standard_float import create_poser, FiveStepPoserComputationProtocol
else:
    from tha3.poser.modes.separable_float import create_poser, FiveStepPoserComputationProtocol
from tha3.nn.eyebrow_morphing_combiner.eyebrow_morphing_combiner_00 import EyebrowMorphingCombiner00

source=ROOT/'assets/materials/characters/face-variants-v1/original-head-neckless.png'
new_face={}
for version in ['face-regenerated-v7','face-regenerated-v6']:
    replacement=ROOT/'assets/materials/characters'/version/'manifest.json'
    candidate=json.loads(replacement.read_text(encoding='utf8')) if replacement.exists() else {}
    if 'unified-face' in candidate.get('integratedFaceIds',[]):new_face=candidate;break
if 'unified-face' in new_face.get('integratedFaceIds',[]):source=ROOT/new_face['originalFaceSource']
original=Image.open(source).convert('RGBA')
# Uniform transform only. Eye line y142, mouth y179, head bounds roughly (201,72)-(311,200).
scale=.18
offset=(round(256-478*scale),round(72-226*scale))
if new_face.get('integratedFaceIds'):offset=(170,35)
aligned=Image.new('RGBA',(512,512))
aligned.alpha_composite(original.resize((round(original.width*scale),round(original.height*scale)),Image.Resampling.LANCZOS),offset)
aligned.save(OUT/'input.png')
device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')
torch.set_num_threads(4)
poser=create_poser(device)
params=get_pose_parameters()
indices={params.get_parameter_name(i):i for i in range(params.get_parameter_count())}
tensor=extract_pytorch_image_from_PIL_image(aligned.copy()).to(device)
protocol=FiveStepPoserComputationProtocol(EyebrowMorphingCombiner00.EYEBROW_IMAGE_NO_COMBINE_ALPHA_INDEX)
modules=poser.get_modules()
crop=(176,48,336,224)
dest=OUT/args.variant
dest.mkdir(exist_ok=True)
def render(values,full=False):
    pose=torch.zeros(1,45,device=device)
    for key,value in values.items(): pose[0,indices[key]]=value
    with torch.inference_mode():
        if full: result=poser.pose(tensor,pose)[0]
        else: result=protocol.get_output('face_morphed_full',modules,[tensor.unsqueeze(0),pose],{})[0][0]
    arr=np.rint(rgba_to_numpy_image(result.detach().cpu())*255).clip(0,255).astype(np.uint8)
    return Image.fromarray(arr)
poses={
    'neutral':{},
    'blink-half':{'eye_wink_left':.5,'eye_wink_right':.5},
    'blink-closed':{'eye_wink_left':1,'eye_wink_right':1},
    'gaze-left':{'iris_rotation_y':-.35},
    'gaze-right':{'iris_rotation_y':.35},
    'brows-up':{'eyebrow_raised_left':.45,'eyebrow_raised_right':.45},
    'smile':{'mouth_raised_corner_left':.45,'mouth_raised_corner_right':.45},
    'mouth-a':{'mouth_aaa':.55},
    'mouth-i':{'mouth_iii':.55},
    'mouth-u':{'mouth_uuu':.55},
    'mouth-e':{'mouth_eee':.55},
    'mouth-o':{'mouth_ooo':.55},
}
def card(im,label):
    bg=Image.new('RGB',(320,382),'#f0ede8')
    face=im.crop(crop).resize((320,352),Image.Resampling.LANCZOS)
    bg.paste(face,(0,30),face)
    ImageDraw.Draw(bg).text((12,10),label,fill='#313840')
    return bg
cards=[card(aligned,'ORIGINAL / aligned')]
timings=[]
for name,values in poses.items():
    t=time.perf_counter(); im=render(values)
    if device.type=='cuda':torch.cuda.synchronize()
    timings.append(time.perf_counter()-t)
    im.save(dest/f'{name}.png'); cards.append(card(im,name))
    print(args.variant,name,round(timings[-1],3),flush=True)
# Also test the official full five-network path, to distinguish face-only effects from reconstruction.
for name in ['neutral','blink-closed','mouth-a']:
    im=render(poses[name],full=True); im.save(dest/f'full-{name}.png')
    cards.append(card(im,'FULL / '+name))
sheet=Image.new('RGB',(320*4,382*math.ceil(len(cards)/4)),'#f0ede8')
for i,c in enumerate(cards):sheet.paste(c,((i%4)*320,(i//4)*382))
sheet.save(dest/'contact-sheet.jpg',quality=95)
frames=[]
for i in range(args.frames):
    t=i/16
    values={}
    blink=max(0,1-abs((t%2.5)-1.0)/.16)
    values['eye_wink_left']=values['eye_wink_right']=blink
    if 1.4<t<2.7:values['iris_rotation_y']=.28*math.sin((t-1.4)/1.3*math.pi*2)
    if t>2.8:
        values['mouth_aaa']=.35*(.5+.5*math.sin(t*13))
        values['mouth_raised_corner_left']=values['mouth_raised_corner_right']=.15
    im=render(values)
    frames.append(card(im,'THA3 / '+args.variant))
    if i%16==0:print('frame',i,flush=True)
frames[0].save(dest/'demo.webp',save_all=True,append_images=frames[1:],duration=63,loop=0,quality=90)
frames[0].save(dest/'demo.gif',save_all=True,append_images=frames[1:],duration=60,loop=0,optimize=False)
report={'source':str(source.relative_to(ROOT)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'variant':args.variant,'gpu':torch.cuda.get_device_name() if device.type=='cuda' else 'CPU (offline quality trial)','torch':torch.__version__,
 'input_size':[512,512],'uniform_scale':scale,'offset':offset,'preview_crop':crop,
 'pose_parameters':indices,'poses':poses,'frames':args.frames,'fps':16,
 'median_face_seconds':float(np.median(timings[1:])),'vram_peak_bytes':torch.cuda.max_memory_allocated() if device.type=='cuda' else None,
 'method':'THA3 original weights; face_morphed_full branch with rotations disabled; full-path stills included',
 'acceptance':'pending visual review; technical execution does not imply art acceptance',
 'attribution':'THA3 by Pramook Khungurn; code MIT; model CC BY 4.0'}
(dest/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('DONE',dest,flush=True)
