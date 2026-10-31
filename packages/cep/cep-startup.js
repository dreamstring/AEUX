(function(){
 try{
 if(!window.__adobe_cep__||window.AEUXAlignment)return;
 var nodeRequire=window.require,path=nodeRequire('path'),url=nodeRequire('url');
 var scriptUrl=document.currentScript.src;
 var scriptPath=typeof url.fileURLToPath==='function'?url.fileURLToPath(scriptUrl):decodeURIComponent(url.parse(scriptUrl).pathname).replace(/^\/([A-Za-z]:)/,'$1');
 var folder=path.join(path.dirname(scriptPath),'alignment');
 var install=nodeRequire(path.join(folder,'cep-build-interceptor.cjs')).installBuildInterceptor;
 var prepare=nodeRequire(path.join(folder,'prepare-styled-text.cjs')).prepareStyledText;
 var writePsd=nodeRequire(path.join(folder,'node_modules/ag-psd')).writePsdBuffer;
 var fallback=path.join(nodeRequire('os').homedir(),'AppData','Roaming','sumUX','AEUX','styled-text');
 window.AEUXAlignment=install(window.__adobe_cep__,function(params){
  var records=params&&params.layerData;if(!Array.isArray(records))throw Error('AEUX layer data missing');
  var output=records[0].folderPath||fallback;
  var result=prepare(records,{outputDirectory:output,writePsdBuffer:writePsd,
   resolveFont:function(font,run){return run.postScriptName;}});
  return {params:Object.assign({},params,{layerData:result.records}),needsFinalize:result.assets.length>0,expectedAlignments:result.assets.length};
 });
 window.AEUXAlignmentStartup={ok:true};
 }catch(error){
  window.AEUXAlignmentStartup={ok:false,error:String(error),stack:error.stack||''};
  if(window.console)console.error('AEUX alignment startup failed',error);
  document.addEventListener('DOMContentLoaded',function(){
   var warning=document.createElement('div');warning.textContent='AEUX 导入增强未加载：'+String(error);
   warning.style.cssText='color:#ffb4ab;padding:8px;font:12px sans-serif';document.body.appendChild(warning);
  });
 }
}());
