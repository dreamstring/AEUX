// Experimental evaluated geometry. Uses Figma's paths, not guessed corner math.
function resolveEllipseGeometry(node){
 if(node.type==='ELLIPSE'&&node.fillGeometry?.length===1)
  return {...node,type:'VECTOR',children:[],vectorPaths:node.fillGeometry.map(p=>({data:p.data,windingRule:p.windingRule}))};
 return {...node,children:(node.children||[]).map(resolveEllipseGeometry)};
}
function attachClipPaths(records,scene,convert){
 const byId=new Map();(function walk(n){byId.set(n.id,n);(n.children||[]).forEach(walk);})(scene);
 function walk(n){const source=byId.get(n.id);
  if(n.type==='Component'&&source?.clipsContent===true&&source.fillGeometry?.length===1){
   const vector={...source,type:'VECTOR',children:[],vectorPaths:source.fillGeometry.map(p=>({data:p.data,windingRule:p.windingRule}))};
   const parsed=convert({...scene,children:[vector]}).find(p=>p.id===source.id&&p.type==='Path');
   if(!parsed?.path?.points?.length)throw Error('Native clip path conversion failed: '+source.id);
   n.aeuxClipPath=parsed.path;
  }
  (n.layers||[]).forEach(walk);
 }
 records.forEach(walk);return records;
}
function patchNativeClipPaths(host){
 const marker='    function aeGroup(layer, opt_parent) {';
 if(host.split(marker).length!==2)throw Error('Unexpected group function');
 host=host.replace(marker,`    function aeuxApplyNativeClip(r, layer) {
        if (!layer.aeuxClipPath) return;
        var p=layer.aeuxClipPath, s=new Shape();
        function scale(points){var out=[];for(var i=0;i<points.length;i++)out.push([points[i][0]*compMult,points[i][1]*compMult]);return out;}
        var origin=layer.aeuxCompOrigin || [0,0], vertices=[];
        for(var v=0;v<p.points.length;v++)vertices.push([p.points[v][0]-origin[0],p.points[v][1]-origin[1]]);
        s.vertices=scale(vertices);s.inTangents=scale(p.inTangents);s.outTangents=scale(p.outTangents);s.closed=p.closed;
        var m=r.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');m.name='Figma native clip';m.property('ADBE Mask Shape').setValue(s);
    }
`+marker);
 const insertion='            r.collapseTransformation = layer.clipsContent !== true && !layer.aeuxCompositeScope;';
 if(host.split(insertion).length!==2)throw Error('Unexpected collapse contract');
 return host.replace(insertion,insertion+'\n            aeuxApplyNativeClip(r,layer);');
}
module.exports={resolveEllipseGeometry,attachClipPaths,patchNativeClipPaths};
