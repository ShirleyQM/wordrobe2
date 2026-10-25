"""Standard THA3: calibrated original-detail transport and optional 2x inference experiment."""
from pathlib import Path
import os,sys,json,time,hashlib,argparse,math,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1];REPO=ROOT/'.tools/face-workflow/tha3'
sys.path[:0]=[str(REPO),str(ROOT/'.tools/face-workflow/tha3-pydeps')]
os.environ['MPLCONFIGDIR']=str(ROOT/'.tools/face-workflow/matplotlib-cache');os.chdir(REPO)
import torch
import torch.nn.functional as F
from tha3.poser.modes.standard_float import load_eyebrow_decomposer,load_eyebrow_morphing_combiner,load_face_morpher
from tha3.poser.modes.pose_parameters import get_pose_parameters
from tha3.util import extract_pytorch_image_from_PIL_image,rgba_to_numpy_image,image_srgb_to_linear
P=argparse.ArgumentParser();P.add_argument('--animate',action='store_true');P.add_argument('--double',action='store_true');P.add_argument('--source');P.add_argument('--out');P.add_argument('--runtime',action='store_true');args=P.parse_args()
OUT=ROOT/(args.out or 'outputs/face-tha3/fine-v1');OUT.mkdir(parents=True,exist_ok=True)
shutil.copyfile(ROOT/'tools/face_tha3_fine_preview.html',OUT/'index.html')
src=ROOT/'assets/materials/characters/face-variants-v1/original-head-neckless.png'
new_face={}
for version in ['face-regenerated-v7','face-regenerated-v6']:
    replacement=ROOT/'assets/materials/characters'/version/'manifest.json'
    candidate=json.loads(replacement.read_text(encoding='utf8')) if replacement.exists() else {}
    if 'unified-face' in candidate.get('integratedFaceIds',[]):new_face=candidate;break
if 'unified-face' in new_face.get('integratedFaceIds',[]):src=ROOT/new_face['originalFaceSource']
if args.source:src=ROOT/args.source
original=Image.open(src).convert('RGBA');W,H=original.size;scale=.18;offset=(170,31)
if new_face.get('integratedFaceIds'):offset=(170,35)
device=torch.device('cuda' if torch.cuda.is_available() else 'cpu');torch.set_num_threads(4)
models={n:fn(str(REPO/'data/models/standard_float'/f'{n}.pt')).to(device).eval() for n,fn in [('eyebrow_decomposer',load_eyebrow_decomposer),('eyebrow_morphing_combiner',load_eyebrow_morphing_combiner),('face_morpher',load_face_morpher)]}
params=get_pose_parameters();ix={params.get_parameter_name(i):i for i in range(45)}
def aligned_image(factor=1):
    im=Image.new('RGBA',(512*factor,512*factor));im.alpha_composite(original.resize((round(W*scale*factor),round(H*scale*factor)),Image.Resampling.LANCZOS),(offset[0]*factor,offset[1]*factor));return im
inp=extract_pytorch_image_from_PIL_image(aligned_image()).unsqueeze(0).to(device)
# Original HD data retains RGB and alpha exactly; all arithmetic uses the model's linear light convention.
raw=np.asarray(original).astype('float32')/255
hr=torch.from_numpy(image_srgb_to_linear(raw).transpose(2,0,1)).unsqueeze(0).to(device)*2-1
yy,xx=torch.meshgrid(torch.arange(H,device=device),torch.arange(W,device=device),indexing='ij')
hdgrid=torch.stack(((xx+.5)/W*2-1,(yy+.5)/H*2-1),-1).unsqueeze(0)
modelgrid=torch.stack((((xx+.5)*scale+offset[0])/512*2-1,((yy+.5)*scale+offset[1])/512*2-1),-1).unsqueeze(0)
facegrid=torch.stack((((xx+.5)*scale+offset[0]-160)/192*2-1,((yy+.5)*scale+offset[1]-32)/192*2-1),-1).unsqueeze(0)
def sample(t,g,mode='bilinear'):return F.grid_sample(t,g,align_corners=False,padding_mode='border',mode=mode)
def mask(boxes):
    a=Image.new('L',(W,H));d=ImageDraw.Draw(a)
    for b in boxes:d.ellipse(b,fill=255)
    return torch.from_numpy(np.asarray(a.filter(ImageFilter.GaussianBlur(12))).copy()).to(device).float()[None,None]/255
eyes=mask([(245,545,455,690),(505,545,715,690)])
brows=mask([(240,490,460,590),(500,490,720,590)])
mouth=mask([(375,750,585,895)])
pose_decomp={}
captured={}
handle=models['face_morpher'].iris_mouth_grid_change.register_forward_hook(lambda m,i,o:captured.update(grid=o.detach()))
def infer(values,factor=1):
    image=inp if factor==1 else extract_pytorch_image_from_PIL_image(aligned_image(factor)).unsqueeze(0).to(device)
    pose=torch.zeros((1,45),device=device)
    for k,v in values.items():pose[0,ix[k]]=v
    f=factor
    with torch.inference_mode():
        if f not in pose_decomp:pose_decomp[f]=models['eyebrow_decomposer'](image[:,:,64*f:192*f,192*f:320*f])
        decomp=pose_decomp[f]
        eyebrow=models['eyebrow_morphing_combiner'](decomp[3],decomp[0],pose[:,:12])[2]
        patch=image[:,:,32*f:224*f,160*f:352*f].clone();patch[:,:,32*f:160*f,32*f:160*f]=eyebrow
        outputs=models['face_morpher'](patch,pose[:,12:39]);full=image.clone();full[:,:,32*f:224*f,160*f:352*f]=outputs[0]
        return full,captured['grid'].clone(),[v.detach() for v in outputs]
def to_image(t):
    a=np.rint(rgba_to_numpy_image(t[0].detach().cpu())*255).clip(0,255).astype('uint8');a[:,:,3]=np.asarray(original)[:,:,3]
    a[a[:,:,3]==0]=0;return Image.fromarray(a)
with torch.inference_mode():
    neutral,neutralflow,neutralparts=infer({})
    upinput=sample(inp,modelgrid,'bicubic');upneutral=sample(neutral,modelgrid,'bicubic')
    detail=hr-upinput;calibration=upinput-upneutral
def render(values):
    if not any(values.values()):return original.copy(),to_image(sample(neutral,modelgrid,'bicubic'))
    low,flow,parts=infer(values)
    with torch.inference_mode():
        displacement=sample(flow-neutralflow,facegrid)
        displacement=displacement.permute(0,2,3,1)*torch.tensor([192/(scale*W),192/(scale*H)],device=device)
        warped_detail=sample(detail,hdgrid+displacement,'bicubic')
        # New eye lids / mouth cavity have no original texture. Suppress detail transport there
        # instead of dragging the original iris or closed lips onto the generated surface.
        blink=max(values.get('eye_wink_left',0),values.get('eye_wink_right',0))
        novelty=torch.maximum(sample(parts[1],facegrid),sample(parts[4],facegrid)).clamp(0,1)
        delta=(sample(low,modelgrid)-upneutral).abs().amax(1,keepdim=True)
        novelty=(novelty*torch.clamp(delta*4,0,1)).clamp(0,1)
        novelty=torch.maximum(novelty,eyes*min(1,blink*2.5))
        brow_motion=max((abs(v) for k,v in values.items() if k.startswith('eyebrow_')),default=0)
        gaze_motion=max((abs(v) for k,v in values.items() if k.startswith('iris_rotation')),default=0)
        # The eyebrow stage and iris color replacement are not represented by this face flow.
        # Keep the clean model result there rather than leave old eyebrow/pupil texture behind.
        novelty=torch.maximum(novelty,brows*min(1,brow_motion*4))
        novelty=torch.maximum(novelty,eyes*min(1,gaze_motion*8))
        fine=sample(low,modelgrid,'bicubic')+(warped_detail+calibration)*(1-novelty)
        active=torch.zeros_like(eyes)
        if any(k.startswith(('eye_','iris_')) and v for k,v in values.items()):active=torch.maximum(active,eyes)
        if any(k.startswith('mouth_') and v for k,v in values.items()):active=torch.maximum(active,mouth)
        if any(k.startswith('eyebrow_') and v for k,v in values.items()):active=torch.maximum(active,brows)
        fine=hr*(1-active)+fine*active
        return to_image(fine),to_image(sample(low,modelgrid,'bicubic'))
poses={'neutral':{},'blink-half':{'eye_wink_left':.5,'eye_wink_right':.5},'blink-closed':{'eye_wink_left':1,'eye_wink_right':1},'gaze-left':{'iris_rotation_y':-.35},'gaze-right':{'iris_rotation_y':.35},'brows-up':{'eyebrow_raised_left':.45,'eyebrow_raised_right':.45},'smile':{'mouth_raised_corner_left':.45,'mouth_raised_corner_right':.45},'mouth-a':{'mouth_aaa':.55},'mouth-i':{'mouth_iii':.55},'mouth-u':{'mouth_uuu':.55},'mouth-e':{'mouth_eee':.55},'mouth-o':{'mouth_ooo':.55}}
def card(im,label):
    c=Image.new('RGB',(360,450),'#eeeae4');face=im.crop((145,200,815,990)).resize((360,424),Image.Resampling.LANCZOS);c.paste(face,(0,26),face);ImageDraw.Draw(c).text((8,7),label,fill='#293a36');return c
sheet=Image.new('RGB',(1080,450*len(poses)),'#eeeae4');timings=[]
for row,(name,values) in enumerate(poses.items()):
    t=time.perf_counter();fine,base=render(values);timings.append(time.perf_counter()-t)
    fine.save(OUT/f'{name}.png');base.save(OUT/f'baseline-{name}.png')
    for col,(im,label) in enumerate([(original,'ORIGINAL'),(base,'STANDARD / resized'),(fine,'ORIGINAL DETAIL / '+name)]):sheet.paste(card(im,label),(col*360,row*450))
    print(name,round(timings[-1],2),flush=True)
sheet.save(OUT/'comparison.jpg',quality=95)
if args.runtime:
    runtime=ROOT/'assets/materials/characters/face-motion-cool-v1';runtime.mkdir(parents=True,exist_ok=True)
    groups={
        'eyes':((210,530,770,715),{'neutral':{},**{f'blink-{i}':{'eye_wink_left':i/7,'eye_wink_right':i/7} for i in range(1,8)},**{f'gaze-{i}':{'iris_rotation_y':i*.07} for i in range(-4,5) if i}}),
        'brows':((210,465,770,550),{'neutral':{},**{f'raise-{i}':{'eyebrow_raised_left':i*.1,'eyebrow_raised_right':i*.1} for i in range(1,5)}}),
        'mouth':((350,735,620,925),{'neutral':{},**{f'{shape}-{i}':{f'mouth_{shape}':i*.18} for shape in ['aaa','iii','uuu','eee','ooo'] for i in range(1,4)},**{f'smile-{i}':{'mouth_raised_corner_left':i*.15,'mouth_raised_corner_right':i*.15} for i in range(1,4)}})
    }
    runtime_manifest={'faceId':'cool','source':str(src.relative_to(ROOT)).replace('\\','/'),'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'model':'standard_float','headRect':[350,30,250,275],'attribution':'THA3: Pramook Khungurn; code MIT; weights CC BY 4.0','groups':{}}
    for group,(box,states) in groups.items():
        tw,th=box[2]-box[0],box[3]-box[1]
        atlas=Image.new('RGBA',(tw*8,th*math.ceil(len(states)/8)));names=list(states)
        for i,(name,value) in enumerate(states.items()):
            fine,_=render(value);tile=fine.crop(box);atlas.paste(tile,(i%8*tw,i//8*th))
        atlas.save(runtime/f'{group}.png')
        runtime_manifest['groups'][group]={'file':f'{group}.png','tile':[tw,th],'columns':8,'box':list(box),'states':names}
        print('runtime atlas',group,len(states),flush=True)
    original.save(runtime/'original.png')
    (runtime/'manifest.json').write_text(json.dumps(runtime_manifest,indent=2),encoding='utf8')
original.save(OUT/'original.png')
if args.double:
    # Fully convolutional experiment: maintain layer/weight topology, double only spatial pose repeats.
    for module in models.values():
        module.args.image_size*=2;module.args.bottleneck_image_size*=2
    double_sheet=Image.new('RGB',(1080,450*3),'#eeeae4')
    for row,name in enumerate(['neutral','blink-closed','mouth-a']):
        full,_,_=infer(poses[name],2)
        im=to_image(sample(full,modelgrid,'bicubic'));im.save(OUT/f'double-{name}.png')
        for col,(face,label) in enumerate([(original,'ORIGINAL'),(Image.open(OUT/f'{name}.png'),'DETAIL TRANSPORT'),(im,'2X SPATIAL EXPERIMENT')]):double_sheet.paste(card(face,label),(360*col,450*row))
        print('double',name,flush=True)
    double_sheet.save(OUT/'double-comparison.jpg',quality=95)
    for module in models.values():module.args.image_size//=2;module.args.bottleneck_image_size//=2
if args.animate:
    frames=[];oldframes=[]
    for i in range(64):
        t=i/16;blink=max(0,1-abs((t%2.7)-.9)/.2)
        values={'eye_wink_left':blink,'eye_wink_right':blink}
        if 1.3<t<2.3:values['iris_rotation_y']=.3*math.sin((t-1.3)*math.pi*2)
        if t>2.4:values['mouth_aaa']=.4*(.5+.5*math.sin(t*11))
        fine,base=render(values);frames.append(card(fine,'ORIGINAL DETAIL'));oldframes.append(card(base,'STANDARD / resized'))
        if i%16==0:print('animation',i,flush=True)
    for name,seq in [('demo',frames),('baseline-demo',oldframes)]:seq[0].save(OUT/f'{name}.webp',save_all=True,append_images=seq[1:],duration=63,loop=0,quality=95)
    comparison=[]
    for a,b in zip(oldframes,frames):
        im=Image.new('RGB',(1080,450),'#eeeae4');im.paste(card(original,'ORIGINAL'),(0,0));im.paste(a,(360,0));im.paste(b,(720,0));comparison.append(im)
    comparison[0].save(OUT/'compare-demo.webp',save_all=True,append_images=comparison[1:],duration=63,loop=0,quality=95)
report={'model':'standard_float only','source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'output_canvas':[W,H],'method':'Neutral-calibrated original texture residual transported with THA3 iris/mouth displacement; novel eyelid, pupil, eyebrow and cavity regions suppress source texture; original alpha and inactive regions retained','new_detail_generation':False,'double_inference_experimental':args.double,'double_probe_status':'Rejected: closure incomplete and mouth motion unreliable' if (OUT/'double-neutral.png').exists() else 'not tested','neutral_exact_original':np.array_equal(np.asarray(Image.open(OUT/'neutral.png')),np.asarray(original)),'median_pose_seconds':float(np.median(timings[1:])),'frames':64 if args.animate else 0,'attribution':'THA3: Pramook Khungurn; code MIT; weights CC BY 4.0','acceptance':'Pending visual inspection; generated eyelids and mouth interiors remain resolution-limited'}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8');handle.remove();print('DONE',OUT,flush=True)
