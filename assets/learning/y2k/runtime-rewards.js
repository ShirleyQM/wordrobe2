(function(root){'use strict';
 const CARD_BY_LEVEL={1:'S04-F01',3:'S04-F02',5:'S04-F03'};
 async function settleAwards(progress,api,amount=50){for(let i=0;i<6;i++){if(!Number.isInteger(progress?.best?.[i])||progress.best[i]<4)continue;await api.grant('y2k-course-v1:level-'+(i+1),amount);if(CARD_BY_LEVEL[i])await api.grantItems(['fashion-card:'+CARD_BY_LEVEL[i]]);}return true;}
 const exported={settleAwards};if(typeof module!=='undefined'&&module.exports){module.exports=exported;return;}
 let pending=null,busy=null;const status=()=>document.getElementById('runtime-reward-status'),retry=()=>document.getElementById('runtime-reward-retry');
 function balance(){const el=document.getElementById('runtime-balance');if(el)el.textContent=PlayerEconomy.balance()+' 积分';}
 async function settle(progress){pending=JSON.parse(JSON.stringify(progress));if(busy)return busy;busy=(async()=>{try{status().textContent='正在核对通关奖励…';retry().hidden=true;let snapshot;do{snapshot=pending;await settleAwards(snapshot,PlayerEconomy,EconomyRules.lessonReward);}while(snapshot!==pending);balance();status().textContent='通关奖励已同步到游戏钱包与卡册';return true;}catch(e){status().textContent='奖励尚未同步，可重试；已获得的积分不会重复发放。';retry().hidden=false;return false;}finally{busy=null;}})();return busy;}
 root.Y2KRewards={settle};root.addEventListener('wallet-updated',balance);
 document.addEventListener('DOMContentLoaded',()=>{balance();retry().onclick=()=>settle(pending);let p;try{p=JSON.parse(localStorage.getItem('wordrobe-y2k-course-v1')||'{}');}catch{p={};}if(p.best?.some(n=>n>=4))settle(p);const wanted=Number(new URL(location.href).searchParams.get('level'));if(wanted>=1&&wanted<=6&&root.Y2KCore.unlocked(p,wanted-1))start(wanted-1);});
})(typeof window==='undefined'?globalThis:window);
