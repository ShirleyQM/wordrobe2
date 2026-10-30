'use strict';
(function(root){
 const KEY='wordrobe-fashion-cards-v1';let data,pending;
 const text=(zh,en)=>root.I18n?.lang()==='en'?en:zh;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const title=c=>root.I18n?.lang()==='en'?c.title:c.titleZh;
 function records(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}}
 function owned(c){return !!records()[c.id]||root.PlayerEconomy.owns('fashion-card:'+c.id);}
 async function load(){
  if(data)return data;
  if(!pending)pending=Promise.all([fetch('assets/cards/catalog.json?v=series-ready-20261030').then(r=>{if(!r.ok)throw Error(text('卡册载入失败，请重试。','Could not load cards. Tap to retry.'));return r.json();}),root.FashionSeries.load()]).then(async([original])=>{
   data=root.FashionSeries.mergeCards(original);
   const ids=data.cards.filter(owned).flatMap(c=>c.garments.map(g=>g.id));
   if(ids.length)await root.PlayerEconomy.grantItems(ids);
   return data;
  }).catch(error=>{data=null;pending=null;throw error;});
  return pending;
 }
 function forGarment(id,row){const linked=new Set(root.FashionSeries.forGarment(id,row).map(c=>c.id));return (data?.cards||[]).filter(c=>c.garments.some(g=>g.id===id)||linked.has(c.id));}
 function art(c){if(c.art.layout==='single')return `<img class="collection-art collection-art-single" src="${escape(c.art.url)}" alt="${escape(title(c))}" loading="lazy">`;return `<div class="collection-art" role="img" aria-label="${escape(title(c))}" style="background-image:url('${escape(c.art.url)}');background-position:${c.art.col*50}% ${c.art.row*50}%"></div>`;}
 async function redeem(id){
  await load();const c=data.cards.find(c=>c.id===id);
  if(!c||c.tier!=='collectible'||!c.garments.length)throw Error(text('配套服装尚未上线。','The matching clothes are not available yet.'));
  const result=await root.PlayerEconomy.purchaseBundle('fashion-card:'+c.id,c.price,c.garments.map(g=>g.id));if(result.insufficient)return result;
  const saved=records();saved[c.id]={...saved[c.id],tier:c.tier,at:saved[c.id]?.at||new Date().toISOString(),garmentIds:c.garments.map(g=>g.id)};localStorage.setItem(KEY,JSON.stringify(saved));return result;
 }
 async function claimLesson(lessonId){
  await load();const c=data.cards.find(c=>c.tier==='ordinary'&&c.lessonId===lessonId);if(!c)return;
  await root.PlayerEconomy.grantItems(c.garments.map(g=>g.id));const saved=records();saved[c.id]={...saved[c.id],tier:c.tier,lessonId,at:saved[c.id]?.at||new Date().toISOString(),garmentIds:c.garments.map(g=>g.id)};localStorage.setItem(KEY,JSON.stringify(saved));
 }
 function mount(host,options={}){
  const viewState=options.state||{};
  let filter=viewState.filter||'all',selected=options.cardId||viewState.selected||null,garment=options.garmentId||viewState.garment||null,seriesId=options.seriesId||viewState.seriesId||null,alive=true;
  const write=html=>{if(alive&&host.isConnected!==false)host.innerHTML=html;};
  const seriesLabel=id=>root.FashionSeries.label(root.FashionSeries.series(id));
  function tile(c){return `<button class="collection-card ${owned(c)?'owned':''}" data-card-open="${escape(c.id)}">${art(c)}<strong>${escape(title(c))}</strong><small>${escape(c.id)}${owned(c)?' · ✓':''}</small></button>`;}
  function section(s,cards){return `<section class="collection-series" data-series="${s.id}"><div class="collection-series-heading"><h3>${escape(seriesLabel(s.id))}</h3><small>${s.lessonReady?text('已开放 · '+s.lessonCount+'关',s.lessonCount+' lessons available'):s.outfitArtReady?text('服装稿已完成 · 关卡筹备中','Outfit art ready · lessons in progress'):text('设计预告 · 服装筹备中','Design preview · clothes in progress')}</small></div><div class="collection-grid">${cards.map(tile).join('')}</div></section>`;}
  function detailHTML(c){
   const has=owned(c),s=root.FashionSeries.series(c.seriesId);
   const pieces=root.FashionSeries.piecesForCard(c.id),rows=new Map();
   for(const p of pieces)rows.set(p.id,{...rows.get(p.id),id:p.id,image:p.image,name:p.nameZh,nameEn:p.nameEn});
   for(const g of [...c.garments,...(options.runtimeForCard?.(c.id)||[])])rows.set(g.id,{...rows.get(g.id),...g,image:g.thumbnail||g.image});
   const garments=[...rows.values()].map(g=>{
    const canWear=options.canWear?options.canWear(g.id):c.garments.some(row=>row.id===g.id);
    return `<button data-card-wear="${escape(g.id)}" ${canWear?'':'disabled'}><img src="${escape(g.image)}" alt="" loading="lazy"><span>${escape(root.I18n?.lang()==='en'?g.nameEn||g.name:g.name)}</span><small>${canWear?text(root.PlayerEconomy.owns(g.id)?'去衣橱':'去试穿',root.PlayerEconomy.owns(g.id)?'View in wardrobe':'Try on'):text('服装待上线','Clothes in progress')}</small></button>`;
   }).join('');
   return `<button data-card-back>← ${text('返回卡册','Back to cards')}</button><p class="collection-card-origin">${escape(s?seriesLabel(s.id):text('早期设计收藏','Earlier design'))} · ${escape(c.id)}</p>${art(c)}<h2>${escape(title(c))}</h2>${c.brand?`<p class="collection-design-source">${text('设计参考','Design reference')} · ${escape(c.brand)}${c.sourceUrl?` <a href="${escape(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">↗</a>`:''}</p>`:''}${c.legacy?`<p>${escape(root.I18n?.lang()==='en'?c.description:c.descriptionZh)}</p>`:''}<h3>${text('这一套的单品','Pieces in this look')}</h3>${garments?`<div class="collection-garments">${garments}</div>`:`<p class="collection-waiting">${text('单品制作中，先收藏设计灵感。','Pieces are in progress. Explore the design for now.')}</p>`}${c.lessonReady||c.legacy&&c.tier==='ordinary'?`<button data-card-study="${escape(c.lessonId)}">${text(has?'回顾关卡':'前往关卡',has?'Review lesson':'Open lesson')}</button>`:c.tier==='collectible'&&c.garments.length?`<button data-card-redeem="${escape(c.id)}" ${has?'disabled':''}>${has?text('已收藏','Collected'):text('兑换','Redeem')+' · ◈ '+c.price}</button>`:`<p class="collection-waiting">${text('关卡筹备中','Lessons in progress')}</p>`}`;
  }
  function listHTML(){
   const all=data.cards,matching=garment?forGarment(garment,options.getGarment?.(garment)):all;
   const scoped=matching.filter(c=>(!seriesId||c.seriesId===seriesId)&&(filter==='all'||(filter==='owned'?owned(c):c.tier===filter)));
   const canonical=scoped.filter(c=>!c.legacy),explicit=!!(seriesId||garment)||filter==='owned';
   const ready=canonical.filter(c=>explicit||c.lessonReady||c.outfitArtReady);
   const groups=root.FashionSeries.orderedSeries().filter(s=>ready.some(c=>c.seriesId===s.id));
   let body=`<div class="collection-filters">${[['all','全部','All'],['ordinary','普通卡','Ordinary'],['collectible','典藏卡','Collectibles'],['owned','已收藏 '+data.cards.filter(owned).length,'Collected '+data.cards.filter(owned).length]].map(([id,zh,en])=>`<button data-card-filter="${id}" aria-pressed="${filter===id}">${text(zh,en)}</button>`).join('')}</div>${seriesId||garment?`<div class="collection-scope"><span>${escape(garment?text('这件衣服的关联卡片','Cards for this piece'):seriesLabel(seriesId))}</span><button data-card-clear>${text('全部系列','All series')}</button></div>`:''}`;
   body+=groups.map(s=>section(s,ready.filter(c=>c.seriesId===s.id))).join('');
   const legacy=scoped.filter(c=>c.legacy&&owned(c));
   if(legacy.length)body+=`<section class="collection-series"><h3>${text('早期设计收藏','Earlier designs')}</h3><div class="collection-grid">${legacy.map(tile).join('')}</div></section>`;
   if(!explicit&&filter!=='owned'){
    const planned=root.FashionSeries.orderedSeries().filter(s=>!s.outfitArtReady&&canonical.some(c=>c.seriesId===s.id));
    if(planned.length)body+=`<details class="collection-pending" data-card-pending ${viewState.pendingOpen?'open':''}><summary><span>${text('后续系列','Coming series')} · ${planned.length}</span><small>${text('展开看设计预告','Explore design previews')}</small></summary><div class="collection-pending-list">${planned.map(s=>{const c=canonical.find(c=>c.seriesId===s.id);return `<button data-card-series="${s.id}"><img src="${escape(c.art.url)}" alt="" loading="lazy"><span><strong>${escape(seriesLabel(s.id))}</strong><small>${text('3张设计卡 · 服装筹备中','3 designs · clothes in progress')}</small></span><span aria-hidden="true">›</span></button>`;}).join('')}</div></details>`;
   }
   if(!ready.length&&!legacy.length&&!canonical.some(c=>!c.outfitArtReady))body+=`<p class="collection-empty">${text(filter==='owned'?'还没有收藏，完成关卡就能获得。':'这里暂时没有卡片。',filter==='owned'?'Complete a lesson to collect your first card.':'No cards here yet.')}</p>`;
   return body;
  }
  function paint(){if(!alive)return;Object.assign(viewState,{filter,selected,garment,seriesId});const detail=data.cards.find(c=>c.id===selected),planned=root.FashionSeries.orderedSeries().filter(s=>!s.outfitArtReady).length;write(`<section class="collection-panel" data-no-i18n><div class="collection-heading"><h2>${text('卡册','Cards')}</h2>${planned?`<button class="collection-roadmap-link" data-card-planned>${text(planned+'个后续系列 ›',planned+' coming series ›')}</button>`:''}</div><p class="collection-message" role="status"></p>${detail?detailHTML(detail):listHTML()}</section>`);}
  host.onclick=async e=>{
   const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
   if('cardPlanned'in d){filter='all';seriesId=null;garment=null;selected=null;viewState.pendingOpen=true;paint();const drawer=host.querySelector('.collection-pending');drawer?.scrollIntoView({block:'start'});drawer?.querySelector('summary').focus({preventScroll:true});}
   else if(d.cardFilter){filter=d.cardFilter;selected=null;paint();}
   else if(d.cardOpen){selected=d.cardOpen;paint();host.closest('#items')?.scrollTo({top:0});}
   else if(d.cardSeries){seriesId=d.cardSeries;selected=null;paint();host.closest('#items')?.scrollTo({top:0});}
   else if('cardBack'in d){selected=null;paint();}
   else if('cardClear'in d){garment=null;seriesId=null;selected=null;paint();}
   else if(d.cardStudy){if(options.onStudy)options.onStudy(d.cardStudy);else location.href='learn.html?lesson='+encodeURIComponent(d.cardStudy);}
   else if(d.cardWear)options.onGarment?.(d.cardWear);
   else if(d.cardRedeem){b.disabled=true;try{const r=await redeem(d.cardRedeem);paint();if(r.insufficient)host.querySelector('.collection-message').textContent=text('积分不足，去学习赚积分吧。','Not enough points. Study to earn more.');}catch(error){b.disabled=false;host.querySelector('.collection-message').textContent=error.message;}}
   else if('cardRetry'in d)start();
  };
  const toggle=e=>{if(e.target.matches?.('[data-card-pending]'))viewState.pendingOpen=e.target.open;};host.addEventListener('toggle',toggle,true);
  const repaint=()=>{if(data)paint();};root.addEventListener('language-changed',repaint);root.addEventListener('wallet-updated',repaint);
  async function start(){write(`<p>${text('正在打开卡册…','Opening cards…')}</p>`);try{await load();paint();}catch(error){write(`<p>${escape(error.message)}</p><button data-card-retry>${text('重试','Retry')}</button>`);}}
  start();return {dispose(){alive=false;root.removeEventListener('language-changed',repaint);root.removeEventListener('wallet-updated',repaint);host.removeEventListener('toggle',toggle,true);host.onclick=null;}};
 }
 root.CardLibrary={load,owned,forGarment,redeem,claimLesson,mount};
})(window);
