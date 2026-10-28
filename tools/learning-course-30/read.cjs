const fs=require('fs'),path=require('path');
module.exports=function readCourse(root=process.cwd()){
 const base=path.join(root,'assets/learning'),main=JSON.parse(fs.readFileSync(path.join(base,'article-lessons.json')));
 const levels=[...main.levels,...(main.packs||[]).flatMap(p=>JSON.parse(fs.readFileSync(path.join(base,p))).levels)].sort((a,b)=>a.number-b.number);
 if(main.totalLessons&&levels.length!==main.totalLessons)throw Error('Incomplete course');
 return {...main,levels,packs:[]};
};
