(function(root){
'use strict';
function create(s={}){return Object.assign({version:1,completed:{},attempts:{},sessions:{},session:null},s);}
function start(s,level){
 if(s.session&&s.session.level===level.id&&!s.session.done)return s.session;
 if(s.session){s.sessions=s.sessions||{};s.sessions[s.session.level]=s.session;}
 if(s.sessions&&s.sessions[level.id]&&!s.sessions[level.id].done)return s.session=s.sessions[level.id];
 const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 const plan=level.plan?level.plan.map(p=>({...p})):null;if(plan){const positions=plan.map((p,n)=>p.mixed?n:-1).filter(n=>n>=0),mixed=shuffle(positions.map(n=>plan[n]));positions.forEach((n,k)=>plan[n]=mixed[k]);}return s.session={level:level.id,index:0,phase:'card',wordIndex:0,step:0,plan,answers:[],hints:{},questions:level.questions.map(q=>Object.assign({},q,{options:shuffle(q.options)})),done:false};
}
function advance(s){const l=s.session;if(!l.plan||l.done)return false;const current=l.plan[l.step];if(current.phase==='quiz'&&!l.answers[l.index])return false;const next=l.plan[l.step+1];if(!next)return false;l.step++;Object.assign(l,next);return true;}
function answer(s,value){const l=s.session,q=l.questions[l.index];if(l.answers[l.index])return true;const ok=value===q.answer;if(ok)l.answers[l.index]={assisted:!!l.hints[l.index],answer:value};else {l.hints[l.index]=true;l.wrong=l.wrong||{};l.wrong[l.index]=value;}return ok;}
function reveal(s){const l=s.session;l.hints[l.index]=true;l.answers[l.index]={assisted:true,answer:l.questions[l.index].answer};}
function readingAnswer(s,index,value){const l=s.session,q=l.readingQuestions?.[index];if(!q||l.phase!=='reading')return false;l.readingAnswers=l.readingAnswers||{};if(l.readingAnswers[q.id])return true;if(value===q.answer){l.readingAnswers[q.id]={answer:value};return true;}l.readingWrong=l.readingWrong||{};l.readingWrong[q.id]=value;return false;}
function finish(s){const l=s.session;if(l.done)return false;if(l.plan&&l.phase!=='reading')throw Error('Read the article first.');if(l.answers.length!==l.questions.length||Array.from(l.answers).some(a=>!a))throw Error('Finish the practice first.');if(l.readingQuestions?.some(q=>!l.readingAnswers?.[q.id]))throw Error('Try the two reading checks first.');const first=!s.completed[l.level];s.completed[l.level]={at:new Date().toISOString(),assisted:l.answers.filter(a=>a.assisted).length,total:l.questions.length};s.attempts[l.level]=(s.attempts[l.level]||0)+1;l.done=true;l.phase='done';return first;}
function stages(l){const n=l.plan.filter(p=>p.phase==='card').length,words=l.answers.slice(0,n).filter(Boolean).length,practice=l.answers.slice(n).filter(Boolean).length;return [{id:'words',done:words,total:n,points:20},{id:'practice',done:practice,total:l.questions.length-n,points:20},{id:'reading',done:l.done?1:0,total:1,points:30}];}
const api={create,start,advance,answer,reveal,finish,stages,readingAnswer};if(typeof module!=='undefined')module.exports=api;else root.JourneyEngine=api;
})(typeof window!=='undefined'?window:null);
