'use strict';
(()=>{
 const app=document.querySelector('.mobile-app'),closet=document.querySelector('.closet'),tabs=document.querySelector('.main-tabs');
 const oldLink=tabs.querySelector('a.learn-link');const button=document.createElement('button');button.dataset.tab='learning';button.textContent=I18n.lang()==='en'?'Study':'学习';oldLink.replaceWith(button);
 const host=document.createElement('section');host.id='learning-panel';host.hidden=true;host.setAttribute('aria-label','学习面板');closet.append(host);
 const frame=document.createElement('iframe');frame.id='learning-frame';frame.title='Learning';frame.setAttribute('allow','');frame.style.border='0';
 let returnState=null,started=false,autoOpen=new URL(location.href).searchParams.get('panel')==='learning';
 function snapshot(){return {atelier:{...window.MobileAtelierState?.capture(),hairTrial:null},tab:tab==='learning'?'clothes':tab,category,hairSide,trial:PlayerEconomy.wish()?.id||null,view:mobileView,scroll:document.querySelector('#items').scrollTop,panX,panY};}
 function open(lessonId){if(tab!=='learning')returnState=snapshot();trialId=null;tab='learning';const wanted=typeof lessonId==='string'?lessonId:new URL(location.href).searchParams.get('lesson');if(!started||wanted&&frame.dataset.lesson!==wanted){const u=new URL('learn.html',document.baseURI);u.searchParams.set('embedded','1');if(wanted)u.searchParams.set('lesson',wanted);frame.dataset.lesson=wanted||'';frame.src=u.href;if(!started){started=true;host.append(frame);}}render();button.scrollIntoView({inline:'nearest',block:'nearest'});}
 function close(){const saved=returnState;tab=saved?.tab&&saved.tab!=='learning'?saved.tab:'clothes';if(saved){category=saved.category;hairSide=saved.hairSide;MobileAtelierState.restore(saved.atelier);}render();if(saved){mobileView=saved.view;focusRegion(saved.view||'full',true);panX=saved.panX||0;panY=saved.panY||0;applyPan();document.querySelector('#items').scrollTop=saved.scroll||0;const row=item(saved.trial);if(row&&tab==='clothes')tryOn(row);}returnState=null;}
 const previous=render;render=function(){previous();const active=tab==='learning';host.hidden=!active;app.classList.toggle('learning-open',active);button.classList.toggle('active',active);button.textContent=I18n.lang()==='en'?'Study':'学习';if(autoOpen&&catalog.length){autoOpen=false;open();}};
 const navigation=window.StudyNavigation;window.StudyNavigation={open(){if(window.WordrobeQA===true)return navigation.open();open();}};
 // Study requests from item previews keep the main game document and outfit alive.
 const previousTabs=tabs.onclick;tabs.onclick=e=>{const b=e.target.closest('[data-tab]');if(b?.dataset.tab==='learning'){open();return;}if(tab==='learning'&&b){close();if(b.dataset.tab==='clothes'&&tab==='clothes')return;}previousTabs(e);};
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;if(e.data?.type==='wordrobe:open-cards'){close();window.MobileCards?.open({seriesId:e.data.seriesId});}if(e.data?.type==='wordrobe:return-to-wardrobe')close();if(e.data?.type==='wordrobe:learning-reward'){document.querySelector('#wallet-balance').innerHTML=pointsUI(PlayerEconomy.balance());}});
 document.querySelector('.wordmark')?.addEventListener('click',e=>{if(tab!=='learning')return;e.preventDefault();close();});
 window.GameLearningPanel={open,close};if(catalog.length)render();
})();
