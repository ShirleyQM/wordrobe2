const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),J=require('../assets/learning/journey-engine.js');
const listeners={},elements={},storage=new Map();let lang='en',registrations=0;
for(const id of ['#content','#nav','#gloss','#gloss-content'])elements[id]={innerHTML:'',open:false,attrs:{},onclick(){},toggleAttribute(k,on){if(on)this.attrs[k]='';else delete this.attrs[k];},insertAdjacentHTML(_,html){this.innerHTML+=html;}};
const window={I18n:{lang:()=>lang,register(){registrations++;}},scrollY:0,scrollTo(){},addEventListener(name,fn){(listeners[name]??=[]).push(fn);}};
const ctx={window,I18n:window.I18n,JourneyEngine:J,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelectorAll:()=>[],addEventListener(){},body:{classList:{add(){},remove(){}}}},$:s=>elements[s],currentArticle:null,view:'words',state:{notebook:[{word:'coastal',meaning:'沿海的'}],history:[]},goalHTML:()=>'',esc:s=>String(s||''),reading(){},toast:e=>{throw Error(e);},requestAnimationFrame:fn=>fn(),setTimeout,clearTimeout,save(){},PlayerEconomy:{snapshot:()=>({credits:[]}),async grant(){throw Error('Language switch must not grant points');}},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(url.split('?')[0],'utf8'))})};
vm.createContext(ctx);const run=s=>vm.runInContext(s,ctx),html=()=>elements['#content'].innerHTML;
(async()=>{
 run(fs.readFileSync('assets/learning/journey.js','utf8'));await run('loadCourse()');run(fs.readFileSync('assets/learning/lesson-sections.js','utf8'));await run('home()');
 const toggle=async next=>{const before=run('JSON.stringify(journey)');lang=next;for(const fn of listeners['language-changed'])await fn();await new Promise(r=>setImmediate(r));assert.equal(run('JSON.stringify(journey)'),before,'language changed learning progress');};
 assert(html().includes('Start a lesson'));await toggle('zh');assert(html().includes('开始学习'));assert(!html().includes('Start a lesson'));assert('data-no-i18n' in elements['#content'].attrs);
 await toggle('en');assert(html().includes('Learning progress'));assert.equal(registrations,0,'renderers must not mutate shared translation dictionary');
 run('showProgress()');await toggle('zh');assert(html().includes('学过的内容'));assert(!html().includes('Your learning'));
 run('showWordbook()');await toggle('en');assert(html().includes('Wordbook'));assert(html().includes('沿海的'));
 run("articleSession(course[0]);lessonDirectory=true;renderJourney()");await toggle('zh');assert(html().includes('课程目录'));assert(!html().includes('Lesson contents'));
 run('lessonDirectory=false;selectLessonStep(0)');await toggle('en');assert(html().includes('Next'));assert(html().includes('scenario'));assert(html().includes('<summary>中文</summary>'));
 run("selectLessonStep(1);J.answer(journey,journey.session.questions[0].options.find(o=>o!==journey.session.questions[0].answer));renderJourney()");assert(html().includes('wrong-feedback'));await toggle('zh');assert(html().includes('option-translation'));await toggle('en');assert(!html().includes('option-translation'));assert(html().includes('wrong-feedback'));
 run("journey.session.done=true;journeyVisible=true;lessonDirectory=false;journey.session.phase='reading';renderJourney()");await toggle('zh');assert(html().includes('课程目录'));assert(html().includes('读懂言外之意'));await toggle('en');assert(html().includes('Read between the lines'));assert(html().includes('English')||html().includes('sea'));
 console.log('PASS: home, progress, wordbook, directory, word card, wrong-answer gloss and reading switch languages without changing progress or granting points.');
})().catch(e=>{console.error(e);process.exitCode=1;});
