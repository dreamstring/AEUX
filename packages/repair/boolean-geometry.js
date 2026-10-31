// AEUX's child-by-child CSG rebuilding loses nested offsets and container paths.
// Figma's evaluated fill geometry retains the visible boolean result directly.
// Result remains editable vector paths; original document nodes are untouched.
function aeuxResolveBooleanGeometry(node){
    if(node.type==='BOOLEAN_OPERATION'&&node.fillGeometry&&node.fillGeometry.length){
        return Object.assign({},node,{type:'VECTOR',children:[],
            vectorPaths:node.fillGeometry.map(function(p){return {data:p.data,windingRule:p.windingRule};}),
            booleanOperation:'NONE',aeuxResolvedBoolean:true});
    }
    if(!node.children)return node;
    return Object.assign({},node,{children:node.children.map(aeuxResolveBooleanGeometry)});
}
