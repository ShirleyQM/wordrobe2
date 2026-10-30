'use strict';
(function(root){
 let data=null,pending=null;
 const lang=()=>root.I18n?.lang()==='en'?'en':'zh';
 function setData(value){
  if(!value||!Array.isArray(value.series)||!Array.isArray(value.cards)||!Array.isArray(value.pieces))throw Error('Invalid fashion series catalog');
  data=value;return data;
 }
 async function load(){
  if(data)return data;
  if(!pending)pending=root.fetch('assets/fashion-series/catalog.json?v=series-ready-20261030').then(r=>{if(!r.ok)throw Error('Series could not load');return r.json();}).then(setData).catch(error=>{pending=null;throw error;});
  return pending;
 }
 const series=id=>data?.series.find(s=>s.id===id)||null;
 const card=id=>data?.cards.find(c=>c.id===id)||null;
 const piece=id=>data?.pieces.find(p=>p.id===id)||null;
 const label=(row,language=lang())=>row?(language==='en'?row.nameEn||row.title:row.nameZh||row.titleZh)||'':'';
 function orderedSeries(rows=data?.series||[]){return [...rows].sort((a,b)=>(Number(!!b.lessonReady)-Number(!!a.lessonReady))||(Number(!!b.outfitArtReady)-Number(!!a.outfitArtReady))||(a.order-b.order)||a.id.localeCompare(b.id));}
 function forGarment(id,row={}){
  const ids=[id,row.baseId,row.printedFrom].filter(x=>typeof x==='string');
  const direct=[row.sourceCard,row.sourceCardId,row.cardId,row.fashionCardId,row.source?.cardId,...(Array.isArray(row.sourceCards)?row.sourceCards:[])].filter(x=>typeof x==='string'&&/^S\d{2}-F\d{2}$/.test(x));
  return (data?.cards||[]).filter(c=>direct.includes(c.id)||c.pieceIds.some(pieceId=>ids.includes(pieceId)));
 }
 function seriesForGarment(id){return (piece(id)?.seriesIds||[]).map(series).filter(Boolean);}
 function piecesForCard(id){return (card(id)?.pieceIds||[]).map(piece).filter(Boolean);}
 function forLesson(id){const m=/^y2k-l([1-6])$/.exec(id||'');return m?card('S04-F0'+Math.ceil(Number(m[1])/2)):null;}
 function mergeCards(original){
  const old=new Map((original.cards||[]).map(c=>[c.id,c]));
  const canonical=(data?.cards||[]).map(c=>{
   const previous=old.get(c.id)||{};
   return {...previous,...c,garments:previous.garments||[],legacy:false,description:'',descriptionZh:''};
  });
  const currentIds=new Set(canonical.map(c=>c.id));
  const legacy=(original.cards||[]).filter(c=>!currentIds.has(c.id)).map(c=>({...c,legacy:true,seriesId:c.lessonId?.match(/s(\d{2})$/)?.[1]?'S'+c.lessonId.match(/s(\d{2})$/)[1]:null}));
  return {...original,cards:[...canonical,...legacy]};
 }
 function readyCards(rows){return rows.filter(c=>!c.legacy&&(c.lessonReady||c.outfitArtReady));}
 const api={load,setData,series,card,piece,label,orderedSeries,forGarment,seriesForGarment,piecesForCard,forLesson,mergeCards,readyCards,getData:()=>data};
 root.FashionSeries=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
