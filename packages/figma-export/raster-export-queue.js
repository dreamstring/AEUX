// Bounded exports: settle failed jobs and restore temporary effect changes.
async function aeuxExportRasterJobs(ids,a){
 var cursor=0,done=0,failed=null;
 async function worker(){while(cursor<ids.length&&!failed){
  var e=ids[cursor++],i=figma.getNodeById(e),saved=null;
  try{
   if(!i)throw Error('Raster node missing: '+e);
   figma.ui.postMessage({type:'AEUX_EXPORT_PROGRESS',done:done,total:ids.length,name:i.name});
   if(i.effects){saved=JSON.parse(JSON.stringify(i.effects));i.effects=saved.map(function(effect){var copy=Object.assign({},effect);if(copy.type==='DROP_SHADOW'||copy.type==='LAYER_BLUR')copy.visible=false;return copy;});}
   if(!(i.width>0&&i.height>0))throw Error('Invalid raster dimensions');
   var scale=Math.min(3500/Math.max(i.width,i.height),3);
   var absolute=i.type!=="TEXT"||!aeuxValidRasterBounds(i.absoluteRenderBounds);
   var t=await i.exportAsync({format:'PNG',useAbsoluteBounds:absolute,constraint:{type:'SCALE',value:scale}});
   aeuxCaptureRasterExport(i,t,absolute);a.push({bytes:t,id:i.name.replace(/^\*\s/,'').replace(/^\*/,'')+'_'+e});done++;
  }catch(error){failed=Error('PNG '+(i?i.name:e)+' ['+e+']: '+String(error));}
  finally{if(i&&saved)try{i.effects=saved;}catch(error){if(!failed)failed=error;}}
 }}
 await Promise.all([worker(),worker()]);if(failed)throw failed;
 figma.ui.postMessage({type:'AEUX_EXPORT_PROGRESS',done:done,total:ids.length,name:'读取图片数据'});
}
