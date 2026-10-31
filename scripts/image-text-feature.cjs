'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n');}
function browserSource(){return read('packages/core/image-text.js').replace(/if\(typeof module[^\n]*\n?$/,'');}
function patchImageTextUi(source){
 const marker='var aeuxBaseConvert=y;';if(source.split(marker).length!==2)throw Error('Image-text converter entry changed');
 source=source.replace(marker,browserSource()+'\n'+marker);
 const conversion='y=function(scene){';if(source.split(conversion).length!==2)throw Error('Image-text wrapper changed');
 source=source.replace(conversion,conversion+'scene=aeuxPrepareImageTextScene(scene);');
 const textEntry="   if(n.type==='Text'){";if(source.split(textEntry).length!==2)throw Error('Image-text enrichment changed');
 const textFeature=`
    if(source.aeuxImageText&&source.aeuxRasterExport){
     var textureRaster=source.aeuxRasterExport,textureParent=textureRaster.parentAbsoluteTransform||(nodes.get(source.parent?.id||source.parent)||{}).absoluteTransform||[[1,0,0],[0,1,0]];
     n.imageText={contract:'image-text-v1',assetName:source.aeuxImageText.assetName,
      rasterTransform:geometry.aeuxRasterAeTransform(geometry.aeuxRasterInParent(textureRaster.bounds,textureParent),...textureRaster.size)};
    }
`;
 return source.replace(textEntry,textEntry+textFeature);
}
function patchImageTextCode(source){
 const marker='async function aeuxExportRasterJobs';if(source.split(marker).length!==2)throw Error('Image-text queue changed');
 source=source.replace(marker,browserSource()+'\n'+read('packages/figma-export/image-text-plane.js')+'\n'+marker);
 const plan="   if(!i)throw Error('Raster node missing: '+e);";if(source.split(plan).length!==2)throw Error('Raster node guard changed');
 source=source.replace(plan,plan+"\n   var imageTextPlan=aeuxImageTextPlan(i);");
 const exportStart="   var absolute=i.type!==\"TEXT\"||!aeuxValidRasterBounds(i.absoluteRenderBounds);";if(source.split(exportStart).length!==2)throw Error('Raster export entry changed');
 return source.replace(exportStart,"   if(imageTextPlan){var plane=await aeuxExportImageTextPlane(i,scale,imageTextPlan);a.push(plane);done++;continue;}\n"+exportStart);
}
function patchImageTextHost(source){
 const start=source.indexOf('    function aeText(layer, opt_parent) {'),end=source.indexOf('    function aeGroup',start);
 if(start<0||end<start)throw Error('Text host entry missing');
 let body=source.slice(start,end);
 const marker='                r.enabled = layer.isVisible;\n            }\n        }\n        catch';
 const normalized=body.replaceAll('\r\n','\n');if(normalized.split(marker).length!==2)throw Error('Text host finalization changed');
 body=normalized.replace(marker,'                r.enabled = layer.isVisible;\n            }\n            if(layer.imageText)aeuxCreateImageTextFill(r,layer,opt_parent);\n        }\n        catch');
 return (source.slice(0,start)+read('packages/repair/image-text.jsx')+'\n'+body+source.slice(end)).replace("maskScopeContract:'composite-v1'","imageTextContract:'image-text-v1',maskScopeContract:'composite-v1'");
}
module.exports={patchImageTextUi,patchImageTextCode,patchImageTextHost,browserSource};
