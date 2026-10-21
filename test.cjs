const fs=require('fs');
const vm=require('vm');
const assert=require('assert/strict');
const elements=new Map();
function element(){return {textContent:'',innerHTML:'',hidden:false,checked:false,value:'',style:{},dataset:{},classList:{add(){},remove(){}},addEventListener(){},focus(){},querySelectorAll(){return []}};}
const document={querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},querySelectorAll(){return []},addEventListener(){},body:{style:{}}};
const storage=new Map();
const context=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>0,clearTimeout(){},console,Date,window:{confirm:()=>true,scrollTo(){}}});
const appSource=fs.readFileSync('gre-data.js','utf8')+'\n'+fs.readFileSync('assets/skirt-collection-v1/game-catalog.js','utf8')+'\n'+fs.readFileSync('app.js','utf8');
storage.set('word-atelier-demo-v1',JSON.stringify({version:1,points:37,owned:['t1','b1','u1','v1','s1','d2'],character:4,equipped:{top:'t1',bottom:'b1',bra:'u1',briefs:'v1',shoes:'s1'},looks:[],colors:{},completed:3,learnedCount:30,passedGates:0,learningVersion:2,vocabulary:'gre-sample-v1',studied:['insular']}));
vm.runInContext(appSource,context);
function run(code){return vm.runInContext(code,context);}
function fresh(){run('state=initial();lesson=null;');}
assert.equal(run('state.points'),37,'art migration preserves points');assert.equal(run('state.learnedCount'),30);assert.equal(run('gateDue()'),true,'migration preserves checkpoint');assert.equal(run('state.studied[0]'),'insular');assert.equal(run('state.character'),0);assert.equal(run('state.owned.includes("dress-02")'),true,'earned dress ownership migrated');
fresh();
run('equip("short-02")');assert.equal(run('state.equipped.bottom'),'long-01','locked items cannot be equipped');
run('equip("dress-01")');assert.equal(run('state.equipped.dress'),'dress-01');assert.equal(run('state.equipped.top'),undefined);assert.equal(run('state.equipped.bottom'),undefined);assert.equal(run('state.equipped.bra'),'campus-bra');assert.equal(run('state.equipped.briefs'),'campus-briefs');
assert.ok(run('figure().indexOf("wear-back.png")<figure().indexOf("body-shoes-on.png")'),'back collar behind body');assert.ok(run('figure().indexOf("wear-front.png")>figure().indexOf("body-shoes-on.png")'),'front dress above body');assert.ok(!run('figure().includes("items/dress-01/layer.png")'),'display art never used as worn art');
run('equip("campus-top")');assert.equal(run('state.equipped.dress'),undefined);assert.equal(run('state.equipped.bottom'),'long-01','split outfit restored');
run('state.points=10;pendingItem="short-02";buy()');assert.equal(run('state.points'),0);assert.equal(run('state.equipped.bottom'),'short-02');
run('pendingItem="short-02";buy()');assert.equal(run('state.points'),0,'duplicate purchase does not charge');
run('pendingItem="dress-02";buy()');assert.equal(run('state.owned.includes("dress-02")'),false,'cannot buy without funds');
run('saveLook();equip("long-01")');assert.equal(run('state.looks[0].equipped.bottom'),'short-02','saved outfits remain independent snapshots');
run('innerPreview=true;');assert.equal(run('figure()').includes('wear-front.png'),false);assert.equal(run('figure()').includes('master/body.png'),true);run('innerPreview=false');
function finish(errors=0){const n=run('lesson.questions.length');for(let i=0;i<n;i++){
 if(i<errors)run('recordAnswer(false,null)');
 run('recordAnswer(true,null);nextWord()');
}}
function viewCards(){const n=run('lesson.words.length');for(let i=0;i<n;i++)run('nextCard()');}
function normalGroup(){run('startLesson()');viewCards();run('startQuiz()');finish();}
fresh();run('startLesson()');assert.equal(run('lesson.phase'),'cards');assert.equal(run('lesson.words.length'),10);assert.equal(run('state.points'),0,'cards alone do not settle rewards');
assert.equal((elements.get('#modal-content').innerHTML.match(/<article/g)||[]).length,1,'only one card is visible');assert.ok(elements.get('#modal-content').innerHTML.includes('insular'));assert.ok(!elements.get('#modal-content').innerHTML.includes('numinous'));
run('nextWord()');assert.equal(run('lesson.phase'),'cards','cannot skip straight from cards');
run('startQuiz()');assert.equal(run('lesson.questions.length'),0,'summary required before quiz');run('nextCard()');assert.equal(run('lesson.cardIndex'),1);run('previousCard()');assert.equal(run('lesson.cardIndex'),0);
viewCards();assert.equal(run('lesson.phase'),'summary');assert.equal((elements.get('#modal-content').innerHTML.match(/<strong>/g)||[]).length,10,'summary shows all ten');run('reviewCards()');assert.equal(run('lesson.phase'),'cards');viewCards();
run('startQuiz()');assert.equal(run('lesson.questions.length'),5);assert.equal(run('new Set(lesson.questions.map(q=>q.word.word)).size'),5,'five distinct random words');assert.ok(run('lesson.questions.every(q=>lesson.words.includes(q.word)&&(["initial","spell"].includes(q.kind)||q.options.includes(q.answer)))'));assert.equal(run('lesson.questions.filter(q=>q.kind==="initial").length'),2);assert.ok(run('lesson.questions.some(q=>q.kind==="context"&&q.word.context)'),'PDF question included when source is in learned group');
finish();assert.equal(run('state.points'),10);assert.equal(run('state.learnedCount'),10);run('settleLesson()');assert.equal(run('state.points'),10,'settlement idempotent');
normalGroup();assert.equal(run('state.points'),20,'next group earns immediately without cooldown');
normalGroup();assert.equal(run('state.points'),30);assert.equal(run('state.learnedCount'),30);assert.equal(run('gateDue()'),true);
run('lesson=null;startLesson()');assert.equal(run('lesson'),null,'pending checkpoint blocks normal lessons');assert.ok(elements.get('#modal-content').innerHTML.includes('进阶挑战'));
const reloaded=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>0,clearTimeout(){},console,Date,window:{confirm:()=>true,scrollTo(){}}});vm.runInContext(appSource,reloaded);assert.equal(vm.runInContext('gateDue()',reloaded),true,'refresh cannot bypass gate');
run('startCheckpoint()');assert.equal(run('lesson.questions.length'),10);assert.equal(run('lesson.questions.filter(q=>q.kind==="spell").length'),3);assert.ok(run('lesson.questions.every(q=>words.slice(0,30).includes(q.word))'),'checkpoint samples recent 30 words');
finish(3);assert.equal(run('lesson.passed'),false);assert.equal(run('gateDue()'),true);assert.equal(run('state.points'),30,'failed checkpoint does not remove or add points');
run('startLesson()');assert.equal(run('lesson'),null,'failed gate remains mandatory');
run('startCheckpoint()');finish(2);assert.equal(run('lesson.passed'),true);assert.equal(run('gateDue()'),false);assert.equal(run('state.points'),30,'checkpoint does not duplicate group reward');
normalGroup();assert.equal(run('state.points'),40);assert.equal(run('state.learnedCount'),40);
normalGroup();normalGroup();assert.equal(run('state.learnedCount'),60);assert.equal(run('gateDue()'),true,'checkpoint repeats at 60 words');
run('startCheckpoint()');assert.ok(run('lesson.questions.every(q=>sliceWords(30,30).includes(q.word))'),'next checkpoint samples current vocabulary cycle');finish();normalGroup();assert.equal(run('state.points'),70,'vocabulary cycles with no daily lock');
fresh();run('startLesson();startQuiz();closeModal()');assert.equal(run('state.points'),0,'abandoned group never earns points');
fresh();run('state.learnedCount=25;startLesson()');assert.equal(run('lesson.words.length'),5,'progress stops exactly at next 30-word gate');viewCards();run('startQuiz()');finish();assert.equal(run('state.learnedCount'),30);assert.equal(run('gateDue()'),true);
run('startCheckpoint();lesson.index=lesson.questions.findIndex(q=>q.kind==="spell");');elements.set('#spell-answer',element());elements.get('#spell-answer').value=run('lesson.questions[lesson.index].answer.toUpperCase()');run('submitSpelling()');assert.equal(run('lesson.correct'),true,'spelling accepts case differences');
fresh();run('startLesson()');viewCards();run('startQuiz();lesson.index=lesson.questions.findIndex(q=>q.kind==="initial");');elements.get('#spell-answer').value='';run('submitSpelling()');assert.equal(run('lesson.correct'),false,'empty input cannot pass');elements.get('#spell-answer').value=run('lesson.questions[lesson.index].answer.slice(1).toUpperCase()');run('submitSpelling()');assert.equal(run('lesson.correct'),true,'initial fill accepts suffix alone');
assert.equal(run('words.length'),30);assert.ok(run('words.every(w=>w.source.row>0&&w.sourceDefinition&&w.initialStem.includes("_____"))'),'all GRE samples retain spreadsheet provenance and usable initial prompts');assert.equal(run('words.filter(w=>w.context).length'),5);assert.ok(run('words.filter(w=>w.context).every(w=>w.context.options.includes(w.word)&&w.context.answer===w.word)'),'original questions match stored answers');
assert.ok(storage.get('word-atelier-demo-v1'),'progress persisted');
console.log('PASS: equipment, GRE provenance, one-card learning, summary gate, mixed random quiz, PDF questions, initial-letter filling, immediate 10-point settlement, continuous groups, 30/60-word checkpoints, persistence, retry, spelling and vocabulary cycling');
