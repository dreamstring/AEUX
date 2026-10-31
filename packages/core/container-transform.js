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
