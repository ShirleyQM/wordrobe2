'use strict';
(() => {
 const dialog=document.querySelector('#garment-notes-dialog'),status=document.querySelector('#notes-status'),text=document.querySelector('#notes-text'),save=document.querySelector('#save-notes');
 let target=null,record=null,busy=false;
 const tags=[...dialog.querySelectorAll('[data-note-tag]')];
 document.querySelector('#garment-notes').addEventListener('click',async()=>{
  if(!current()||dialog.open)return;
  target={id:current().id,name:current().name};const openingTarget=target;record=null;
  document.querySelector('#notes-item-name').textContent=target.name;
  text.value='';text.disabled=true;save.disabled=true;status.textContent='读取中…';
  for(const button of tags){button.setAttribute('aria-pressed','false');button.disabled=true;}
  dialog.showModal();
  try{
   const response=await fetch('/api/garment-notes/'+encodeURIComponent(target.id),{cache:'no-store'}),result=await response.json();
   if(!response.ok)throw Error(result.error||'备注读取失败');
   if(!dialog.open||target!==openingTarget)return;
   record=result;text.value=result.text;text.disabled=false;save.disabled=false;
   for(const button of tags){button.disabled=false;button.setAttribute('aria-pressed',String(result.tags.includes(button.dataset.noteTag)));}
   status.textContent=result.revision?'已载入保存的备注':'';
  }catch(e){status.textContent=e.message;}
 });
 for(const button of tags)button.addEventListener('click',()=>{button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));status.textContent='未保存';});
 text.addEventListener('input',()=>{status.textContent='未保存';});
 document.querySelector('#close-notes').addEventListener('click',()=>{if(!busy)dialog.close();});
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 save.addEventListener('click',async()=>{
  if(!record||busy)return;busy=true;save.disabled=true;save.textContent='保存中…';text.disabled=true;for(const button of tags)button.disabled=true;
  try{
   const response=await fetch('/api/garment-notes/'+encodeURIComponent(target.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:record.revision,tags:tags.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.noteTag),text:text.value})}),result=await response.json();
   if(!response.ok)throw Error(result.error||'备注保存失败');
   record=result;status.textContent='已保存';toast('衣服备注已保存');
  }catch(e){status.textContent='未保存：'+e.message;}
  finally{busy=false;save.disabled=false;save.textContent='保存备注';text.disabled=false;for(const button of tags)button.disabled=false;}
 });
})();
