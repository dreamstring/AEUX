// Temporary texture-only plane: let Figma resolve TILE/CROP/filter semantics.
// The editable glyph is never included in this image.
async function aeuxExportImageTextPlane(node,scale,plan) {
  plan=plan||aeuxImageTextPlan(node);if(!plan)return null;
  var rectangle=figma.createRectangle();
  try {
    rectangle.name='AEUX temporary text texture';rectangle.resize(node.width,node.height);
    rectangle.fills=node.fills;rectangle.opacity=1;
    rectangle.relativeTransform=node.absoluteTransform;
    var bytes=await rectangle.exportAsync({format:'PNG',useAbsoluteBounds:true,constraint:{type:'SCALE',value:scale}});
    aeuxCaptureRasterExport(rectangle,bytes,true);
    var metadata=aeuxRasterExports[rectangle.id];delete aeuxRasterExports[rectangle.id];
    metadata.imageTextPlane=true;metadata.parentAbsoluteTransform=node.parent&&node.parent.absoluteTransform;
    aeuxRasterExports[node.id]=metadata;
    return {bytes:bytes,id:plan.assetName};
  } finally {rectangle.remove();}
}
