from PIL import Image
import numpy as np
from pathlib import Path
import sys
root=Path(__file__).parent
folder=root/'items/navy-shirt'
src=Image.open(folder/(sys.argv[1] if len(sys.argv)>1 else 'lineart-original.png')).convert('RGBA')
raw=Image.new('RGBA',(939,1676));raw.alpha_composite(src.resize((round(src.width*.52),round(src.height*.52)),Image.Resampling.LANCZOS),(215,145))
p=np.array(raw).astype(float)
yy,xx=np.mgrid[240:760,180:760];old_y=yy+30
profile=np.array([[280,0],[310,8],[330,30],[360,32],[420,12],[500,12],[570,15],[615,14],[680,8],[730,8]])
amp=np.interp(old_y,profile[:,0],profile[:,1],left=0,right=0)
sx=xx.astype(float)
for _ in range(15):
 d=sx-470;sx=xx-np.sign(d)*amp*np.minimum(1,np.abs(d)/80)*np.exp(-(np.abs(d)/160)**6)
x0=np.floor(sx).astype(int);f=sx-x0
a=p[old_y,x0,3]/255;b=p[old_y,x0+1,3]/255;alpha=a*(1-f)+b*f
rgb=(p[old_y,x0,:3]*a[:,:,None]*(1-f[:,:,None])+p[old_y,x0+1,:3]*b[:,:,None]*f[:,:,None])/np.maximum(alpha[:,:,None],1e-8)
out=np.zeros((1676,939,4),dtype=np.uint8);out[240:760,180:760,:3]=np.clip(rgb,0,255).astype(np.uint8);out[240:760,180:760,3]=(alpha*255).astype(np.uint8)
im=Image.fromarray(out);name='lineart' if 'lineart' in (sys.argv[1] if len(sys.argv)>1 else 'lineart') else 'display'
im.save(folder/(name+'.png'))
body=Image.open(root/'../gentle-campus-v1/base-open-arms-v2-clean.png').convert('RGBA');proof=Image.new('RGBA',body.size,'#eff4fb');proof.alpha_composite(body);proof.alpha_composite(im);proof.save(folder/(name+'-tryon.png'))
print('Registered',name,im.getbbox())
