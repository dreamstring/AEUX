'use strict';
const fs=require('fs'),path=require('path');
function patchRasterizeToggle(source){
 const start='if("addRasterizeFlag"===e.type){',end='if("removeAllLinks"===e.type){';
 const begin=source.indexOf(start),finish=source.indexOf(end,begin);
 if(begin<0||finish<begin||source.split(start).length!==2)throw Error('Rasterize message handler changed');
 const helper=fs.readFileSync(path.join(__dirname,'../packages/figma-export/rasterize-toggle.js'),'utf8');
 return source.slice(0,begin)+start+helper+'\naeuxToggleRasterizeSelection();}'+source.slice(finish);
}
module.exports={patchRasterizeToggle};
