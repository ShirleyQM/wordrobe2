(function(root){
'use strict';
function price(i){const n=i.originalName||i.name||'',slot=i.slot;let base=({top:55,bottom:65,dress:85,coat:85,shoes:65,socks:40,bra:40,briefs:40,jewelry:50,bag:65})[slot]||55;
if(/T.?恤|纯棉|基础|平口内搭/.test(n))base=40;
if(slot==='dress'&&/蕾丝|珠绣|缀钻|礼服/.test(n))base=100;if(slot==='bottom'&&/层叠|多层/.test(n)&&/蕾丝|绣/.test(n))base=85;
let detail=0;for(const [rx,points]of [[/蕾丝|lace/i,15],[/珠绣|缀钻|钉珠|亮片/,20],[/褶裥|百褶|抽褶|荷叶/,10],[/拼片|拼接|撞色/,5],[/蝴蝶结|系带|绑带/,5],[/流苏|金扣|铆钉/,10],[/麂皮|丝绒|缎面/,5],[/礼服|鱼尾|层叠|多层/,20]])if(rx.test(n))detail+=points;
const hash=[...String(i.id)].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0),variation=(hash%5-2)*5;
return Math.max(40,Math.min(120,base+detail+variation));}
const api={lessonReward:50,recolorPrice:10,price};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EconomyRules=api;
})(typeof window!=='undefined'?window:null);
