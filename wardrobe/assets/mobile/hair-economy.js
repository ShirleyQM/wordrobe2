(function(root){
'use strict';
function key(side,id){return 'hair:'+side+':'+id;}
function price(row){if([30,60,80].includes(row.price))return row.price;const name=row.name||'';if(/编|辫|双马尾|双尾|双髻|花冠|蝴蝶结|繁复|braid|twin|crown|ribbon/i.test(name))return 80;if(/卷|波浪|马尾|半束|高髻|低髻|层次|盘发|侧束|高束|环髻|双丸|curl|wave|ponytail|bun|layer|half.up/i.test(name))return 60;return 30;}
function preview(current,row,entries,mode){const next={...current,front:[...current.front],back:[...current.back]},same=entries.filter(i=>next[i.side].includes(i.id)),limit=mode==='single'?1:2;for(const old of same.slice(0,Math.max(0,same.length-limit+1)))next[old.side]=next[old.side].filter(id=>id!==old.id);if(!next[row.side].includes(row.id))next[row.side].push(row.id);return next;}
const api={key,price,preview};if(typeof module!=='undefined')module.exports=api;else root.MobileHairEconomy=api;
})(typeof window!=='undefined'?window:null);
