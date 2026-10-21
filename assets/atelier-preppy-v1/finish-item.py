from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json,sys,hashlib
root=Path(__file__).parent;item=sys.argv[1];folder=root/'items'/item
specs={
 'navy-shirt':{'name':'深蓝格纹衬衫','slot':'upper','back':[(431,263),(509,263),(516,283),(516,307),(496,306),(470,308),(442,306),(423,307),(424,283)]},
 'suede-skirt':{'name':'腰带麂皮短裙','slot':'lower','back':[(350,638),(590,638),(600,651),(584,658),(540,663),(470,666),(400,663),(350,658),(340,651)]},
 'ankle-boots':{'name':'复古短靴','slot':'shoes','back':[[(374,1433),(433,1433),(433,1458),(426,1464),(413,1468),(392,1466),(374,1460)],[(509,1433),(569,1433),(569,1459),(553,1467),(531,1468),(512,1463)]]},
 'coin-loafers':{'name':'金币乐福鞋','slot':'shoes','back':[[(361,1526),(450,1526),(450,1576),(440,1590),(430,1590),(420,1588),(410,1587),(400,1588),(390,1590),(380,1590),(368,1576)],[(579,1526),(490,1526),(490,1576),(500,1590),(510,1590),(520,1588),(530,1587),(540,1588),(550,1590),(560,1590),(572,1576)]]}}
spec=specs[item]
for name in ['display','lineart']:
 im=Image.open(folder/(name+'.png')).convert('RGBA');p=np.array(im);mask=Image.new('L',im.size,0)
 if spec['back']:
  polygons=spec['back'] if isinstance(spec['back'][0][0],tuple) else [spec['back']]
  large=Image.new('L',(im.width*4,im.height*4),0)
  for polygon in polygons:ImageDraw.Draw(large).polygon([(x*4,y*4) for x,y in polygon],fill=255)
  mask=large.resize(im.size,Image.Resampling.LANCZOS)
 rear=p.copy();rear[:,:,3]=(p[:,:,3].astype(float)*np.array(mask)/255).round().astype('uint8');front=p.copy();front[:,:,3]=p[:,:,3]-rear[:,:,3]
 Image.fromarray(front).save(folder/(('front' if name=='display' else 'lineart-front')+'.png'));Image.fromarray(rear).save(folder/(('back' if name=='display' else 'lineart-back')+'.png'))
 if name=='display':
  Image.fromarray(p[:,:,3]).save(folder/'alpha.png');mask.save(folder/'back-mask.png')
  body=Image.open(root/'../gentle-campus-v1/base-open-arms-v2-clean.png').convert('RGBA')
  if spec['slot']=='shoes':body.paste((0,0,0,0),(0,1500 if item=='ankle-boots' else 1600,939,1676))
  proof=Image.new('RGBA',im.size,'#eff4fb');proof.alpha_composite(Image.fromarray(rear));proof.alpha_composite(body);proof.alpha_composite(Image.fromarray(front));proof.save(folder/'tryon.png')
  if spec['slot']=='lower':
   combo=Image.new('RGBA',im.size,'#eff4fb');combo.alpha_composite(Image.fromarray(rear));combo.alpha_composite(body);combo.alpha_composite(Image.open(root/'items/navy-shirt/front.png').convert('RGBA'));combo.alpha_composite(Image.fromarray(front));combo.save(folder/'tryon-with-shirt.png')
  bbox=im.getbbox();x0,y0,x1,y1=bbox;thumb=im.crop(bbox);thumb.thumbnail((480,480),Image.Resampling.LANCZOS);thumb.save(folder/'thumb.png')
  for color,label in [('#ffffff','white'),('#23344e','dark')]:
   bg=Image.new('RGBA',im.size,color);bg.alpha_composite(Image.fromarray(front));bg.crop((max(0,x0-25),max(0,y0-25),min(939,x1+25),min(1676,y1+25))).save(folder/('front-'+label+'.png'))
  technical={'canvas':im.size==(939,1676),'nonempty':int((p[:,:,3]>100).sum())>1000,'has_transparency':p[:,:,3].min()==0,'not_clipped':not (p[0,:,3].max() or p[-1,:,3].max() or p[:,0,3].max() or p[:,-1,3].max()),'partition_reconstructs_alpha':bool(np.array_equal(front[:,:,3].astype(int)+rear[:,:,3],p[:,:,3])),'partition_preserves_rgb':bool(np.array_equal(front[:,:,:3],p[:,:,:3]) and np.array_equal(rear[:,:,:3],p[:,:,:3]))}
  technical={k:bool(v) for k,v in technical.items()};qa={'id':item,'technical_pass':all(technical.values()),'checks':technical,'visual_reviewed':False,'wearable_validated':False,'recolor_ready':False,'bounds':list(bbox),'layer_sha256':hashlib.sha256((folder/'front.png').read_bytes()).hexdigest()};(folder/'qa.json').write_text(json.dumps(qa,indent=2),encoding='utf8')
  record=dict(spec);record.update({'id':item,'canvas':[939,1676],'source':'color-original.png','lineart':'lineart.png','front':'front.png','back':'back.png','display':'display.png','bounds':[x0,y0,x1-x0,y1-y0],'generation_mode':'built-in image_gen','layer_kind':'registered colored wearable, original line-art reference retained; not region-separated recolor production pack','requireWearablePartition':True});(folder/'item.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
print(item,qa)
