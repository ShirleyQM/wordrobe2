(function(root){'use strict';
const clamp=n=>Number.isInteger(n)?Math.min(6,Math.max(0,n)):0;
function clean(s){return {version:1,best:Array.from({length:6},(_,i)=>clamp(s?.best?.[i])),seen:Array.isArray(s?.seen)?s.seen.filter(x=>typeof x==='string'):[],observations:s?.observations&&typeof s.observations==='object'&&!Array.isArray(s.observations)?s.observations:{},attempt:s?.attempt||null};}
function stats(s){const best=clean(s).best;return {xp:best.reduce((a,n)=>a+n*10,0),stars:best.reduce((a,n)=>a+(n>=4?n-3:0),0),passed:best.filter(n=>n>=4).length,cards:[1,3,5].filter(i=>best[i]>=4)};}
function unlocked(s,i){return i===0||Number.isInteger(i)&&i>0&&i<6&&clean(s).best.slice(0,i).every(n=>n>=4);}
function finish(s,i,correct){const out=clean(s);if(!Number.isInteger(i)||i<0||i>5||!unlocked(out,i))throw Error('关卡尚未解锁');const before=stats(out);out.best[i]=Math.max(out.best[i],clamp(correct));out.attempt=null;const after=stats(out);return {state:out,xpGain:after.xp-before.xp,passed:correct>=4,newCard:[1,3,5].includes(i)&&clean(s).best[i]<4&&correct>=4};}
const api={clean,stats,unlocked,finish};root.Y2KCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
