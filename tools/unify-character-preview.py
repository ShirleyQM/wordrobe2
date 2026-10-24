"""Use the approved open-arms body in every active preview; keep all garment data."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
p=root/'app.js';s=p.read_text(encoding='utf8')
start=s.index('function figure(){');end=s.index('function gateDue()',start)
s=s[:start]+"function figure(){return liveFigure();}\n"+s[end:]
s=s.replace("$('#character-name').textContent=Object.values(state.equipped).some(id=>itemById(id)?.body==='open-arms-v2')?'温柔':characters[state.character].name;", "$('#character-name').textContent='温柔';")
start=s.index(" const newBody=item.body===");end=s.index(" if(e[item.slot]===id",start)
s=s[:start]+s[end:]
s=s.replace(".filter(i=>i?.body==='open-arms-v2'&&!i.unavailable)",".filter(i=>i&&!i.unavailable)")
p.write_text(s,encoding='utf8')

p=root/'assets/atelier-preppy-v1/studio.js';s=p.read_text(encoding='utf8')
start=s.index('function renderFitPreview()');end=s.index('(async()=>',start)
s=s[:start]+'''function renderFitPreview(){const item=current(),c=canvas(),ctx=c.getContext('2d');if(!compareOpenings)drawLayer(ctx,item,'back',false);const base=canvas(),bc=base.getContext('2d');bc.drawImage(body,0,0);if(item.slot!=='bra'){const under=items.find(i=>i.id===(localStorage.getItem('wardrobe-underlayer-v1')||'underlayer-straight'));if(under)for(const side of ['back','front'])M.draw(bc,sourceTexture(under,side,false),fittedMesh(under));}if(item.hideBodyFrom){const cut=M.map(fittedMesh(item),{x:470,y:item.hideBodyFrom}).y;bc.clearRect(0,cut,W,H-cut);}ctx.drawImage(base,0,0);if(compareOpenings){for(const side of ['back','front'])M.draw(ctx,sources.get(item.id+side),fittedMesh(item));}else drawLayer(ctx,item,'front',false);return c;}
'''+s[end:]
s=s.replace('body=await load(collection.body);',"body=await load('/assets/materials/characters/open-arms/body.png');")
old="for(const [key,url]of [['campus-body','body.png'],['campus-shoes-body','body-shoes-on.png'],['campus-hair-back','hair-back.png'],['campus-hair-front','hair-front.png']])sources.set(key,await load('/assets/materials/characters/campus/'+url));"
s=s.replace(old,'')
p.write_text(s,encoding='utf8')

p=root/'assets/garment-prints/editor.js';s=p.read_text(encoding='utf8')
s=s.replace("assets/materials/characters/campus/body.png","assets/materials/characters/open-arms/body.png")
s=s.replace("if(item.body==='open-arms-v2'){const under", "{const under")
s=s.replace("}else background='<image href=\"assets/materials/characters/campus/hair-back.png\" width=\"939\" height=\"1676\"/><image href=\"assets/materials/characters/open-arms/body.png\" width=\"939\" height=\"1676\"/>';", "}")
p.write_text(s,encoding='utf8')
print('Unified active previews; source bodies, garment sources and saved fittings left intact.')
