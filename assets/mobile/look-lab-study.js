'use strict';
// Use the real learning engine with the QA wallet and wardrobe storage prefix.
(()=>{const note=document.createElement('p');note.className='learning-goal';note.style.cssText='margin:10px 24px;padding:12px;font-size:12px';note.textContent=I18n.lang()==='en'?'Prototype · Study rewards and wardrobe are isolated from the live game.':'玩法原型 · 学习奖励与衣橱使用独立测试存档';document.querySelector('header').after(note);
 document.addEventListener('click',e=>{const link=e.target.closest('a[href^="mobile.html"]');if(!link)return;e.preventDefault();e.stopImmediatePropagation();const target=new URL(link.href),unlock=target.searchParams.get('unlock');location.href='/assets/tailor-qa.html?labReturn=1'+(unlock?'&unlock='+encodeURIComponent(unlock):'');},true);
})();
