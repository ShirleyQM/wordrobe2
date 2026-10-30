const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const C=require('./core.js');const D=JSON.parse(fs.readFileSync(path.join(__dirname,'chapter.json')));
let s=C.clean({});assert.equal(C.unlocked(s,0),true);assert.equal(C.unlocked(s,1),false);assert.throws(()=>C.finish(s,1,6));
let r=C.finish(s,0,3);s=r.state;assert.equal(r.passed,false);assert.equal(C.stats(s).xp,30);assert.equal(C.unlocked(s,1),false);
r=C.finish(s,0,4);s=r.state;assert.equal(r.xpGain,10);assert.equal(C.unlocked(s,1),true);assert.equal(C.stats(s).stars,1);
r=C.finish(s,0,6);s=r.state;assert.equal(r.xpGain,20);assert.equal(C.stats(s).stars,3);assert.equal(C.finish(s,0,6).xpGain,0);assert.equal(C.finish(s,0,1).state.best[0],6);
r=C.finish(s,1,4);s=r.state;assert.equal(r.newCard,true);assert.equal(C.finish(s,1,6).newCard,false);
for(let i=0;i<6;i++)s=C.finish(s,i,6).state;
assert.deepEqual(C.stats(s),{xp:360,stars:18,passed:6,cards:[1,3,5]});assert.equal(C.finish(s,5,6).xpGain,0);
assert.deepEqual(C.clean({best:[99,-3,2.5,'6',NaN]}).best,[6,0,0,0,0,0]);
assert.equal(D.words.length,24);assert.equal(D.texts.length,4);assert.equal(D.levels.length,6);assert.equal(D.cards.length,3);assert.equal(new Set(D.words.map(w=>w.id)).size,24);
const qs=D.levels.flatMap(l=>l.questions);assert.equal(qs.length,36);assert.equal(new Set(qs.map(q=>q.id)).size,36);const covered=new Set(qs.flatMap(q=>q.word_ids));assert.equal(covered.size,24);
for(const l of D.levels){assert.equal(l.questions.length,6);assert.ok(!l.text_id||D.texts.some(t=>t.id===l.text_id));for(const q of l.questions){assert.ok(q.explanation&&q.evidence);for(const id of q.word_ids)assert.ok(D.words.some(w=>w.id===id));if(q.type!=='spelling'){assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.options.includes(q.answer));}if(q.type==='reading'){assert.ok(q.evidence.startsWith(l.text_id));}}}
let minimum=C.clean({});for(let i=0;i<6;i++)minimum=C.finish(minimum,i,4).state;assert.equal(C.stats(minimum).xp,240);assert.equal(C.stats(minimum).cards.length,3);
console.log('PASS: lock order, failure/retry, XP delta, no repeated reward, caps, 24-word coverage, 36 questions and reading evidence.');
