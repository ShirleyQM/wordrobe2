from PIL import Image
import numpy as np
from pathlib import Path
import sys,json
root=Path(__file__).parent;folder=root/'items/suede-skirt';name=sys.argv[1] if len(sys.argv)>1 else 'lineart-original.png'
im=Image.open(folder/name).convert('RGBA');a=np.array(im);ys,xs=np.where(a[:,:,3]>60);x0,x1,y0,y1=int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max());crop=im.crop((x0,y0,x1+1,y1+1));p=np.array(crop).astype(float)
yy,xx=np.mgrid[641:946,240:700];f=(yy-641)/304;sy=f*(crop.height-1);factor=(.62*(1-f)+.49*f)*768/crop.width;sx=(xx-470)/factor+(crop.width-1)/2
ix=np.floor(sx).astype(int);iy=np.floor(sy).astype(int);inside=(ix>=0)&(ix<crop.width-1)&(iy>=0)&(iy<crop.height-1);ix=np.clip(ix,0,crop.width-2);iy=np.clip(iy,0,crop.height-2);fx=sx-np.floor(sx);fy=sy-np.floor(sy)
result=np.zeros((*xx.shape,4),float);rgb=np.zeros((*xx.shape,3),float);alpha=np.zeros_like(xx,float)
for dx,dy,w in [(0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)]:
 q=p[iy+dy,ix+dx];v=w*q[:,:,3]/255;alpha+=v;rgb+=q[:,:,:3]*v[:,:,None]
result[:,:,:3]=rgb/np.maximum(alpha[:,:,None],1e-8);result[:,:,3]=alpha*255*inside
out=np.zeros((1676,939,4),np.uint8);out[641:946,240:700]=np.clip(result,0,255).astype('uint8');layer=Image.fromarray(out);target='lineart' if 'lineart' in name else 'display';layer.save(folder/(target+'.png'))
body=Image.open(root/'../gentle-campus-v1/base-open-arms-v2-clean.png').convert('RGBA');proof=Image.new('RGBA',body.size,'#eff4fb');proof.alpha_composite(body);proof.alpha_composite(layer);proof.save(folder/(target+'-tryon.png'))
(folder/(target+'-registration.json')).write_text(json.dumps({'source_bounds':[x0,y0,x1,y1],'target_top':641,'target_hem':945,'center':470,'x_scale_top':.62,'x_scale_hem':.49},indent=2));print(target,layer.getbbox())
