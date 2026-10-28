const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),read=require('./read.cjs'),J=require('../../assets/learning/journey-engine.js');
const data=read(),levels=data.levels,escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),ids=new Set(),targets=new Set(),prompts=new Set();let examples=0;
assert.equal(levels.length,30);assert.equal(data.packs.length,0);
for(const [i,l]of levels.entries()){
 assert.equal(l.number,i+1);assert(!ids.has(l.id));ids.add(l.id);assert.equal(l.words.length,6);assert.equal(l.questions.length,12);assert.equal(l.readingQuestions.length,2);assert.equal(l.plan.length,19);
 const article=l.article.paragraphs.map(p=>p.en).join(' ');assert(article.split(/\s+/).length>=100,l.id+' short reading');
 for(const p of l.article.paragraphs){assert(p.en&&p.zh);assert(!/[\u3400-\u9fff]/.test(p.en));}
 if(i>=2){assert.equal(l.article.kind,'original');assert(!l.article.url);}
 for(const w of l.words){assert(!targets.has(w.word),'Duplicate target '+w.word);targets.add(w.word);assert(w.definition&&w.meaning);assert(w.phrases.length>=2);assert.equal(w.examples.length,3);assert.equal(new Set(w.examples.map(e=>e.en)).size,3);examples+=w.examples.length;assert.equal(w.questions.length,2);assert(new RegExp('\\b'+escape(w.word)+'\\b','i').test(article),l.id+' article missing '+w.word);for(const e of w.examples)assert(e.en&&e.zh);}
 for(const [qIndex,q]of l.questions.entries()){
  assert(!ids.has(q.id),'Duplicate question ID');ids.add(q.id);assert(!prompts.has(q.prompt),'Repeated prompt '+q.id);prompts.add(q.prompt);assert(q.prompt&&q.translation&&q.explanation);assert(!/[\u3400-\u9fff]/.test(q.prompt));assert.equal(q.options.length,qIndex<6?3:4);assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(o=>o===q.answer).length,1);for(const o of q.options)assert(q.optionGlosses[o]?.en&&q.optionGlosses[o]?.zh,q.id+' missing gloss');
 }
 for(const q of l.readingQuestions){assert(!ids.has(q.id));ids.add(q.id);assert(q.translation&&q.explanation&&q.explanationZh);assert.equal(new Set(q.options).size,q.options.length);assert.equal(q.options.filter(o=>o===q.answer).length,1);}
}
assert.equal(targets.size,180);assert.equal(examples,540);

// Walk the actual UI controller through all 30 lessons, with persistent progress and wallet IDs.
const content={innerHTML:'',onclick(){}},nav={},wallet={balance:0,credits:[]};let persisted;
const context={JourneyEngine:J,J,journey:J.create(),course:levels,setTimeout,clearTimeout,Math,requestAnimationFrame:f=>f(),window:{scrollY:0,scrollTo(){},addEventListener(){}},document:{addEventListener(){},body:{classList:{add(){},remove(){}}}},$:s=>s==='#content'?content:s==='#nav'?nav:null,home:async()=>{},showProgress(){},renderJourney(){},journeyVisible:false,loadCourse:async()=>levels,persistJourney(){persisted=JSON.stringify(context.journey);},tr:en=>en,esc:s=>String(s||''),wordContent:w=>w.word,articleContent:l=>l.article.title,revealChinese:zh=>'<details><summary>中文</summary>'+zh+'</details>',optionMeaning:g=>g?.en||'',save(){},toast:msg=>{throw Error(msg);},PlayerEconomy:{snapshot:()=>wallet,async grant(id,points){if(!wallet.credits.includes(id)){wallet.credits.push(id);wallet.balance+=points;}}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/learning/lesson-sections.js','utf8'),context);const click=dataset=>content.onclick({target:{closest:()=>({dataset})}});
(async()=>{
 for(const [number,l]of levels.entries()){
  const before=wallet.balance;await click({level:l.id});assert(content.innerHTML.includes('Lesson contents'));await click({step:'0'});
  for(let n=0;n<6;n++){assert(content.innerHTML.includes(l.words[n].word));await click({section:'try'});const s=context.journey.session;assert.equal(s.index,n);await click({choice:s.questions[n].answer});assert(!content.innerHTML.includes('class="explanation"'));if(n===2){context.journey=J.create(JSON.parse(persisted));assert.equal(context.journey.session.index,2);assert(context.journey.session.answers[2]);}await click({section:'next'});}
  assert.equal(wallet.balance,before+20);
  const mixed=[];for(let n=0;n<6;n++){const s=context.journey.session;mixed.push(s.index);if(n===0){await click({choice:s.questions[s.index].options.find(o=>o!==s.questions[s.index].answer)});assert(content.innerHTML.includes('wrong-feedback'));}await click({choice:s.questions[s.index].answer});if(n>0)assert(!content.innerHTML.includes('class="explanation"'));await click({section:'next'});}
  assert.equal(new Set(mixed).size,6);assert.equal(wallet.balance,before+40);assert.equal(context.journey.session.phase,'reading');assert(content.innerHTML.includes('data-section="read" disabled'));
  for(let n=0;n<2;n++){const q=context.journey.session.readingQuestions[n];if(n===0){await click({readQuestion:String(n),readChoice:q.options.find(o=>o!==q.answer)});assert(content.innerHTML.includes('class="explanation"'));}await click({readQuestion:String(n),readChoice:q.answer});}
  await click({section:'read'});assert.equal(wallet.balance,before+70);assert(content.innerHTML.includes('LESSON COMPLETE'));assert(context.journey.completed[l.id]);
  await click({level:l.id});await click({stage:'2'});await click({section:'read'});assert.equal(wallet.balance,before+70);
 }
 assert.equal(wallet.balance,2100);assert.equal(wallet.credits.length,90);assert.equal(Object.keys(context.journey.completed).length,30);
 await click({journey:'continue'});assert(content.innerHTML.includes('Lesson contents'));assert(context.journey.session.done);assert.equal(wallet.balance,2100);
 // Test the real browser loader, including concurrent calls and all four JSON packs.
 const requests=[],homeContent={innerHTML:'',onclick(){}};const loader={JourneyEngine:J,localStorage:{getItem:()=>null,setItem(){}},window:{addEventListener(){}},document:{querySelectorAll:()=>[]},$:s=>s==='#content'?homeContent:s==='#nav'?{}:null,home(){},renderJourney(){},currentArticle:null,view:'words',state:{notebook:[],history:[]},goalHTML:()=>'',esc:s=>String(s||''),reading(){},toast(){},fetch:async url=>{requests.push(url);const file=url.split('?')[0];return {ok:true,json:async()=>JSON.parse(fs.readFileSync(file))};}};vm.createContext(loader);vm.runInContext(fs.readFileSync('assets/learning/journey.js','utf8'),loader);const [a,b]=await Promise.all([vm.runInContext('loadCourse()',loader),vm.runInContext('loadCourse()',loader)]);assert.equal(a,b);assert.equal(a.filter(l=>l.words).length,30);assert.equal(requests.length,6);const articleHTML=vm.runInContext('articleContent(course.find(l=>l.number===30&&l.words))',loader);assert(!articleHTML.includes('href="undefined"'));assert(!articleHTML.includes('href=""'));assert(articleHTML.includes('原创短文'));
 const summary={lessons:30,words:targets.size,examples,wordQuestions:360,readingChecks:60,lessonCompletionsTested:30,totalPoints:wallet.balance,duplicateRewards:0,loaderRequests:requests.length,offlineFlattenedLessons:data.levels.length};fs.mkdirSync('outputs/learning-course-30',{recursive:true});fs.writeFileSync('outputs/learning-course-30/validation.json',JSON.stringify(summary,null,2));console.log('PASS '+JSON.stringify(summary));
})().catch(e=>{console.error(e);process.exitCode=1;});
