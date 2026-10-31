// Experimental, source-gated contract. Not part of the published builders.
const assert=require('assert');
const {padMaskComposites}=require('./mask-padding-candidate.cjs');
function enrichNativeShadowSpread(records,scene){
 const result=JSON.parse(JSON.stringify(records)),byId=new Map();
 (function walk(n){byId.set(n.id,n);(n.children||[]).forEach(walk);})(scene);
 function visit(n){const source=byId.get(n.id),effects=source?.effects?.filter(e=>e.type==='DROP_SHADOW'&&e.visible!==false);
  // Only an unambiguous single native effect; never infer zero from omitted spread.
  if(n.shadow?.length===1&&effects?.length===1&&Number.isFinite(effects[0].spread))
   n.shadow[0].spread=effects[0].spread;
  (n.layers||[]).forEach(visit);
 }
 result.forEach(visit);return result;
}
function prepareShadowCasters(records){
 const copy=JSON.parse(JSON.stringify(records)),diagnostics=[];let added=0;
 if(copy[0]?.type!=='Artboard'||copy[0]?.hostApp!=='Figma')
  return{records:copy,addedCasters:0,diagnostics:[{issue:'shadow caster source contract requires a Figma Artboard; unchanged'}]};
 function visit(list){return list.flatMap(n=>{
  if(n.layers)n.layers=visit(n.layers);
  if(!n.shadow?.length)return[n];
  const p=n.fill?.[0],s=n.shadow[0];
  // Radius250 native acceptance currently covers only a plain rectangle.
  const maxRadius=n.type==='Rect'&&n.roundness===0?250:128;
  const w=n.frame?.width,h=n.frame?.height;
  const corners=n.path?.points;
  const rectangularPath=Array.isArray(corners)&&corners.length===4&&
   [[0,0],[w,0],[w,h],[0,h]].every(point=>corners.some(q=>q[0]===point[0]&&q[1]===point[1]))&&
   n.path.closed===true&&['inTangents','outTangents'].every(k=>!n.path[k]?.some(q=>q[0]!==0||q[1]!==0));
  const spreadQualified=n.type==='Rect'&&n.roundness===0&&n.rotation===0&&!n.flip?.some(v=>v!==100)&&
   s.blur===32&&(s.spread===8||s.spread===-8)&&w+2*s.spread>0&&h+2*s.spread>0&&rectangularPath;
  const qualified=['Rect','Path','Ellipse'].includes(n.type)&&n.opacity===100&&!n.isMask&&
   n.blendMode==='BlendingMode.NORMAL'&&n.fill?.length===1&&p.type==='fill'&&p.enabled!==false&&p.blendMode===1&&
   Number.isFinite(p.opacity)&&p.opacity>0&&p.opacity<=100&&!n.stroke?.length&&!n.innerShadow?.length&&!n.blur&&
   n.shadow.length===1&&Number.isFinite(s.blur)&&s.blur>=0&&s.blur<=maxRadius&&(s.spread===0||spreadQualified)&&
   Array.isArray(s.position)&&s.position.length===2&&s.position.every(Number.isFinite)&&
   Array.isArray(s.color)&&s.color.length===4&&s.color.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
  if(!qualified){diagnostics.push({id:n.id,issue:'shadow caster scope not validated; unchanged'});return[n];}
  n.aeuxShadowSoftnessFactor=2.1;
  if(p.opacity===100&&s.spread===0)return[n];
  const caster=JSON.parse(JSON.stringify(n));caster.id+=':shadow-caster';caster.name+=' / shadow caster';
  caster.fill[0].opacity=100;if(caster.fill[0].color?.length===4)caster.fill[0].color[3]=1;
  if(spreadQualified){
   const cw=w+2*s.spread,ch=h+2*s.spread;
   caster.frame.width=cw;caster.frame.height=ch;
   caster.path.points=caster.path.points.map(([x,y])=>[x*cw/w,y*ch/h]);
   caster.shadow[0].spread=0;
  }
  caster.aeuxShadowOnly=true;caster.shouldBreakMaskChain=false;n.shadow=null;delete n.aeuxShadowSoftnessFactor;added++;
  return[caster,n];
 });}
 const result=visit(copy);if(result[0]?.type==='Artboard')result[0].layerCount+=added;
 return{records:result,addedCasters:added,diagnostics};
}
function patchShadowCasterHost(host){
 const before='shadowEffect("ADBE Drop Shadow-0005").setValue(layer.shadow[i].blur * compMult * layerScaleFactor);';
 assert.equal(host.split(before).length,2,'Expected one shadow softness assignment');
 return host.replace(before,'shadowEffect("ADBE Drop Shadow-0005").setValue(layer.shadow[i].blur * compMult * layerScaleFactor * (layer.aeuxShadowSoftnessFactor || 1));\n                    if (layer.aeuxShadowOnly === true) shadowEffect("ADBE Drop Shadow-0006").setValue(1);');
}
function prepareShadowNodeOpacity(records,nativeNodes,geometry){
 const copy=JSON.parse(JSON.stringify(records)),sources=new Map(nativeNodes.map(n=>[n.id,n])),padding=[],diagnostics=[];let added=0;
 if(copy[0]?.type!=='Artboard'||copy[0]?.hostApp!=='Figma')return{records:copy,addedScopes:0,padding,diagnostics};
 function visit(n){
  if(n.layers)n.layers=n.layers.map(visit);
  if(!(n.opacity>0&&n.opacity<100)||n.rotation!==0||n.flip?.some(v=>v!==100)||!sources.get(n.id)?.absoluteRenderBounds)return n;
  const content=JSON.parse(JSON.stringify(n));content.opacity=100;
  // Reuse the exact qualification gate instead of maintaining a second list.
  const probe=prepareShadowCasters([{type:'Artboard',hostApp:'Figma',layerCount:1},content]);
  if(probe.diagnostics.length||!probe.records.some(x=>x.aeuxShadowSoftnessFactor))return n;
  content.id+=':shadow-content';content.frame.x=content.frame.width/2;content.frame.y=content.frame.height/2;
  content.rotation=0;content.flip=[100,100];content.shouldBreakMaskChain=false;added++;
  const scope={...n,type:'Component',fill:[],stroke:[],shadow:null,innerShadow:null,blur:null,layers:[content],aeuxCompositeScope:true,clipsContent:false};
  // Pad only the new scope. Existing mask scopes may already have local origins.
  const padded=padMaskComposites([scope],nativeNodes,geometry);
  padding.push(...padded.changes);diagnostics.push(...padded.diagnostics);return padded.records[0];
 }
 const scoped=copy.map(visit);scoped[0].layerCount+=added;
 return{records:scoped,addedScopes:added,padding,diagnostics};
}
module.exports={prepareShadowCasters,patchShadowCasterHost,enrichNativeShadowSpread,prepareShadowNodeOpacity};
