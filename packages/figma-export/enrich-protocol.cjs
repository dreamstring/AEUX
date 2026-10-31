// AE layer transform is R(theta) * diag(scaleX, scaleY).
// Preserve the legacy X reflection choice, but derive the full-angle rotation
// with atan2 instead of asin (which loses quadrants and reflection direction).
function aeuxDecomposeContainerMatrix(m,flip){
 var a=m[0][0],b=m[1][0],c=m[0][1],d=m[1][1];
 var x=Math.sqrt(a*a+b*b),y=Math.sqrt(c*c+d*d);
 if(!(x>1e-10&&y>1e-10))return null;
 if(Math.abs(a*c+b*d)/(x*y)>1e-5)return null;
 var sign=flip&&flip[0]<0?-1:1,sx=sign*x,sy=(a*d-b*c)/sx;
 return {rotation:Math.atan2(b/sx,a/sx)*180/Math.PI,flip:[sx*100,sy*100]};
}
// Pure source/native-metadata -> AEUX protocol enrichment. Does not access apps.
function enrichProtocol(records,nativeNodes,geometry,rasters={}){
 const result=JSON.parse(JSON.stringify(records));
 const nodes=new Map(nativeNodes.map(n=>[n.id,n]));
 const rasterNodes=new Map(nativeNodes.map(n=>[n.id.replace(/:/g,'-'),n]));
 const diagnostics=[];
 const isolatedPaintNodes=new Set();
 function visit(n,forcePrecomp,isolatedAncestor){
  const source=nodes.get(n.id)||rasterNodes.get(n.id);
  if(isolatedAncestor)isolatedPaintNodes.add(n.id);
  if(source){
   // Legacy gradient conversion drops paint opacity, while retaining stop alpha.
   // Keep those two factors separate; only pair unambiguous active paint lists.
   for(const [key,nativeKey] of [['fill','fills'],['stroke','strokes']]){
    const paints=n[key]||[],nativePaints=(source[nativeKey]||[]).filter(p=>p.visible!==false);
    if(paints.length===nativePaints.length)paints.forEach((p,i)=>{
     const original=nativePaints[i];
     if(p.type==='gradient'&&original.type?.indexOf('GRADIENT_')===0&&Number.isFinite(original.opacity))
      p.opacity=Math.max(0,Math.min(1,original.opacity))*100;
    });
   }
   if(Number.isFinite(n.bgBlur)&&n.bgBlur>=0&&
      (source.effects||[]).some(e=>e.visible!==false&&e.type==='BACKGROUND_BLUR'))
    n.aeuxBackgroundBlur='figma-native-v1';
   // AE shape-paint blend modes only see contents inside their shape layer.
   // A sole Figma paint must instead see the compositing backdrop. Hoist only
   // the simple case; stacked paints/effects/layer blend require isolation logic.
   const fills=(n.fill||[]).filter(p=>p.enabled!==false),strokes=(n.stroke||[]).filter(p=>p.enabled!==false);
   const paint=fills.length===1&&strokes.length===0?fills[0]:strokes.length===1&&fills.length===0?strokes[0]:null;
   const nativePaint=paint===fills[0]?(source.fills||[]).filter(p=>p.visible!==false)[0]:(source.strokes||[]).filter(p=>p.visible!==false)[0];
   const modes=['DARKEN','MULTIPLY','COLOR_BURN','LIGHTEN','SCREEN','COLOR_DODGE','OVERLAY','SOFT_LIGHT','HARD_LIGHT','DIFFERENCE','EXCLUSION','HUE','SATURATION','COLOR','LUMINOSITY'];
   if(paint&&nativePaint&&!isolatedAncestor&&source.blendMode==='PASS_THROUGH'&&!source.isMask&&
      !(source.effects||[]).some(e=>e.visible!==false)&&modes.includes(nativePaint.blendMode)){
    n.blendMode='BlendingMode.'+nativePaint.blendMode;paint.blendMode=1;
   }
   const sideKeys=['strokeTopWeight','strokeRightWeight','strokeBottomWeight','strokeLeftWeight'];
   if(['Rect','AutoLayoutBG'].includes(n.type)&&n.stroke?.length&&
      (n.stroke.some(s=>!Number.isFinite(s.width))||source.strokeAlign==='INSIDE')&&
      sideKeys.every(k=>Number.isFinite(source[k]))&&source.cornerRadius===0&&n.stroke.every(s=>s.type==='fill')){
    n.sideStrokes={weights:sideKeys.map(k=>source[k]),align:source.strokeAlign,paints:n.stroke};
    n.sideStrokes.rectangles=n.sideStrokes.weights.map((t,i)=>{
     const inset=source.strokeAlign==='INSIDE'?t/2:source.strokeAlign==='OUTSIDE'?-t/2:0,w=n.frame.width,h=n.frame.height;
     return {size:i%2===0?[w,t]:[t,h],position:i===0?[0,-h/2+inset]:i===1?[w/2-inset,0]:i===2?[0,h/2-inset]:[-w/2+inset,0]};
    });
    n.stroke=[];
   }
   if(source.isMask===true||n.isMask!==undefined)n.isMask=source.isMask===true;
   const scope=(n.layers||[]).some(c=>nodes.get(c.id)?.isMask===true);
   // AE parenting does not inherit opacity. Composite translucent Figma groups
   // before applying their opacity rather than losing it on a guide parent.
   const translucentGroup=n.type==='Group'&&Number.isFinite(source.opacity)&&source.opacity!==1;
   if(n.type==='Group'&&(n.isMask||scope||forcePrecomp||translucentGroup))n.type='Component';
   if(translucentGroup&&typeof source.clipsContent!=='boolean')n.clipsContent=false;
   if(n.type==='Component'&&typeof source.clipsContent==='boolean')n.clipsContent=source.clipsContent;
   if(n.type==='Component'&&source.relativeTransform){
    var containerTransform=aeuxDecomposeContainerMatrix(source.relativeTransform,n.flip);
    if(containerTransform){n.rotation=containerTransform.rotation;n.flip=containerTransform.flip;}
    else diagnostics.push({id:n.id,issue:'container matrix is singular or contains shear'});
   }
   if(n.type==='Text'){
    if(source.aeuxTextStyleRuns){
     n.textStyleRuns=JSON.parse(JSON.stringify(source.aeuxTextStyleRuns));
     if(n.textStyleRuns.length>1)diagnostics.push({id:n.id,issue:'range styles preserved; AE application not yet implemented on all supported versions'});
    }
    // Figma's fixed text frame can display ink below its layout height. AE box
    // text clips overflow. Keep wrapping width, but reserve ink height before
    // positioning the measured ink; auto-width text is point text instead.
    if(source.textAutoResize==='WIDTH_AND_HEIGHT')n.kind='Point';
    else if(source.absoluteRenderBounds){
     n.textBoxHeight=Math.max(n.frame.height,source.absoluteRenderBounds.height+2*(n.fontSize||0));
    }
    if(source.fontSize==null)diagnostics.push({id:n.id,issue:'mixed text styles require styled runs or explicit raster fallback'});
    if(source.lineHeight?.unit==='AUTO')n.lineHeight=null;
    const parent=nodes.get(source.parent?.id||source.parent);
    if(source.absoluteRenderBounds&&parent?.absoluteTransform)
     n.targetInkCenter=geometry.aeuxRasterInParent(source.absoluteRenderBounds,parent.absoluteTransform).center;
   }
   if(n.type==='Image'){
    const raster=rasters[n.id]||source.aeuxRasterExport;
    const parent=nodes.get(source.parent?.id||source.parent);
    const parentMatrix=raster?.parentAbsoluteTransform||parent?.absoluteTransform;
    if(!raster||!parentMatrix)diagnostics.push({id:n.id,issue:'missing exported PNG size/parent transform'});
    else{
     const bounds=raster.bounds||source.absoluteBoundingBox;
     n.rasterTransform=geometry.aeuxRasterAeTransform(geometry.aeuxRasterInParent(bounds,parentMatrix),...raster.size);
    }
   }
  }
  const scope=(n.layers||[]).some(c=>nodes.get(c.id)?.isMask===true);
  const isolatedChildren=isolatedAncestor||source&&['GROUP','FRAME','COMPONENT','INSTANCE'].includes(source.type)&&source.blendMode==='NORMAL';
  for(const child of n.layers||[])visit(child,scope,isolatedChildren);
 }
 result.forEach(n=>visit(n,false));
 let addedPaintLayers=0;
 function expandPaints(list){
  const out=[];
  for(const n of list){
   if(n.layers)n.layers=expandPaints(n.layers);
   const source=nodes.get(n.id),paints=(n.fill||[]).filter(p=>p.enabled!==false);
   const native=(source?.fills||[]).filter(p=>p.visible!==false);
   const allowed=['NORMAL','DARKEN','MULTIPLY','COLOR_BURN','LIGHTEN','SCREEN','COLOR_DODGE','OVERLAY','SOFT_LIGHT','HARD_LIGHT','DIFFERENCE','EXCLUSION','HUE','SATURATION','COLOR','LUMINOSITY'];
   const strokes=(n.stroke||[]).filter(p=>p.enabled!==false),nativeStrokes=(source?.strokes||[]).filter(p=>p.visible!==false);
   const splitFillStroke=source&&!isolatedPaintNodes.has(n.id)&&source.blendMode==='PASS_THROUGH'&&source.opacity===1&&!source.isMask&&
    ['Rect','Ellipse','Path','Star'].includes(n.type)&&!n.sideStrokes&&
    paints.length===1&&n.fill.length===1&&native.length===1&&strokes.length===1&&n.stroke.length===1&&nativeStrokes.length===1&&
    !(source.effects||[]).some(e=>e.visible!==false)&&
    [native[0],nativeStrokes[0]].every(p=>p.type==='SOLID'&&allowed.includes(p.blendMode))&&
    [native[0],nativeStrokes[0]].some(p=>p.blendMode!=='NORMAL');
   if(splitFillStroke){
    // Native Figma fixtures establish stroke above fill, each seeing backdrop.
    // Splitting is unsafe for group opacity/effects and stays gated above.
    const fill=JSON.parse(JSON.stringify(n)),stroke=JSON.parse(JSON.stringify(n));
    fill.id=n.id+':fill';stroke.id=n.id+':stroke';
    fill.sourceNodeId=stroke.sourceNodeId=n.id;
    fill.name=n.name+' / fill';stroke.name=n.name+' / stroke';
    fill.stroke=[];stroke.fill=[];fill.fill[0].blendMode=1;stroke.stroke[0].blendMode=1;
    fill.blendMode='BlendingMode.'+native[0].blendMode;
    stroke.blendMode='BlendingMode.'+nativeStrokes[0].blendMode;
    out.push(fill,stroke);addedPaintLayers++;continue;
   }
   const eligible=source&&!isolatedPaintNodes.has(n.id)&&source.blendMode==='PASS_THROUGH'&&source.opacity===1&&!source.isMask&&
    ['Rect','Ellipse','Path','Star'].includes(n.type)&&paints.length>1&&paints.length===native.length&&
    !(n.stroke||[]).some(p=>p.enabled!==false)&&!n.sideStrokes&&
    !(source.effects||[]).some(e=>e.visible!==false)&&
    native.every(p=>p.type==='SOLID'&&allowed.includes(p.blendMode));
   if(!eligible){out.push(n);continue;}
   // Captured Normal-alpha pixels prove later native paints render above
   // earlier ones. AEUX also adds later layers above earlier layers.
   for(let i=0;i<paints.length;i++){
    const child=JSON.parse(JSON.stringify(n));child.id=n.id+':paint:'+i;
    child.sourceNodeId=n.id;child.sourcePaintIndex=i;child.name=n.name+' / fill '+(i+1);
    child.fill=[JSON.parse(JSON.stringify(paints[i]))];child.fill[0].blendMode=1;
    child.blendMode='BlendingMode.'+native[i].blendMode;out.push(child);
   }
   addedPaintLayers+=paints.length-1;
  }
  return out;
 }
 const expanded=expandPaints(result);
 if(addedPaintLayers&&expanded[0]?.type==='Artboard')expanded[0].layerCount+=addedPaintLayers;
 return {records:expanded,diagnostics};
}
module.exports={enrichProtocol};
