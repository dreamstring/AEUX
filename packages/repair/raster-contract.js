// Reference contract for an axis-aligned raster in document coordinates.
// The caller MUST supply the exact bounds used to generate the PNG; node size
// and export-root size are not substitutes. Not wired into production yet.
function aeuxRasterInParent(documentBounds, parentAbsoluteTransform) {
    var b=documentBounds;
    if(!b || !isFinite(b.x)||!isFinite(b.y)||!isFinite(b.width)||!isFinite(b.height)||b.width<=0||b.height<=0)
        throw new Error('AEUX: invalid raster export bounds');
    var inverse=aeuxInvertMatrix(parentAbsoluteTransform);
    var rasterToDocument=[[b.width,0,b.x],[0,b.height,b.y]];
    var matrix=aeuxMultiplyMatrices(inverse,rasterToDocument);
    return {unitRasterToParent:matrix,
        center:aeuxTransformPoint(matrix,[0.5,0.5]),
        corners:[[0,0],[1,0],[1,1],[0,1]].map(function(p){return aeuxTransformPoint(matrix,p);})};
}

// Decompose unit-square raster axes into AE's rotation and signed XY scale.
// Width/height describe the actual decoded PNG, not the Figma node dimensions.
function aeuxRasterAeTransform(contract, pixelWidth, pixelHeight) {
    if(!isFinite(pixelWidth)||!isFinite(pixelHeight)||pixelWidth<=0||pixelHeight<=0)
        throw new Error('AEUX: invalid raster pixel dimensions');
    var m=contract.unitRasterToParent;
    var a=m[0][0],b=m[1][0],c=m[0][1],d=m[1][1];
    var lengthX=Math.sqrt(a*a+b*b),lengthY=Math.sqrt(c*c+d*d);
    if(lengthX<1e-12||lengthY<1e-12)throw new Error('AEUX: collapsed raster transform');
    if(Math.abs(a*c+b*d)/(lengthX*lengthY)>1e-8)
        throw new Error('AEUX: raster transform requires shear support');
    var signedY=(a*d-b*c)/lengthX;
    return {position:contract.center.slice(),anchor:[pixelWidth/2,pixelHeight/2],
        rotation:Math.atan2(b,a)*180/Math.PI,
        scale:[lengthX/pixelWidth*100,signedY/pixelHeight*100]};
}
