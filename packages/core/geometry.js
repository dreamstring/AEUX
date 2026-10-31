// AEUX geometry helpers. Units: Figma document pixels. Matrices: [[a,c,tx],[b,d,ty]].
// Keep source ES5-compatible so the same helpers can be embedded in the shipped UI.
function aeuxTransformPoint(matrix, point) {
    return [matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2],
            matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2]];
}

// Composition A*B maps a point through B first, then A.
function aeuxMultiplyMatrices(a, b) {
    return [[a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1], a[0][0]*b[0][2]+a[0][1]*b[1][2]+a[0][2]],
            [a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1], a[1][0]*b[0][2]+a[1][1]*b[1][2]+a[1][2]]];
}

function aeuxInvertMatrix(matrix) {
    var a=matrix[0][0], c=matrix[0][1], tx=matrix[0][2];
    var b=matrix[1][0], d=matrix[1][1], ty=matrix[1][2];
    var det=a*d-b*c;
    if (Math.abs(det)<1e-12) throw new Error('AEUX: non-invertible transform');
    return [[d/det,-c/det,(c*ty-d*tx)/det],[-b/det,a/det,(b*tx-a*ty)/det]];
}

// AEUX group export uses a center-based parent frame, whereas Figma matrices use
// local top-left coordinates. This offset is protocol-specific, not a general
// rule for converting arbitrary scene graphs.
function aeuxCenterRelativeToParentFrame(node, parentFrame) {
    var center=aeuxTransformPoint(node.relativeTransform,[(node.width||0)/2,(node.height||0)/2]);
    if(parentFrame){center[0]-=parentFrame.x-parentFrame.width/2;center[1]-=parentFrame.y-parentFrame.height/2;}
    return center;
}

// Reference/diagnostics helper: ignores AEUX protocol offsets and works entirely
// in scene coordinates. Not yet substituted into all legacy export paths.
function aeuxCenterInExportRoot(node, rootTransform) {
    var localToRoot=aeuxMultiplyMatrices(aeuxInvertMatrix(rootTransform),node.absoluteTransform);
    return aeuxTransformPoint(localToRoot,[node.width/2,node.height/2]);
}
