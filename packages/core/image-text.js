// Source selection and metadata only; no host APIs or file writes.
function aeuxImageTextPlan(node) {
  if (!node || node.type !== 'TEXT' || /^\*/.test(node.name || '')) return null;
  var fills=(node.fills||[]).filter(function(p){return p.visible!==false;});
  if (fills.length!==1 || fills[0].type!=='IMAGE' || !fills[0].imageHash) return null;
  if (!['TILE','FILL','FIT','CROP'].includes(fills[0].scaleMode)) return null;
  if ((node.strokes||[]).some(function(p){return p.visible!==false;}) ||
      (node.effects||[]).some(function(e){return e.visible!==false;})) return null;
  if(typeof node.fontSize!=='number'||!node.fontName||typeof node.fontName!=='object')return null;
  var runs=node.aeuxTextStyleRuns||(typeof node.getStyledTextSegments==='function'?node.getStyledTextSegments(['fontName','fontSize','fills','letterSpacing','lineHeight']):null);
  if(runs && runs.length>1) return null;
  return {contract:'image-text-v1',assetName:'AEUX_ImageText_'+node.id.replace(/:/g,'-'),
    scaleMode:fills[0].scaleMode,paint:JSON.parse(JSON.stringify(fills[0]))};
}
function aeuxPrepareImageTextScene(scene) {
  var result=JSON.parse(JSON.stringify(scene));
  function visit(node){
    var plan=aeuxImageTextPlan(node);
    if(plan && node.aeuxRasterExport && node.aeuxRasterExport.imageTextPlane===true){
      node.aeuxImageText=plan;
      node.rasterize=false;delete node.aeuxRasterReason;
      node.fills=[{type:'SOLID',visible:true,opacity:1,color:{r:1,g:1,b:1},blendMode:'NORMAL'}];
      for(var i=0;i<(node.aeuxTextStyleRuns||[]).length;i++)node.aeuxTextStyleRuns[i].fills=node.fills;
    }
    (node.children||[]).forEach(visit);
  }
  visit(result);return result;
}
if(typeof module!=='undefined')module.exports={aeuxImageTextPlan,aeuxPrepareImageTextScene};
