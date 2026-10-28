const assert=require('node:assert/strict'),J=require('../assets/learning/journey-engine.js'),data=require('../assets/learning/article-lessons.json');
for(const level of data.levels){
 const state=J.create(),s=J.start(state,level);s.readingQuestions=level.readingQuestions;s.readingAnswers={};
 for(const p of s.plan){Object.assign(s,p);if(p.phase==='quiz')assert.equal(J.answer(state,s.questions[p.index].answer),true);}
 assert.deepEqual(J.stages(s).map(p=>p.done),[6,6,0]);
 assert.throws(()=>J.finish(state),/reading checks/);
 const first=s.readingQuestions[0];assert.equal(J.readingAnswer(state,0,first.options.find(o=>o!==first.answer)),false);
 assert.equal(s.readingAnswers[first.id],undefined);assert.ok(s.readingWrong[first.id]);
 assert.equal(J.readingAnswer(state,0,first.answer),true);
 const saved=J.create(JSON.parse(JSON.stringify(state)));assert.equal(J.start(saved,level).readingAnswers[first.id].answer,first.answer);
 assert.throws(()=>J.finish(saved),/reading checks/);
 J.readingAnswer(saved,1,level.readingQuestions[1].answer);
 assert.equal(J.finish(saved),true);assert.equal(J.finish(saved),false);assert.deepEqual(J.stages(saved.session).map(p=>p.done),[6,6,1]);
 assert.equal(saved.attempts[level.id],1);
 assert.equal(level.words.length,6);assert.equal(level.questions.length,12);
 for(const w of level.words){assert.equal(w.examples.length,3);assert.ok(w.phrases.length>=2);}
 for(const q of [...level.questions,...level.readingQuestions])assert.equal(q.options.filter(o=>o===q.answer).length,1);
}
// Previous sessions without reading checks remain loadable and retain completion.
const old=J.create({session:{level:'old',phase:'reading',questions:[],answers:[],plan:[{phase:'reading'}]}});assert.equal(J.finish(old),true);
console.log('PASS: both lessons, 36 examples, reading gates, wrong-answer retry, resume, one-time completion, legacy sessions.');
