'use strict';
window.ToolStorage=(function(){
 var memory={},nativeStore=null,version=0,chain=Promise.resolve(),ready;
 function legacyRead(key){try{return window.localStorage.getItem(key);}catch(e){return null;}}
 function notice(){window.dispatchEvent(new CustomEvent('tool-storage-error'));}
 async function init(){var x=window.xhs,mini=x&&x.miniTool,options=x&&x.launchOptions;if((!options||!options.miniToolEnv)&&mini&&typeof mini.getLaunchOptions==='function'){try{options=await mini.getLaunchOptions();}catch(e){}}
 version=Math.floor(Number(options&&options.miniToolEnv&&options.miniToolEnv.buildVersion||0)/1000);
 if(version>=9460&&mini&&typeof mini.getStorage==='function'&&typeof mini.setStorage==='function'){nativeStore=mini;try{var result=await mini.getStorage({key:'dressup-player-v1'});if(result&&result.data)memory=JSON.parse(result.data)||{};}catch(e){memory={};}}
 else{try{memory=JSON.parse(legacyRead('dressup-player-v1')||'{}')||{};}catch(e){memory={};}}
 var height=function(){document.documentElement.style.setProperty('--app-height',window.innerHeight+'px');};height();window.addEventListener('resize',height);
 if(version>=9490&&mini&&typeof mini.getWindowInfo==='function'){async function windowInfo(){try{var info=await mini.getWindowInfo();if(info.windowHeight)document.documentElement.style.setProperty('--app-height',info.windowHeight+'px');if(info.safeArea){document.documentElement.style.setProperty('--safe-area-inset-top',Math.max.apply(Math,[0,info.safeArea.top].concat(Object.values(info.menuButtons||{}).filter(function(r){return r;}).map(function(r){return r.bottom;})))+'px');document.documentElement.style.setProperty('--safe-area-inset-bottom',Math.max(0,info.windowHeight-info.safeArea.bottom)+'px');}}catch(e){}}await windowInfo();window.addEventListener('resize',windowInfo);}
 }
 ready=init();
 return {ready:ready,getItem:function(key){return memory[key]===undefined?null:memory[key];},setItem:function(key,value){memory[key]=String(value);var serialized=JSON.stringify(memory);chain=chain.then(async function(){if(nativeStore){try{await nativeStore.setStorage({key:'dressup-player-v1',data:serialized});return true;}catch(e){notice();return false;}}try{window.localStorage.setItem('dressup-player-v1',serialized);return true;}catch(e){notice();return false;}});return chain;}};
})();
