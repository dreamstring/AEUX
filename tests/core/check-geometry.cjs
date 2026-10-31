const fs=require('fs'),vm=require('vm'),assert=require('assert');
const g=vm.runInNewContext(fs.readFileSync(__dirname+'/../../packages/core/geometry.js','utf8')+';({point:aeuxTransformPoint,multiply:aeuxMultiplyMatrices,invert:aeuxInvertMatrix,center:aeuxCenterInExportRoot})');
function near(a,b){assert(Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7,JSON.stringify({a,b}));}
let tested=0;
for(let angle=-180;angle<=180;angle+=15)for(const flip of [-1,1]){
 const a=angle*Math.PI/180,m=[[Math.cos(a)*flip,-Math.sin(a),21],[Math.sin(a)*flip,Math.cos(a),-17]],parent=[[.7,-.4,130],[.4,.7,210]],p=[13,23];
 near(g.point(g.invert(m),g.point(m,p)),p);
 near(g.point(g.multiply(parent,m),p),g.point(parent,g.point(m,p)));
 near(g.center({absoluteTransform:g.multiply(parent,m),width:26,height:46},parent),g.point(m,p));tested++;
}
assert.throws(()=>g.invert([[0,0,0],[0,0,0]]),/non-invertible/);
console.log('PASS: '+tested+' affine inversion/composition/root-coordinate cases; singular transform rejected.');
