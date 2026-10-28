const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const batches=['03-09','10-16','17-23','24-30'].map(name=>({name,lessons:require('./'+name+'.cjs')}));
const firstPrompts=new Map(require('./first-prompts.cjs').trim().split(/\r?\n/).map(line=>{const [word,text]=line.split('|'),pair=text.split('~');assert.equal(pair.length,2,word+' first prompt translation');return [word,{en:pair[0],zh:pair[1]}];}));assert.equal(firstPrompts.size,168);
const baseFile='assets/learning/article-lessons.json',base=JSON.parse(fs.readFileSync(baseFile));
// Preserve both published IDs and their content, rather than replacing saved lessons.
base.levels=base.levels.filter(l=>['article-pilot-01','article-pilot-02'].includes(l.id));assert.equal(base.levels.length,2);
const extras={conceal:['to hide something or prevent it from being known','隐藏；隐瞒'],resources:['useful things available for a purpose','资源'],artifacts:['objects made or changed by people','人工制品；人工遗存'],identical:['exactly the same','完全相同的'],exclusive:['limited to a particular group and excluding others','排他的；仅限特定群体的'],central:['at the center or most important to an issue','中心的；核心的'],impulsive:['acting suddenly without careful thought','冲动的'],criterion:['a standard used to judge something','标准；准则'],rigid:['not flexible or open to change','僵硬的；不灵活的'],anticipated:['expected or prepared for beforehand','已预期的'],reconstruction:['an account or model built again from evidence','重建；根据证据还原的事物'],fragmented:['broken or divided into smaller pieces','破碎的；分裂的'],rigidity:['an inability to bend or adapt easily','僵硬；缺乏灵活性'],suggestion:['an idea offered for others to consider','建议'],deliberate:['done on purpose after consideration','有意的；经过考虑的'],consensus:['general agreement within a group','共识'],definitive:['considered final or settling a question','最终的；决定性的'],eliminate:['to remove something completely','完全消除'],compete:['to try to succeed against others seeking the same goal','竞争'],arbitrary:['based on a personal choice rather than a clear relevant rule','任意的；缺乏依据的'],promote:['to encourage or support the growth or acceptance of something','促进；推广'],assume:['to accept something as true without first checking it','假定'],appealing:['attractive or interesting','吸引人的']};
const lexicon=new Map(Object.entries(extras).map(([word,[definition,meaning]])=>[word,{word,definition,meaning}]));
for(const l of base.levels)for(const w of l.words)lexicon.set(w.word,w);
const parsed=[];
for(const batch of batches)for(const l of batch.lessons){
 const words=l.words.trim().split(/\r?\n/).map(line=>{const x=line.split('|');assert.equal(x.length,10,`${l.n}: ${x[0]} fields ${x.length}`);const [word,pos,definition,meaning,phrases,...rest]=x;const pair=s=>{const a=s.split('~');assert.equal(a.length,2,word+' bilingual pair');return {en:a[0],zh:a[1]};};const w={word,pos,definition,meaning,phrases:phrases.split(' / '),examples:rest.slice(0,3).map(pair),mixed:pair(rest[3]),distractors:rest[4].split(',')};assert(!lexicon.has(word),'Duplicate target: '+word);lexicon.set(word,w);return w;});
 assert.equal(words.length,6,'Six words: '+l.n);parsed.push({batch:batch.name,...l,words});
}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const gloss=word=>{const w=lexicon.get(word);assert(w,'Missing distractor gloss: '+word);return {en:w.definition,zh:w.meaning};};
const levels=parsed.map(l=>{
 const id='article-course-'+String(l.n).padStart(2,'0');
 const words=l.words.map(w=>{
  const re=new RegExp('\\b'+escape(w.word)+'\\b','i'),ex=w.examples[2];assert(re.test(ex.en),`${w.word}: third example needs an uninflected target`);
  assert.equal(w.distractors.length,3);assert.equal(new Set([w.word,...w.distractors]).size,4,w.word+' duplicate options');
  const make=(suffix,prompt,translation,options,type)=>({id:id+'-'+w.word+'-'+suffix,type,prompt,translation,options,answer:w.word,explanation:`Here, “${w.word}” means ${w.definition}.`,optionGlosses:Object.fromEntries(options.map(o=>[o,gloss(o)])),revision:2});
  const first=firstPrompts.get(w.word);assert(first,w.word+' missing first prompt');assert(first.en.includes('_____'),w.word+' first blank');
  const questions=[make('first',first.en,first.zh,[w.word,...w.distractors.slice(0,2)],'context'),make('mixed',w.mixed.en,w.mixed.zh,[w.word,...w.distractors],'scenario')];assert(w.mixed.en.includes('_____'),w.word+' mixed blank');
  return {word:w.word,pos:w.pos,definition:w.definition,meaning:w.meaning,phrases:w.phrases,examples:w.examples,questions};
 });
 const questions=[...words.map(w=>w.questions[0]),...words.map(w=>w.questions[1])],plan=[];
 words.forEach((w,index)=>plan.push({phase:'card',wordIndex:index},{phase:'quiz',index,wordIndex:index}));words.forEach((w,index)=>plan.push({phase:'quiz',index:6+index,mixed:true,wordIndex:index}));plan.push({phase:'reading'});
 const paragraphs=l.article.map(([en,zh])=>({en,zh}));for(const w of words)assert(new RegExp('\\b'+escape(w.word)+'\\b','i').test(paragraphs.map(p=>p.en).join(' ')),`${l.n}: article missing ${w.word}`);
 return {id,number:l.n,title:l.title,word:words.map(w=>w.word).join(' · '),description:'Six words, two kinds of practice, and one complete reading.',article:{title:l.title,kind:'original',publisher:'Wordrobe',adapted:false,paragraphs},words,questions,plan,readingQuestions:l.reading.map(([prompt,translation,options,answer,explanation,explanationZh],i)=>({id:id+'-reading-'+(i+1),prompt,translation,options,answer:options[answer],explanation,explanationZh}))};
});
const packs=batches.map(batch=>{const name='article-lessons-'+batch.name+'.json',items=levels.filter(l=>l.number>=batch.lessons[0].n&&l.number<=batch.lessons.at(-1).n);fs.writeFileSync(path.join('assets/learning',name),JSON.stringify({version:1,levels:items})+'\n');return name;});
base.version=2;base.totalLessons=30;base.packs=packs;base.description='30 six-word lessons. The first two readings adapt credited NASA reports; lessons 3–30 are original educational scenarios written for Wordrobe, with context questions and reading checks.';
fs.writeFileSync(baseFile,JSON.stringify(base,null,2)+'\n');
fs.writeFileSync('assets/learning/course-30-summary.json',JSON.stringify({version:1,lessons:30,words:180,wordQuestions:360,readingQuestions:60,pointsPerLesson:70,levels:[...base.levels,...levels].map(l=>({id:l.id,number:l.number,title:l.title,words:l.words.map(w=>w.word)}))},null,2)+'\n');
console.log(JSON.stringify({lessons:base.levels.length+levels.length,targetWords:lexicon.size-Object.keys(extras).length,packs:packs.map(p=>({path:p,bytes:fs.statSync('assets/learning/'+p).size}))}));
