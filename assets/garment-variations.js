(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key='garment-variation-drafts-v1';let saved={},items=[],loaded=false,onlyPending=false,error='';
 let drafts={};try{drafts=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
 const messages=new Map(),busy=new Set();
 const draft=id=>drafts[id]||saved[id]||{text:'',pending:true,revision:0};
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(drafts));}catch{error='浏览器草稿空间不足，请及时点击保存备注';}};
 const redraw=()=>window.dispatchEvent(new Event('variation-change'));
 const bar=document.createElement('section');bar.id='variation-tools';bar.hidden=true;
 bar.innerHTML='<div class="variation-actions"><label><input type="checkbox" id="variation-pending-only"> 只看待处理</label><span id="variation-count"></span><button id="variation-export">导出待处理清单</button><span id="variation-load-status" role="status"></span></div><details class="variation-guide"><summary>怎么写变化需求：版型母版＋设计模块</summary><p>先说明要保留的衣长、领型、袖型和松紧；再选面料、结构、装饰、配色与数量。原图的牛仔纹、破洞、印花、金属扣等可作为可替换细节，不必一直沿用。</p><p>例：保留短款宽松轮廓和袖型；去掉牛仔特征，分别做奶油粗花呢、咖色麂皮、藏蓝斜纹。麂皮款加流苏，斜纹款改贴袋；共 3 款，统一柔和二次元质感。</p><p>建议每批共用一组配色和质感，每款先变 1–2 个设计模块，方便组成套装。明显改变轮廓的设计单列为新母版。制作仍按项目 SOP：固定人物与姿势、只画正面可见衣料、不画内片和后片。</p><p>每张卡片点击“保存备注”后才进入正式清单；未保存草稿只留在当前浏览器。后续告诉我“按待处理备注批量做”即可。</p></details>';
 document.querySelector('#materials').before(bar);
 function toolbar(){
  const count=items.filter(i=>saved[i.id]?.pending).length,dirty=Object.keys(drafts).filter(id=>items.some(i=>i.id===id)).length;
  document.querySelector('#variation-count').textContent=`已保存待处理 ${count} 件${dirty?' · 未保存草稿 '+dirty+' 件':''}`;
  document.querySelector('#variation-load-status').textContent=error||(!loaded?'正在读取备注…':'');
  document.querySelector('#variation-export').disabled=!loaded;
 }
 window.GarmentVariations={
  setItems(rows){items=rows.filter(i=>i.kind==='clothes');toolbar();},
  show(value){bar.hidden=!value;toolbar();},
  matches(id){return !onlyPending||saved[id]?.pending===true;},
  text(id){return draft(id).text;},
  editor(i){const d=draft(i.id),s=saved[i.id],conflict=!!drafts[i.id]&&d.revision!==(s?.revision||0);
   return `<section class="variation-editor" data-variation-id="${esc(i.id)}"><label>变化需求 / vary 备注<textarea aria-label="${esc(i.name)}的变化需求" maxlength="4000" rows="4" placeholder="保留什么版型；换什么面料；加减哪些细节；配色与数量" ${!loaded?'disabled':''}>${esc(d.text)}</textarea></label><label class="variation-queue"><input type="checkbox" data-variation-pending ${d.pending?'checked':''} ${!loaded?'disabled':''}> 加入待处理</label><button data-variation-save ${!loaded||busy.has(i.id)?'disabled':''}>${busy.has(i.id)?'保存中…':'保存备注'}</button><span class="variation-status" role="status">${esc(messages.get(i.id)||(drafts[i.id]?'草稿未保存':s?(s.pending?'已保存 · 待处理':'已保存'):'未填写'))}</span>${conflict?`<div class="variation-conflict"><p>服务器备注已更新，请对照合并：</p><pre>${esc(s?.text||'（空）')}</pre><button data-variation-confirm>已对照，用当前草稿覆盖最新备注</button></div>`:''}</section>`;
  }
 };
 document.querySelector('#variation-pending-only').onchange=e=>{onlyPending=e.target.checked;redraw();};
 document.querySelector('#materials').addEventListener('input',e=>{
  const panel=e.target.closest('[data-variation-id]');if(!panel)return;
  const id=panel.dataset.variationId,old=draft(id);
  drafts[id]={text:panel.querySelector('textarea').value,pending:panel.querySelector('[data-variation-pending]').checked,revision:old.revision};
  persist();messages.delete(id);panel.querySelector('.variation-status').textContent='草稿未保存';toolbar();
 });
 async function save(id,panel){
  if(busy.has(id))return;const input={...draft(id)};busy.add(id);panel.querySelector('[data-variation-save]').disabled=true;
  panel.querySelector('.variation-status').textContent='保存中…';
  try{
   const response=await fetch('/api/garment-variations/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),data=await response.json();
   if(!response.ok){if(response.status===409&&data.current)saved[id]=data.current;throw Error(data.error||'保存失败');}
   saved[id]=data;
   if(JSON.stringify(drafts[id])===JSON.stringify(input))delete drafts[id];
   else if(drafts[id])drafts[id].revision=data.revision;
   persist();messages.set(id,drafts[id]?'已保存上一次内容，当前修改仍是草稿':data.pending?'已保存 · 待处理':'已保存');
  }catch(e){messages.set(id,e.message);}finally{busy.delete(id);toolbar();redraw();}
 }
 document.querySelector('#materials').addEventListener('click',e=>{
  const panel=e.target.closest('[data-variation-id]');if(!panel)return;const id=panel.dataset.variationId;
  if(e.target.closest('[data-variation-confirm]')){drafts[id]={...draft(id),revision:saved[id]?.revision||0};persist();save(id,panel);}
  else if(e.target.closest('[data-variation-save]'))save(id,panel);
 });
 async function refresh(){try{
  const r=await fetch('/api/garment-variations',{cache:'no-store'});if(!r.ok)throw Error('变化备注加载失败，请刷新重试');const data=await r.json();saved=data.items;loaded=true;error='';toolbar();redraw();
 }catch(e){error=e.message;toolbar();}}
 document.querySelector('#variation-export').onclick=async()=>{
  const b=document.querySelector('#variation-export');b.disabled=true;
  try{
   // Export current server data, excluding deletions made in another tab.
   const [a,d]=await Promise.all([fetch('/api/garment-variations',{cache:'no-store'}),fetch('/api/garment-deletions',{cache:'no-store'})]);
   if(!a.ok||!d.ok)throw Error('清单读取失败，请重试');
   saved=(await a.json()).items;const deleted=new Set((await d.json()).items.filter(i=>i.deleted).map(i=>i.id));
   const selected=items.filter(i=>saved[i.id]?.pending&&!deleted.has(i.id)).map(i=>({id:i.id,name:i.name,category:i.shelf,basicTemplate:i.basicTemplate,sourceFront:i.sourceFront,sourceFrontSha256:i.sourceFrontSha256,preview:i.imageURL||i.thumbnail,request:saved[i.id].text,revision:saved[i.id].revision,updatedAt:saved[i.id].updatedAt}));
   const output={version:1,exportedAt:new Date().toISOString(),count:selected.length,instructions:'按项目 PRODUCTION_SOP.md 制作。开工前重新核对当前原件和删除状态，清单中的源图与哈希只是导出时的快照。派生款使用新 ID 并保留原件；只有修原件才沿用原 ID。保留已存位置、缩放、网格、曲线、印花和备注；只做正面可见衣料，无内片、无后片。逐件按 request 执行；完成后记录结果，再移出待处理。',items:selected};
   const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'})),aTag=document.createElement('a');aTag.href=url;aTag.download='服装变化待处理清单.json';aTag.click();setTimeout(()=>URL.revokeObjectURL(url),1000);error='';toolbar();redraw();
  }catch(e){error=e.message;toolbar();}finally{b.disabled=!loaded;}
 };
 window.addEventListener('beforeunload',e=>{if(Object.keys(drafts).length){e.preventDefault();e.returnValue='';}});
 window.addEventListener('focus',refresh);refresh();
})();
