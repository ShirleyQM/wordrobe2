'use strict';
(()=>{
 const text=(zh,en)=>I18n.lang()==='en'?en:zh;let panel=null,request=null,panelState={};
 const button=document.createElement('button');button.dataset.tab='cards';button.textContent=text('卡片','Cards');document.querySelector('.main-tabs [data-tab=looks]').after(button);
 I18n.register({'卡片':'Cards','关联卡片':'Linked cards','暂无关联卡':'No linked card'});
 function goGarment(id){const row=item(id);if(!row){toast(text('这件服装尚未上线','This piece is not available yet'));return;}tab='clothes';category=row.slot;render();const b=[...document.querySelectorAll('#items [data-item]')].find(b=>b.dataset.item===id);b?.scrollIntoView({block:'nearest'});}
 function links(){
  if(tab!=='clothes')return;
  for(const b of document.querySelectorAll('#items button[data-item]')){
   const row=item(b.dataset.item),name=b.querySelector('.item-name');if(name&&row)name.textContent=GarmentNames.display(row);
   const matches=CardLibrary.forGarment(b.dataset.item,row);if(!matches.length||b.parentElement.classList.contains('card-product-wrap'))continue;
   const wrap=document.createElement('div');wrap.className='card-product-wrap';b.before(wrap);wrap.append(b);
   const link=document.createElement('button');link.className='card-garment-link';link.dataset.cardGarment=b.dataset.item;
   const s=window.FashionSeries?.series(matches[0].seriesId),label=s?FashionSeries.label(s):text('关联卡片','Linked cards');
   link.textContent=label+(matches.length>1?' · '+text('多卡共用','Shared across cards'):' · '+(I18n.lang()==='en'?matches[0].title:matches[0].titleZh));
   link.setAttribute('aria-label',text('查看衣服的关联卡片','View linked cards')+' · '+(row?.name||''));wrap.append(link);
  }
 }
 function show(options={}){panel?.dispose();$('#items').innerHTML='<div id="card-library-host"></div>';panel=CardLibrary.mount($('#card-library-host'),{...options,state:panelState,onGarment:goGarment,canWear:id=>!!item(id),getGarment:item,runtimeForCard:id=>catalog.filter(row=>FashionSeries.forGarment(row.id,row).some(c=>c.id===id)),onStudy:id=>window.GameLearningPanel?GameLearningPanel.open(id):location.assign('learn.html?lesson='+encodeURIComponent(id))});}
 const previous=render;render=function(){panel?.dispose();panel=null;previous();document.querySelector('.mobile-app').classList.toggle('cards-open',tab==='cards');$('#items').classList.toggle('card-items',tab==='cards');button.textContent=text('卡片','Cards');if(tab==='cards'){$('#categories').hidden=true;$('#hair-colors').hidden=true;$('#atelier-actions').hidden=true;const actions=$('#look-stage-actions');if(actions)actions.hidden=true;show(request||{});request=null;}else links();};
 function open(options={}){if(tab==='learning')window.GameLearningPanel?.close();panelState={};request=options;tab='cards';render();button.scrollIntoView({inline:'nearest',block:'nearest'});}
 window.MobileCards={open};
 $('#items').addEventListener('click',e=>{const b=e.target.closest('[data-card-garment]');if(!b)return;e.stopPropagation();open({garmentId:b.dataset.cardGarment});});
 CardLibrary.load().then(()=>{if(tab==='clothes')links();}).catch(()=>{});
 const query=new URLSearchParams(location.search);if(query.get('panel')==='cards'){request={seriesId:query.get('series')||null};tab='cards';render();}
})();

