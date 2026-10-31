// Reject malformed importer values before crossing the AE scripting bridge.
function validateProtocol(records){
 const issues=[];
 function walk(nodes,path){for(const n of nodes){
  const here=path.concat(n.name||n.id||n.type);
  for(const [i,s] of (n.stroke||[]).entries()){
   for(const key of ['width','opacity','cap','join'])
    if(typeof s[key]!=='number'||!Number.isFinite(s[key]))
     issues.push({id:n.id,path:here,field:'stroke['+i+'].'+key,value:s[key]===undefined?'undefined':s[key]});
  }
  walk(n.layers||[],here);
 }}
 walk(records,[]);return issues;
}
module.exports={validateProtocol};
