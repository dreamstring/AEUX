// Experimental editable content precomps: mask the composite once, not each paint.
function normalizeMaskScopes(records){
 const result=JSON.parse(JSON.stringify(records)),diagnostics=[];let added=0;
 function visit(parent){
  for(const child of parent.layers||[])visit(child);
  if(!parent.layers?.some(n=>n.isMask))return;
  const frame=parent.frame;
  if(!frame||!Number.isFinite(frame.width)||!Number.isFinite(frame.height)){
   diagnostics.push({id:parent.id,issue:'mask scope lacks finite parent frame'});return;
  }
  const input=parent.layers,out=[];
  parent.aeuxCompositeScope=true;
  for(let i=0;i<input.length;i++){
   const mask=input[i];out.push(mask);
   if(!mask.isMask||mask.isVisible===false)continue;
   const contents=[];let next=i+1;
   while(next<input.length&&!input[next].isMask&&!input[next].shouldBreakMaskChain)contents.push(input[next++]);
   if(!contents.length)continue;
   const id=mask.id+':masked-content';
   out.push({id,name:mask.name+' / masked content',type:'Component',
    frame:{width:frame.width,height:frame.height,x:frame.width/2,y:frame.height/2},
    opacity:100,rotation:0,flip:[100,100],isVisible:true,isMask:false,shouldBreakMaskChain:false,
    blendMode:'BlendingMode.NORMAL',clipsContent:false,aeuxCompositeScope:true,aeuxScopeSourceParentId:parent.id,fill:[],stroke:[],layers:contents});
   added++;i=next-1;
  }
  parent.layers=out;
 }
 result.forEach(visit);
 if(result[0]?.type==='Artboard')result[0].layerCount+=added;
 return {records:result,diagnostics,addedScopes:added};
}
module.exports={normalizeMaskScopes};
