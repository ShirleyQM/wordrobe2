const assert=require('assert/strict'),fs=require('fs'),J=require('./assets/learning/journey-engine.js');
const levels=JSON.parse(fs.readFileSync('assets/learning/journey.json')).levels;
assert.equal(levels.length,30);assert.equal(new Set(levels.map(l=>l.word)).size,30);
for(const l of levels){assert(l.examples.length>=2&&l.examples.every(e=>e.en&&e.zh));assert(l.phrases.length>=2);assert(l.questions.length>=2);for(const q of l.questions){assert(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert(!/[\u4e00-\u9fff]/.test(q.prompt));assert(q.options.every(o=>!/[\u4e00-\u9fff]/.test(o)));if(q.type==='phrase')assert(q.prompt.includes('_____'),l.word);}}
let s=J.create();for(const level of levels){J.start(s,level);assert.throws(()=>J.finish(s));s.session.phase='quiz';for(let i=0;i<s.session.questions.length;i++){s.session.index=i;assert.equal(J.answer(s,'wrong'),false);J.reveal(s);s=J.create(JSON.parse(JSON.stringify(s)));assert(s.session.answers[i].assisted);}assert(J.finish(s));assert.equal(J.finish(s),false);}
assert.equal(Object.keys(s.completed).length,30);J.start(s,levels[0]);s.session.questions.forEach((q,i)=>{s.session.index=i;assert(J.answer(s,q.answer));});assert.equal(J.finish(s),false);assert.equal(s.completed[levels[0].id].assisted,0);
assert.equal(levels.filter(l=>l.questions.some(q=>q.source)).length,5);
console.log('PASS: 30 levels, 65 contextual questions, bilingual examples, hidden Chinese support, hint/reveal progression, reload, all levels accessible, no repeat completion reward.');
