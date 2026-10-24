"""Import the user's seven already registered PNGs, preserving every source byte."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1]
HOME=ROOT/'assets/materials/sources/root-user-clothes-20261024'
SPECS=[('工装短裙.png','root-cargo-skort','bottom'),('金扣短裙.png','root-button-mini','bottom'),('精修工装外套.png','root-cargo-jacket','coat'),('卡其半裙.png','root-cargo-midi','bottom'),('浅蓝运动短裤.png','root-sport-shorts','bottom'),('miu黑工装短裙.png','root-zip-cargo-mini','bottom'),('miu牛仔短裙白色系带.png','root-tie-denim-mini','bottom')]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
HOME.mkdir(parents=True,exist_ok=True);items=[]
for filename,identity,slot in SPECS:
 source=ROOT/'assets'/filename;im=Image.open(source)
 assert im.size==(939,1676) and im.mode=='RGBA' and im.getbbox()
 folder=HOME/identity;folder.mkdir(exist_ok=True);shutil.copyfile(source,folder/'front.png')
 Image.new('RGBA',im.size).save(folder/'back.png')
 record={'id':identity,'name':source.stem,'slot':slot,'directory':identity,'front':'front.png','back':'back.png','sha256':sha(source),'backSha256':sha(folder/'back.png'),'originalSize':[939,1676],'canvas':[939,1676],'registrationProvided':True,'wearablePartition':True,'offlineWearableValidated':False}
 items.append(record)
 (folder/'source.json').write_text(json.dumps({'originalFile':'assets/'+filename,'originalSha256':sha(source),'sourceCanvasPreserved':True,'pixelTransform':None,'tryonPerformed':False,'sourceName':filename},ensure_ascii=False,indent=2),encoding='utf8')
(HOME/'delivery.json').write_text(json.dumps({'kind':'approved-front-only-registered-import','technicalPass':True,'count':len(items),'items':items},ensure_ascii=False,indent=2),encoding='utf8')
print('7 original canvases staged; original filenames retained as wardrobe names')
