'use strict';
(function(root){
 function merge(player,editor){
  const next={...player,positionDefaults:{front:{...(player.positionDefaults?.front||{}),...(editor.positionDefaults?.front||{})},back:{...(player.positionDefaults?.back||{}),...(editor.positionDefaults?.back||{})}},piecePlacement:{...(player.piecePlacement||{}),...(editor.piecePlacement||{})}};
  if(Array.isArray(editor.palette))next.palette=editor.palette.filter(v=>Array.isArray(v)&&/^#[0-9a-f]{6}$/i.test(v[0])&&typeof v[1]==='string').map(v=>[v[0].toLowerCase(),v[1].slice(0,24),...(v[2]?.kind==='highlight'?[JSON.parse(JSON.stringify(v[2]))]:[])]);
  // Older editor versions persist free width/height transforms on the active fit.
  for(const side of ['front','back'])if(editor[side]&&editor[side]!=='none'&&editor[side+'Fit']&&(!editor.positionDefaults?.[side]?.[editor[side]]||['x','y'].every(k=>(editor.positionDefaults[side][editor[side]][k]||0)===0)&&editor.positionDefaults[side][editor[side]].scale===1.2&&(editor.positionDefaults[side][editor[side]].sx||1)===1&&(editor.positionDefaults[side][editor[side]].sy||1)===1))next.positionDefaults[side][editor[side]]={...(next.positionDefaults[side][editor[side]]||{}),...editor[side+'Fit']};
  for(const side of ['front','back'])if(next.positionDefaults[side][next[side]])next[side+'Fit']={...next.positionDefaults[side][next[side]]};
  return next;
 }
 if(typeof module!=='undefined'&&module.exports){module.exports=merge;return;}
 const key='wardrobe-mobile-hair-v1';root.HAIR_STORAGE_KEY=key;
 let published={},publishedStamp;
 function sync(){try{
  const editor=JSON.parse(localStorage.getItem('wardrobe-hair-v1')||'{}'),stored=localStorage.getItem(key),player=stored?JSON.parse(stored):{...editor,enabled:true},next=merge(merge(player,editor),published);const personal=JSON.parse(localStorage.getItem('wardrobe-mobile-palette-v1')||'null');if(Array.isArray(personal))next.palette=personal;const value=JSON.stringify(next);
  if(value!==stored){localStorage.setItem(key,value);root.dispatchEvent(new CustomEvent('hair-defaults-synced',{detail:next}));}
 }catch(e){console.warn('发型位置暂未同步',e);}}
 let refreshFlight=null,refreshTimer;
 function refresh(){if(refreshFlight)return refreshFlight;refreshFlight=(async()=>{try{const r=await fetch('/api/hair-defaults',{cache:'no-store'});if(r.ok){const next=await r.json(),stamp=JSON.stringify(next);if(stamp!==publishedStamp){published=next;publishedStamp=stamp;sync();}}}catch(e){}})();refreshFlight.then(()=>{refreshFlight=null;},()=>{refreshFlight=null;});return refreshFlight;}
 function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120);}
 sync();refresh();root.addEventListener('focus',refresh);root.addEventListener('pageshow',refresh);root.addEventListener('storage',e=>{if(['wardrobe-hair-v1','wardrobe-hair-published-revision-v1'].includes(e.key))scheduleRefresh();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 // Only the local authoring preview has a live server; offline releases have a fixed snapshot.
 if(!root.ToolData)setInterval(()=>{if(!document.hidden)refresh();},2000);
})(typeof window!=='undefined'?window:null);
