'use strict';
// This file is loaded only by the standalone local QA page, before any player code.
if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Local QA only');
window.WordrobeQA=true;
window.WordrobeFeatures=Object.freeze({tailor:true});
(()=>{const prefix='tailor-qa-v2:',get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
Storage.prototype.getItem=function(k){return get.call(this,prefix+k);};
Storage.prototype.setItem=function(k,v){return set.call(this,prefix+k,v);};
Storage.prototype.removeItem=function(k){return remove.call(this,prefix+k);};
if(!localStorage.getItem('word-atelier-wallet-v1'))localStorage.setItem('word-atelier-wallet-v1',JSON.stringify({version:1,balance:240,owned:['feature:tailor'],credits:['user-test-credit-100-v1'],starterInitialized:false}));
localStorage.setItem('wardrobe-tour-v1','done');
})();
