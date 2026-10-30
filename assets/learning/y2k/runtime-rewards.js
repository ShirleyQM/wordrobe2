(function(root){'use strict';
 const CARD_BY_LEVEL={1:'S04-F01',3:'S04-F02',5:'S04-F03'};
 async function settleAwards(progress,api,amount=50){for(let i=0;i<6;i++){if(!Number.isInteger(progress?.best?.[i])||progress.best[i]<4)continue;await api.grant('y2k-course-v1:level-'+(i+1),amount);if(CARD_BY_LEVEL[i])await api.grantItems(['fashion-card:'+CARD_BY_LEVEL[i]]);}return true;}
 const exported={settleAwards};if(typeof module!=='undefined'&&module.exports){module.exports=exported;return;}
 let pending=null,busy=null;const status=()=>document.getElementById('runtime-reward-status'),retry=()=>document.getElementById('runtime-reward-retry');
 function balance(){const el=document.getElementById('runtime-balance');if(el){el.innerHTML=PointsUI(PlayerEconomy.balance());el.setAttribute('aria-label',PlayerEconomy.balance()+' points');};}
 async function settle(progress){pending=JSON.parse(JSON.stringify(progress));if(busy)return busy;busy=(async()=>{try{status().textContent='Checking rewards…';retry().hidden=true;let snapshot;do{snapshot=pending;await settleAwards(snapshot,PlayerEconomy,EconomyRules.lessonReward);}while(snapshot!==pending);balance();status().textContent='Rewards saved.';return true;}catch(e){status().textContent='Rewards could not sync. Retry to collect them safely.';retry().hidden=false;return false;}finally{busy=null;}})();return busy;}
 root.Y2KRewards={settle};root.addEventListener('wallet-updated',balance);
 document.addEventListener('DOMContentLoaded',()=>{balance();retry().onclick=()=>settle(pending);let p;try{p=JSON.parse(localStorage.getItem('wordrobe-y2k-course-v1')||'{}');}catch{p={};}if(p.best?.some(n=>n>=4))settle(p);const wanted=Number(new URL(location.href).searchParams.get('level'));if(wanted>=1&&wanted<=6&&root.Y2KCore.unlocked(p,wanted-1))start(wanted-1);});
})(typeof window==='undefined'?globalThis:window);
