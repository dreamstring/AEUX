function aeuxValidRasterBounds(b){
    return !!b && [b.x,b.y,b.width,b.height].every(function(v){return typeof v==='number'&&isFinite(v);}) && b.width>0 && b.height>0;
}
function aeuxRasterGeometryBounds(node){
    if(aeuxValidRasterBounds(node.absoluteBoundingBox))return node.absoluteBoundingBox;
    var t=node.absoluteTransform,w=node.width,h=node.height;
    if(!t||!(w>0&&h>0))return null;
    var points=[[0,0],[w,0],[0,h],[w,h]].map(function(p){return [t[0][0]*p[0]+t[0][1]*p[1]+t[0][2],t[1][0]*p[0]+t[1][1]*p[1]+t[1][2]];});
    var xs=points.map(function(p){return p[0];}),ys=points.map(function(p){return p[1];});
    var x=Math.min.apply(null,xs),y=Math.min.apply(null,ys);
    return {x:x,y:y,width:Math.max.apply(null,xs)-x,height:Math.max.apply(null,ys)-y};
}
// Main-thread export metadata, captured alongside the actual PNG bytes.
// No bridge, disk I/O, or document edits. Reset for each export transaction.
var aeuxRasterExports={};
function aeuxCaptureRasterExport(node,bytes,useAbsoluteBounds){
    if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)
        throw new Error('AEUX: PNG metadata unavailable');
    function u32(i){return bytes[i]*16777216+bytes[i+1]*65536+bytes[i+2]*256+bytes[i+3];}
    var bounds=useAbsoluteBounds?aeuxRasterGeometryBounds(node):node.absoluteRenderBounds;
    if(!aeuxValidRasterBounds(bounds))throw new Error('AEUX: raster export bounds unavailable');
    aeuxRasterExports[node.id]={size:[u32(16),u32(20)],bounds:JSON.parse(JSON.stringify(bounds)),
        parentAbsoluteTransform:node.parent&&node.parent.absoluteTransform,
        useAbsoluteBounds:useAbsoluteBounds};
}
function aeuxAttachRasterExports(scenes){
    function walk(node){if(aeuxRasterExports[node.id])node.aeuxRasterExport=aeuxRasterExports[node.id];
        (node.children||[]).forEach(walk);}
    scenes.forEach(walk);
}
