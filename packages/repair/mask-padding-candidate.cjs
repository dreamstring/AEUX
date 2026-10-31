// Expand non-clipping mask precomps while preserving the original local origin.
// Native document render bounds are transformed to local coordinates; no guessed
// width from another frame and no per-child scale/position compensation.
function padMaskComposites(records,nativeNodes,geometry){
 const result=JSON.parse(JSON.stringify(records)),sources=new Map(nativeNodes.map(n=>[n.id,n]));
 const changes=[],diagnostics=[];
 function shiftChild(n,x,y){
  if(n.frame){n.frame.x-=x;n.frame.y-=y;}
  if(n.rasterTransform?.position){n.rasterTransform.position[0]-=x;n.rasterTransform.position[1]-=y;}
  if(n.targetInkCenter){n.targetInkCenter[0]-=x;n.targetInkCenter[1]-=y;}
 }
 function visit(n){
  (n.layers||[]).forEach(visit);
  if(!n.aeuxCompositeScope||n.clipsContent===true||!n.frame)return;
  const source=sources.get(n.aeuxScopeSourceParentId||n.id),b=source?.absoluteRenderBounds;
  if(!b||!source.absoluteTransform){diagnostics.push({id:n.id,issue:'no native render bounds for padded mask composite'});return;}
  const inverse=geometry.aeuxInvertMatrix(source.absoluteTransform);
  const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(p=>geometry.aeuxTransformPoint(inverse,p));
  if(corners.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('Invalid mask render bounds');
  const w=n.frame.width,h=n.frame.height,minX=Math.min(...corners.map(p=>p[0])),minY=Math.min(...corners.map(p=>p[1])),maxX=Math.max(...corners.map(p=>p[0])),maxY=Math.max(...corners.map(p=>p[1]));
  if(minX>=0&&minY>=0&&maxX<=w&&maxY<=h)return;
  const left=Math.floor(Math.min(0,minX))-2,top=Math.floor(Math.min(0,minY))-2;
  const width=Math.ceil(Math.max(w,maxX))+2-left,height=Math.ceil(Math.max(h,maxY))+2-top;
  if(width>16384||height>16384)throw Error('Mask composite exceeds validated padding limit');
  n.aeuxCompOrigin=[left,top];n.aeuxCompAnchor=[w/2-left,h/2-top];
  n.frame.width=width;n.frame.height=height;
  (n.layers||[]).forEach(c=>shiftChild(c,left,top));
  changes.push({id:n.id,origin:[left,top],oldSize:[w,h],size:[width,height]});
 }
 result.forEach(visit);return {records:result,changes,diagnostics};
}
function patchPaddedCompAnchor(host){
 const marker="r('ADBE Transform Group')('ADBE Anchor Point').setValue([layer.frame.width*compMult/2,layer.frame.height*compMult/2]);";
 if(host.split(marker).length!==2)throw Error('Unexpected component anchor contract');
 return host.replace(marker,"r('ADBE Transform Group')('ADBE Anchor Point').setValue(layer.aeuxCompAnchor ? [layer.aeuxCompAnchor[0]*compMult,layer.aeuxCompAnchor[1]*compMult] : [layer.frame.width*compMult/2,layer.frame.height*compMult/2]);");
}
module.exports={padMaskComposites,patchPaddedCompAnchor};
