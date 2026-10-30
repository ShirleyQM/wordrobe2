'use strict';
// One editing toolbar and one draft browser serve both garment and hair color editing.
window.MobileEditUI=(()=>{
 const key='wordrobe-hair-edit-drafts-v1',copy=v=>JSON.parse(JSON.stringify(v));let hairDrafts=[];try{hairDrafts=JSON.parse(localStorage.getItem(key)||'[]');}catch(e){}
 const hairHistory=[];let focusToken=0,focusStamp='',lastGarment=null;const focusBoxes=new Map();
 const hairColor=()=>{const h=HairStudio.consumer.get();return {color:h.color,dye:copy(h.dye||{})};};
 const restoreHair=value=>HairStudio.consumer.restore({...HairStudio.consumer.get(),...value});
 function openDrafts(scope){if(scope==='tailor'){EditUI.drafts({title:EditUI.text('衣服草稿','Garment Drafts'),rows:MobileTailor.drafts().map(d=>{const i=item(d.id);return {id:d.id,name:d.pending?(I18n.lang()==='en'?d.pending.nameEn:d.pending.name):garmentLabel(i),image:i.thumbnail||i.image,preview:()=>MobileTailor.draftPreview(d.id)};}),save:()=>{MobileTailor.saveDraft();render();},restore:id=>{const i=MobileTailor.restoreDraft(id);if(i){tailorItem=i.id;category=i.slot;lastGarment=null;render();}}});return;}
 EditUI.drafts({title:EditUI.text('染发草稿','Hair Color Drafts'),rows:hairDrafts.map(d=>({id:d.id,name:d.name,color:d.value.color})),save:()=>{const value=hairColor(),name=document.querySelector('#palette-name')?.value.trim()||EditUI.text('染发','Hair Color')+' · '+value.color;const existing=hairDrafts.find(d=>JSON.stringify(d.value)===JSON.stringify(value));if(!existing)hairDrafts.unshift({id:'hair-draft-'+Date.now(),name,value});hairDrafts=hairDrafts.slice(0,20);localStorage.setItem(key,JSON.stringify(hairDrafts));render();},restore:id=>{const d=hairDrafts.find(d=>d.id===id);if(d){hairHistory.push(hairColor());restoreHair(d.value);render();}}});}
 function skin(){const tailor=tab==='tailor';const foot=document.querySelector('#tailor-footer');if(foot){foot.classList.add('edit-toolbar');if(tailor){foot.innerHTML=EditUI.toolbar('tailor',MobileTailor.canUndo(),MobileTailor.drafts().length);syncTailorTools();}}
 let hairFoot=document.querySelector('#hair-edit-footer');if(!hairFoot){hairFoot=document.createElement('div');hairFoot.id='hair-edit-footer';hairFoot.className='edit-toolbar';document.querySelector('.closet').append(hairFoot);hairFoot.onclick=e=>{const b=e.target.closest('[data-hair-edit-action]');if(!b)return;const action=b.dataset.hairEditAction;if(action==='undo'){const old=hairHistory.pop();if(old){restoreHair(old);render();}}if(action==='draft')openDrafts('hair');if(action==='save'){const handler=document.querySelector('#hair-colors').onclick;b.setAttribute('data-palette-save','');handler({target:b});}};}
 hairFoot.hidden=tab!=='hair';if(tab==='hair'){hairFoot.innerHTML=EditUI.toolbar('hair',hairHistory.length>0,hairDrafts.length);document.querySelector('#hair-colors [data-palette-save]')?.remove();}
 if(tailor&&MobileTailor.current()?.id!==lastGarment){lastGarment=MobileTailor.current()?.id;mobileView=preferredRegion();lastContext='';focusRegion(preferredRegion(),true);}if(!tailor)lastGarment=null;focus();}
 const ownsCamera=()=>mobileView!=='full'&&(tab==='tailor'||tab==='hair'||(tab==='face'&&window.LookLab));
 function focus(){const current=MobileTailor.current(),isTailor=tab==='tailor',stage=document.querySelector('.stage'),figure=document.querySelector('.campus-figure');if(!stage||!figure||!ownsCamera()){focusStamp='';focusToken++;return;}
 const focusTab=tab,id=isTailor?current?.id:'hair',source=isTailor?(current?.image||''):'head',stamp=[tab,id,source,mobileView,stage.clientWidth,stage.clientHeight,figure.offsetWidth,figure.offsetHeight].join(':');if(stamp===focusStamp)return;focusStamp=stamp;const token=++focusToken;
 const apply=b=>{if(token!==focusToken||!ownsCamera()||tab!==focusTab)return;const live=document.querySelector('.campus-figure');if(!live)return;const w=live.offsetWidth,h=live.offsetHeight;if(!w||!h){focusStamp='';return;}focusStamp=[tab,id,source,mobileView,stage.clientWidth,stage.clientHeight,w,h].join(':');const zoom=Math.min(6,Math.max(1,Math.min((stage.clientWidth-94)/(b.w*w),(stage.clientHeight-38)/(b.h*h))));const x=-((b.x+b.w/2)-.5)*w*zoom,y=(stage.clientHeight/2-8)-(b.y+b.h/2)*h*zoom;panX=x;panY=0;applyPan();stage.style.setProperty('--figure-zoom',zoom);stage.style.setProperty('--figure-shift',y/h*100+'%');};
 if(!isTailor){apply({x:.18,y:0,w:.64,h:.26});return;}
 if(!current)return;const key=current.id+':'+source,box=focusBoxes.get(key);if(box){apply(box);return;}
 MobileTailor.focusBounds(current).then(b=>{focusBoxes.set(key,b);apply(b);}).catch(()=>{if(token===focusToken)focusStamp='';});
 }

 document.querySelector('#hair-colors').addEventListener('click',e=>{if(e.target.closest('[data-palette]')){hairHistory.push(hairColor());if(hairHistory.length>40)hairHistory.shift();}},true);
 document.querySelector('#hair-colors').addEventListener('input',e=>{if(e.target.matches('input[type=color],#palette-hex')&&/^#[0-9a-f]{6}$/i.test(e.target.value)){hairHistory.push(hairColor());if(hairHistory.length>40)hairHistory.shift();requestAnimationFrame(()=>{if(tab==='hair'){const f=document.querySelector('#hair-edit-footer');f.innerHTML=EditUI.toolbar('hair',hairHistory.length>0,hairDrafts.length);}});}},true);
 const previous=render;render=function(){previous();skin();};
 const previousFocus=focusRegion;focusRegion=function(region,force){if(force){focusStamp='';focusToken++;}previousFocus(region,force);focus();};
 window.addEventListener('tailor-draft',()=>{const footer=document.querySelector('#tailor-footer');if(tab==='tailor'&&footer){footer.innerHTML=EditUI.toolbar('tailor',MobileTailor.canUndo(),MobileTailor.drafts().length);syncTailorTools();}});
 return {openDrafts,focus,ownsCamera};
})();
