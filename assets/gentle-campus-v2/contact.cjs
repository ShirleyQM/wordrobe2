const path=require('path'),fs=require('fs');const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';const {createCanvas,loadImage}=require(path.join(deps,'@napi-rs/canvas'));const sharp=require(path.join(deps,'sharp'));const root=__dirname;
(async()=>{const manifest=JSON.parse(fs.readFileSync(path.join(root,'layers.json'))),layers=manifest.layers;
 const canvas=createCanvas(1600,Math.ceil((layers.length+1)/4)*470),c=canvas.getContext('2d');c.fillStyle='#f2f6fc';c.fillRect(0,0,canvas.width,canvas.height);const entries=[{name:'整套叠加预览',composite:true},...layers];
 for(let k=0;k<entries.length;k++){const e=entries[k],x=(k%4)*400,y=Math.floor(k/4)*470;c.fillStyle='#2f4d72';c.font='18px "Microsoft YaHei"';c.fillText(e.name,x+18,y+28);for(let row=0;row<25;row++)for(let col=0;col<24;col++){c.fillStyle=(row+col)%2?'#e5ebf4':'#ffffff';c.fillRect(x+12+col*16,y+43+row*16,16,16);}
  if(e.composite){for(const l of layers.slice().sort((a,b)=>a.z-b.z)){const im=await loadImage(path.join(root,l.occluded_by_shoes||l.file));const scale=Math.min(370/939,389/1676);c.drawImage(im,x+200-939*scale/2,y+48,939*scale,1676*scale);}}
  else{const file=path.join(root,e.file),meta=await sharp(file).trim({background:'#00000000'}).toBuffer();const im=await loadImage(meta),scale=Math.min(350/im.width,370/im.height);c.drawImage(im,x+200-im.width*scale/2,y+50+(370-im.height*scale)/2,im.width*scale,im.height*scale);}
 }
 fs.writeFileSync(path.join(root,'parts-preview.png'),canvas.toBuffer('image/png'));
 const comp=createCanvas(939,1676),cx=comp.getContext('2d');cx.fillStyle='#ffffff';cx.fillRect(0,0,939,1676);for(const l of layers.slice().sort((a,b)=>a.z-b.z))cx.drawImage(await loadImage(path.join(root,l.occluded_by_shoes||l.file)),0,0);fs.writeFileSync(path.join(root,'assembled-preview.png'),comp.toBuffer('image/png'));
})();
