'use strict';
(()=>{
 const params=new URLSearchParams(location.search),lesson=params.get('lesson'),match=lesson?.match(/^y2k-l([1-6])$/);
 if(params.get('chapter')==='y2k'||match){location.replace('assets/learning/y2k/index.html'+(match?'?level='+match[1]:''));return;}
 const host=document.querySelector('#content');
 function insert(){if(!host||journeyVisible||view!=='words'||document.querySelector('#nav').hidden||host.querySelector('#y2k-course-entry')||!host.querySelector('.journey-progress'))return;let data;try{data=JSON.parse(localStorage.getItem('wordrobe-y2k-course-v1')||'{}');}catch{data={};}const passed=(data.best||[]).filter(n=>Number.isInteger(n)&&n>=4).length;const panel=document.createElement('section');panel.id='y2k-course-entry';panel.className='y2k-course-entry';panel.setAttribute('data-no-i18n','');panel.innerHTML='<div><h2>Cyber Y2K · 从单品读懂时尚</h2><p>6个小关 · 12件单品 · 24核心词＋8拓展词 · 4篇完整阅读</p><p>已通过 '+passed+'/6 关 · 每关首次通过50积分 · 三张收藏卡</p><a class="primary" href="assets/learning/y2k/index.html">'+(passed?'继续 Y2K 课程':'进入 Y2K 课程')+'</a></div>';host.querySelector('.journey-progress').before(panel);}
 new MutationObserver(insert).observe(host,{childList:true});window.addEventListener('focus',insert);insert();
})();
