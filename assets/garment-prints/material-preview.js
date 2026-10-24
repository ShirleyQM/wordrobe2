/* One active render and one latest pending color: dragging never builds a queue. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MaterialPreview=api;})(typeof window!=='undefined'?window:globalThis,function(){
 function latestQueue(run){let active=false,pending=null;function pump(){if(active||!pending)return;const job=pending;pending=null;active=true;Promise.resolve().then(()=>run(job.value)).then(job.resolve,job.reject).finally(()=>{active=false;pump();});}return value=>new Promise((resolve,reject)=>{if(pending)pending.resolve(null);pending={value,resolve,reject};pump();});}
 return {latestQueue};
});
