'use strict';
(()=>{let started=false;const previous=render;render=function(){if(!started&&catalog.some(i=>i.slot==='top'&&i.capabilities?.print&&PlayerEconomy.owns(i.id))){started=true;const drafts=JSON.parse(localStorage.getItem('wordrobe-tailor-drafts-v2')||'{}');const selected=catalog.find(i=>drafts[i.id]&&(i.capabilities?.print||i.capabilities?.recolor))||catalog.find(i=>i.capabilities?.print&&i.capabilities?.recolor&&PlayerEconomy.owns(i.id));tab='tailor';tailorItem=selected?.id||null;category=selected?.slot||'top';}previous();};
document.querySelector('#qa-fund').onclick=()=>{const wallet=PlayerEconomy.snapshot();wallet.balance=240;localStorage.setItem('word-atelier-wallet-v1',JSON.stringify(wallet));render();};
for(const link of document.querySelectorAll('a[href="learn.html"]'))link.onclick=e=>{e.preventDefault();toast('当前是隔离测试页，请使用补充测试积分');};
document.querySelector('.wordmark').href='/assets/tailor-qa.html';
document.querySelector('#qa-lock').onclick=()=>{const wallet=PlayerEconomy.snapshot();wallet.owned=wallet.owned.filter(id=>id!=='feature:tailor');localStorage.setItem('word-atelier-wallet-v1',JSON.stringify(wallet));tab='tailor';render();};
})();
