from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).parent
for shoe in ['ankle-boots','coin-loafers']:
 look=Image.new('RGBA',(939,1676));body=Image.open(root/'references/body.png').convert('RGBA');body.paste((0,0,0,0),(0,1500 if shoe=='ankle-boots' else 1600,939,1676))
 for item in ['navy-shirt','suede-skirt',shoe]:look.alpha_composite(Image.open(root/'items'/item/'back.png').convert('RGBA'))
 look.alpha_composite(body)
 for item in ['navy-shirt','suede-skirt',shoe]:look.alpha_composite(Image.open(root/'items'/item/'front.png').convert('RGBA'))
 look.save(root/('look-'+shoe+'.png'))
board=Image.new('RGB',(1560,1260),'#f3f7fc');draw=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',27);small=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
draw.text((45,33),'学院衣橱 · 01',font=font,fill='#294b76')
look=Image.open(root/'look-coin-loafers.png');look.thumbnail((585,1120),Image.Resampling.LANCZOS);board.paste(look,(12,110),look)
labels=[('navy-shirt','深蓝格纹衬衫'),('suede-skirt','腰带麂皮短裙'),('ankle-boots','复古短靴'),('coin-loafers','金币乐福鞋')]
for index,(item,label) in enumerate(labels):
 x=615+(index%2)*455;y=95+(index//2)*570
 draw.rounded_rectangle((x,y,x+425,y+540),radius=16,fill='#ffffff',outline='#d8e4f3',width=2)
 im=Image.open(root/'items'/item/'display.png').convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((365,420),Image.Resampling.LANCZOS);board.paste(im,(x+(425-im.width)//2,y+35+(420-im.height)//2),im);box=draw.textbbox((0,0),label,font=small);draw.text((x+(425-(box[2]-box[0]))/2,y+484),label,font=small,fill='#406286')
board.save(root/'collection-preview.png')
print('Saved two transparent full-canvas looks and collection-preview.png')
