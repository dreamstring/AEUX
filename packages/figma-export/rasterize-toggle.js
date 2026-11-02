function aeuxToggleRasterizeSelection() {
  var nodes=Array.from(figma.currentPage.selection).filter(function(node){return !node.removed;});
  if(!nodes.length){figma.ui.postMessage({type:'footerMsg',action:'Select layers first',layerCount:null});return;}
  // A mixed selection becomes fully marked; clicking again clears the selection.
  var clear=nodes.every(function(node){return /^\*/.test(node.name);});
  figma.commitUndo();
  for(var node of nodes){
    if(clear)node.name=node.name.replace(/^\* ?/,'');
    else if(!/^\*/.test(node.name))node.name='* '+node.name;
  }
  // Commit while the plugin stays open, so normal Figma Undo/Redo can act now.
  figma.commitUndo();
  figma.ui.postMessage({type:'footerMsg',action:clear?'rasterization disabled':'marked as PNG',layerCount:nodes.length});
}
