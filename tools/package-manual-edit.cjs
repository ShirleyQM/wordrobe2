const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),local=p=>path.join(root,p),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function main(){
 const collection=read('assets/materials/garments/collection.json'),fits=read('assets/materials/published/fittings.json'),notes=read('assets/materials/published/garment-notes.json');
 const base='手调素材包-2026-10-22';let name=base,n=2;while(fs.existsSync(local(name)))name=base+'-'+n++;
 const folder=local(name);fs.mkdirSync(folder);const chars=path.join(folder,'人物素材');fs.mkdirSync(chars);
 fs.copyFileSync(local('assets/materials/characters/open-arms/body.png'),path.join(chars,'人物母版-当前试穿.png'));
 fs.copyFileSync(local('assets/materials/characters/hair-original-clean-v3/game/body-hairless.png'),path.join(chars,'人物母版-无头发.png'));
 const body=await loadImage(path.join(chars,'人物母版-当前试穿.png')),items=[];
 for(const note of Object.values(notes.items).filter(n=>n.text.trim()||n.tags.length)){
  const registered=collection.items.find(i=>i.id===note.itemId);if(!registered)throw Error('备注缺少衣服 '+note.itemId);
  const fit=fits.items.find(i=>i.id===note.itemId),front=fit?.front||registered.runtimeFront||registered.front,back=fit?.back||registered.runtimeBack||registered.back;
  const displayName=registered.name.replace(/[<>:"/\\|?*]/g,'-'),dir=path.join(folder,'衣服',displayName+'__'+registered.id);fs.mkdirSync(dir,{recursive:true});
  for(const [filename,src]of [['前片.png',front],['后片.png',back]])fs.copyFileSync(local(src),path.join(dir,filename));
  const f=await loadImage(path.join(dir,'前片.png')),b=await loadImage(path.join(dir,'后片.png'));if(f.width!==939||f.height!==1676||b.width!==939||b.height!==1676)throw Error('画布错误 '+registered.id);
  const merged=createCanvas(939,1676),mc=merged.getContext('2d');mc.drawImage(b,0,0);mc.drawImage(f,0,0);fs.writeFileSync(path.join(dir,'衣服合并.png'),merged.toBuffer('image/png'));
  const tryon=createCanvas(939,1676),tc=tryon.getContext('2d');tc.drawImage(b,0,0);tc.drawImage(body,0,0);tc.drawImage(f,0,0);fs.writeFileSync(path.join(dir,'试穿参考.png'),tryon.toBuffer('image/png'));
  const row={id:registered.id,name:registered.name,folder:path.relative(folder,dir).split(path.sep).join('/'),canvas:[939,1676],front:front,back:back,frontSha256:hash(path.join(dir,'前片.png')),backSha256:hash(path.join(dir,'后片.png')),sourceRevision:registered.sourceRevision||null,fittingRevision:fit?.revision||registered.bakedFittingRevision||null,note};
  fs.writeFileSync(path.join(dir,'备注.txt'),`${registered.name}\nID：${registered.id}\n标签：${note.tags.join('、')||'无'}\n备注：${note.text||'（无补充文字）'}\n\n图片为当前最新正式版，保持原画布和坐标。\n`,'utf8');
  fs.writeFileSync(path.join(dir,'单品信息.json'),JSON.stringify(row,null,2));items.push(row);
 }
 const text=items.map((r,i)=>`${i+1}. ${r.name}\n文件夹：${r.folder}\n标签：${r.note.tags.join('、')||'无'}\n备注：${r.note.text||'（无补充文字）'}\n`).join('\n');
 fs.writeFileSync(path.join(folder,'全部备注.txt'),text,'utf8');
 fs.writeFileSync(path.join(folder,'素材清单.json'),JSON.stringify({exportedAt:new Date().toISOString(),canvas:[939,1676],count:items.length,items},null,2));
 fs.writeFileSync(path.join(folder,'先看这里.txt'),`手调素材包\n\n共 ${items.length} 件带备注衣服，按当前正式版本导出，没有旧版修版网格。\n\n衣服/：每件单独一个文件夹，文件夹名含稳定 ID。\n  前片.png、后片.png：正式透明穿戴层，可以直接手调。\n  衣服合并.png：前后片合在一起的单件参考。\n  试穿参考.png：叠到当前人物上的效果，仅供参考。\n  备注.txt：你的原标签和原备注。\n  单品信息.json：对应 ID、版本与文件校验信息。\n\n人物素材/：当前试穿人物，以及可单独配头发的无发人物母版。\n全部备注.txt：全部备注集中查看。\n\n所有衣服保持 939 × 1676 像素、透明背景和原坐标，勿裁小或自动居中。\n建议在绘图软件中按“后片 → 人物母版 → 前片”叠层。\n人物仅作参考，不要合进衣服的前片或后片。\n可以直接编辑这份导出的副本，不会影响游戏。完成后保留原文件夹 ID 和前片/后片文件名，交回来即可对应导入。\n`,'utf8');
 console.log(JSON.stringify({folder,count:items.length,filesPerGarment:6,characters:2}));
}
main().catch(e=>{console.error(e);process.exit(1)});
