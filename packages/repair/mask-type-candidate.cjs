// Experimental typed-matte transport. Not wired into production/release builders.
const assert=require('assert');
function enrichMaskTypes(records,nativeNodes){
 const result=JSON.parse(JSON.stringify(records)),nodes=new Map(nativeNodes.map(n=>[n.id,n])),diagnostics=[];
 function walk(n){const source=nodes.get(n.id);
  if(source?.isMask===true){
   if(['ALPHA','LUMINANCE','VECTOR'].includes(source.maskType))n.aeuxMaskType=source.maskType;
   else diagnostics.push({id:n.id,issue:'mask type missing or unknown; legacy alpha retained'});
   if(source.maskType==='VECTOR')diagnostics.push({id:n.id,issue:'vector coverage semantics require native validation; legacy alpha retained'});
   // Experimental captured single-solid LUMA contract; not generalized to
   // gradient/image/multiple paints or source layer opacity.
   if(source.maskType==='LUMINANCE'&&source.opacity===1&&n.fill?.length===1&&n.fill[0].type==='fill'){
    const p=n.fill[0];if(Number.isFinite(p.opacity)&&Array.isArray(p.color))
     for(let k=0;k<3;k++)p.color[k]*=p.opacity/100;
   }
  }
  (n.layers||[]).forEach(walk);
 }
 result.forEach(walk);return {records:result,diagnostics};
}
function patchMaskTypes(source){
 function replaceOnce(before,after){assert.equal(source.split(before).length,2,'Unexpected mask host structure: '+before);source=source.replace(before,after);}
 replaceOnce('var maskLayer = {};','var maskLayer = {};\n    var aeuxMaskTypes = {};');
 replaceOnce('            maskLayer = {};','            maskLayer = {};\n            aeuxMaskTypes = {};');
 replaceOnce('            maskLayer[layerID] = null;','            maskLayer[layerID] = null;\n            aeuxMaskTypes[layerID] = null;');
 replaceOnce('currentLayer.trackMatteType = TrackMatteType.ALPHA;','currentLayer.trackMatteType = aeuxMaskTypes[layerID] === "LUMINANCE" ? TrackMatteType.LUMA : TrackMatteType.ALPHA;');
 replaceOnce("                    newMask(2).addProperty('ADBE Vector Graphic - Fill');","                    if (hostApp !== 'Figma' || aeuxMaskTypes[layerID] === 'VECTOR') newMask(2).addProperty('ADBE Vector Graphic - Fill');");
 // Removing the original invalidates the cached mask before subsequent siblings.
 replaceOnce('                    maskLayer[layerID].remove();','                    maskLayer[layerID].enabled = false;\n                    maskLayer[layerID].guideLayer = true;');
 replaceOnce('                newMask.effectsActive = false;','                newMask.effectsActive = false;\n                if (hostApp === \'Figma\') newMask.guideLayer = false;');
 replaceOnce('            r.collapseTransformation = layer.clipsContent !== true;','            r.collapseTransformation = layer.clipsContent !== true && !layer.aeuxCompositeScope;');
 replaceOnce('        if (layerData.hasClippingMask) {','        if (layerData.hasClippingMask) {\n            aeuxMaskTypes[layerID] = "ALPHA";');
 replaceOnce('        if (layerData.isMask) {','        if (layerData.isMask) {\n            aeuxMaskTypes[layerID] = layerData.aeuxMaskType || "ALPHA";');
 return source;
}
module.exports={enrichMaskTypes,patchMaskTypes};
