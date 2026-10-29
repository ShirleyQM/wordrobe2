'use strict';
(()=>{
 const text=(zh,en)=>I18n.lang()==='en'?en:zh;let panel=null,request=null,panelState={};
 const button=document.createElement('button');button.dataset.tab='cards';button.textContent=text('卡片','Cards');document.querySelector('.main-tabs [data-tab=looks]').after(button);
 I18n.register({'卡片':'Cards','关联卡片':'Linked cards','暂无关联卡':'No linked card'});
 function goGarment(id){const row=item(id);if(!row){toast(text('这件衣服暂未展示','This garment is unavailable'));return;}tab='clothes';category=row.slot;render();const b=[...document.querySelectorAll('#items [data-item]')].find(b=>b.dataset.item===id);b?.scrollIntoView({block:'nearest'});}
 function links(){if(tab!=='clothes')return;for(const b of document.querySelectorAll('#items button[data-item]')){if(b.parentElement.classList.contains('card-product-wrap'))continue;const wrap=document.createElement('div');wrap.className='card-product-wrap';b.before(wrap);wrap.append(b);const link=document.createElement('button');link.className='card-garment-link';link.dataset.cardGarment=b.dataset.item;const matches=CardLibrary.forGarment(b.dataset.item);link.textContent=matches.length?text('关联卡片','Linked cards')+' · '+matches.length:text('暂无关联卡','No linked card');link.setAttribute('aria-label',text('查看衣服的关联卡片','View linked cards')+' · '+(item(b.dataset.item)?.name||''));wrap.append(link);}}
 function show(options={}){panel?.dispose();$('#items').innerHTML='<div id="card-library-host"></div>';panel=CardLibrary.mount($('#card-library-host'),{...options,state:panelState,onGarment:goGarment});}
 const previous=render;render=function(){panel?.dispose();panel=null;previous();$('#items').classList.toggle('card-items',tab==='cards');button.textContent=text('卡片','Cards');if(tab==='cards'){$('#categories').hidden=true;$('#hair-colors').hidden=true;$('#atelier-actions').hidden=true;const actions=$('#look-stage-actions');if(actions)actions.hidden=true;show(request||{});request=null;}else links();};
 $('#items').addEventListener('click',e=>{const b=e.target.closest('[data-card-garment]');if(!b)return;e.stopPropagation();panelState={};request={garmentId:b.dataset.cardGarment};tab='cards';render();});
 CardLibrary.load().then(()=>{if(tab==='clothes')links();}).catch(()=>{});
 const query=new URLSearchParams(location.search);if(query.get('panel')==='cards'){tab='cards';render();}
})();
