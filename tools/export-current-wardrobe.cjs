const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),write=(p,v)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,2));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main(){
 const collection=read('assets/materials/garments/collection.json'),fits=read('assets/materials/published/fittings.json'),notes=read('assets/materials/published/garment-notes.json');
 const out='assets/wardrobe-review-2026-10-22',thumbDir='assets/materials/published/panel-previews';fs.mkdirSync(path.join(root,out),{recursive:true});fs.mkdirSync(path.join(root,thumbDir),{recursive:true});
 for(const [name,value]of [['collection-before',collection],['fittings-before',fits],['notes',notes]]){const p=path.join(root,out,name+'.json');if(!fs.existsSync(p))fs.writeFileSync(p,JSON.stringify(value,null,2));}
 const baseline=JSON.stringify(fits.draft),rows=[];
 for(const item of collection.items){
  const saved=fits.items.find(f=>f.id===item.id),front=saved?.front||item.runtimeFront||item.front,back=saved?.back||item.runtimeBack||item.back;
  const frontPath=path.join(root,front),m=await sharp(frontPath).metadata();if(m.width!==939||m.height!==1676)throw Error('Canvas '+item.id);
  const combined=await sharp({create:{width:939,height:1676,channels:4,background:'#00000000'}}).composite([...(back?[{input:path.join(root,back)}]:[]),{input:frontPath}]).png().toBuffer();
  const {data,info}=await sharp(combined).raw().toBuffer({resolveWithObject:true});let x0=939,y0=1676,x1=-1,y1=-1;
  for(let y=0;y<1676;y++)for(let x=0;x<939;x++)if(data[(y*939+x)*4+3]>12){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<0)throw Error('Empty '+item.id);
  const digest=crypto.createHash('sha256').update(combined).digest('hex').slice(0,12),url='/'+thumbDir+'/'+item.id+'-'+digest+'.png';
  await sharp(combined).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(320,320,{fit:'contain',background:'#00000000'}).extend({top:10,bottom:10,left:10,right:10,background:'#00000000'}).png().toFile(path.join(root,url));
  item.thumbnail=url;if(saved)saved.thumbnail=url;
  rows.push({id:item.id,name:item.name,slot:item.slot,adjusted:!!saved||!!item.bakedFittingRevision,baked:!!item.bakedFittingRevision,revision:saved?.revision||item.bakedFittingRevision||item.sourceRevision||null,front,back,thumbnail:url,bounds:[x0,y0,x1-x0+1,y1-y0+1],note:notes.items[item.id]||null});
 }
 if(JSON.stringify(fits.draft)!==baseline)throw Error('Draft changed');
 // Reject concurrent manual saves instead of replacing their records.
 const current=read('assets/materials/published/fittings.json');if(current.revision!==fits.revision||JSON.stringify(current.draft)!==baseline)throw Error('衣橱有新保存，请重跑导出');
 write('assets/materials/garments/collection.json',collection);write('assets/materials/published/fittings.json',fits);
 const marked=rows.filter(r=>r.note&&(r.note.text.trim()||r.note.tags.length));
 for(const r of marked){const layers=[...(r.back?[{input:path.join(root,r.back)}]:[]),{input:path.join(root,'assets/materials/characters/open-arms/body.png')},{input:path.join(root,r.front)}];await sharp({create:{width:939,height:1676,channels:4,background:'#00000000'}}).composite(layers).png().toFile(path.join(root,out,r.id+'-tryon.png'));}
 write(out+'/wardrobe.json',rows);write(out+'/marked-garments.json',marked);
 fs.writeFileSync(path.join(root,out,'衣服备注.txt'),marked.map((r,i)=>`${i+1}. ${r.name}\nID：${r.id}\n标签：${r.note.tags.join('、')||'无'}\n备注：${r.note.text||'（无补充文字）'}\n状态：${r.adjusted?'已保存调整 · '+r.revision:'当前原版'}\n`).join('\n'),'utf8');
 const styles=`*{box-sizing:border-box}body{margin:0;background:#f5f3ee;color:#302f2b;font:14px 'Microsoft YaHei',sans-serif}header{padding:28px 32px 20px;border-bottom:1px solid #d8d4ca;background:#fbfaf6}h1{font-size:24px;margin:0 0 10px}p{line-height:1.7}nav{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}button,a{font:inherit;color:inherit}button{padding:8px 14px;border:1px solid #ccc6b9;background:#fff;cursor:pointer}button.active{background:#3b5551;color:white}main{padding:24px 32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px}article{border-bottom:1px solid #d8d4ca;padding-bottom:22px}figure{margin:0;background:#e8e6df;height:350px;display:flex;justify-content:center}figure img{width:100%;height:100%;object-fit:contain}h2{font-size:16px;margin:16px 0 8px}.meta{color:#777267;font-size:12px;overflow-wrap:anywhere}.tags{color:#4d655d;margin:10px 0}.note{white-space:pre-wrap;margin-top:8px;line-height:1.8}a{margin-right:15px}.hidden{display:none}@media(max-width:650px){header{padding:22px 16px}main{padding:16px}}`;
 const card=(r,i,markedOnly)=>`<article data-tags="${esc((r.note?.tags||[]).join(' '))}"><figure><img src="${markedOnly?r.id+'-tryon.png':'../../'+r.thumbnail.slice(1)}" data-tryon="${r.id}-tryon.png" data-single="../../${r.thumbnail.slice(1)}" alt="${esc(r.name)}"></figure><h2>${i+1}. ${esc(r.name)}</h2><div class="meta">${esc(r.id)} · ${r.baked?'已固化图片 '+esc(r.revision):r.adjusted?'已保存调整 '+esc(r.revision):'当前原版'}</div>${markedOnly?`<div class="tags">${esc(r.note.tags.join(' · ')||'文字备注')}</div><div class="note">${esc(r.note.text||'（无补充文字）')}</div><p class="meta">备注时间：${esc(r.note.updatedAt)}</p>`:''}</article>`;
 fs.writeFileSync(path.join(root,out,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>衣服备注 · 当前调整版</title><style>${styles}</style><header><h1>衣服备注 · ${marked.length} 件</h1><p>按当前保存状态导出。保留原标签和原备注，供你决定后续处理。</p><a href="衣服备注.txt" download>下载备注文字</a><a href="marked-garments.json" download>下载完整记录</a><a href="all.html">查看全部 ${rows.length} 件</a><nav id="filters">${['全部','内片露出','袖子不贴','基础款','文字备注'].map((t,i)=>`<button class="${i?'':'active'}" data-tag="${t}">${t}</button>`).join('')}</nav><nav><button id="view">切换为单件图</button></nav></header><main>${marked.map((r,i)=>card(r,i,true)).join('')}</main><script>let single=false;document.querySelector('#view').onclick=e=>{single=!single;document.querySelectorAll('figure img').forEach(i=>i.src=single?i.dataset.single:i.dataset.tryon);e.target.textContent=single?'切换为试穿图':'切换为单件图'};document.querySelector('#filters').onclick=e=>{const t=e.target.dataset.tag;if(!t)return;document.querySelectorAll('[data-tag]').forEach(b=>b.classList.toggle('active',b.dataset.tag===t));document.querySelectorAll('article').forEach(a=>a.hidden=!(t==='全部'||t==='文字备注'&&!a.dataset.tags||a.dataset.tags.includes(t)))};</script></html>`,'utf8');
 fs.writeFileSync(path.join(root,out,'all.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>当前衣橱总览</title><style>${styles}figure{height:230px}</style><header><h1>当前衣橱 · ${rows.length} 件</h1><p>${rows.filter(r=>r.adjusted).length} 件保存了手动调整。以下预览按衣服实际范围显示，没有再次变形。</p><a href="index.html">查看有备注的衣服</a></header><main>${rows.map((r,i)=>card(r,i,false)).join('')}</main></html>`,'utf8');
 console.log(JSON.stringify({total:rows.length,adjusted:rows.filter(r=>r.adjusted).length,marked:marked.length,revision:fits.revision,draftsPreserved:true,export:out},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});




