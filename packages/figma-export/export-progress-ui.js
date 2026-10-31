(function(){
 var style=document.createElement('style');style.textContent='html{width:100%;height:100%;overflow:hidden!important;background:#292929!important;color-scheme:dark}body{box-sizing:border-box;width:100%;max-width:100%;height:100%;margin:0!important;padding:8px 8px 58px!important;overflow:hidden!important;background:#202020!important}#app{max-width:100%;box-sizing:border-box}.group{margin-top:14px!important}';document.head.appendChild(style);
 var status=document.createElement('div');status.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9999;box-sizing:border-box;max-height:58px;overflow-y:auto;overflow-x:hidden;padding:7px 10px;font:11px/1.4 sans-serif;color:#ccc;background:#292929;border-top:1px solid #444;overflow-wrap:anywhere;user-select:text';status.setAttribute('role','status');status.textContent='0.1.7 · 就绪';document.body.appendChild(status);
 var phase='idle',started=0,timer=null,requestInfo='',notice='';
 function show(text,error){status.style.color=error?'#ffb4ab':'#ccc';status.textContent=text+(notice?'\n'+notice:'');}
 function settle(text,error){phase='done';if(timer)clearInterval(timer);timer=null;show(text,error);}
 var originalFetch=window.fetch.bind(window);
 window.fetch=function(url,options){
  if(typeof url!=='string'||url.indexOf('http://127.0.0.1:7240/')!==0)return originalFetch(url,options);
  var size=new Blob([options&&options.body||'']).size;
  requestInfo=(size/1048576).toFixed(1)+' MB';phase='waiting';started=Date.now();
  if(timer)clearInterval(timer);
  function waiting(){show('等待 AE 返回 · '+requestInfo+' · '+Math.floor((Date.now()-started)/1000)+' 秒');}
  waiting();timer=setInterval(waiting,1000);
  return originalFetch(url,options).then(function(response){
   return response.clone().text().then(function(text){
    if(!response.ok){settle('AE 接收失败：HTTP '+response.status+' · '+requestInfo+' · '+text.slice(0,400),true);return response;}
    var value;try{value=JSON.parse(text);}catch(error){settle('AE 返回无法解析：'+text.slice(0,400),true);return response;}
    if(value&&value.error)settle('AE 导入失败：'+value.error,true);
    else if(value&&value.layerCount!==undefined)settle('AE 已返回：'+value.layerCount+' 层 · '+requestInfo,false);
    else settle('AE 返回：'+text.slice(0,400),true);
    return response;
   });
  }).catch(function(error){settle('传输失败：'+String(error)+' · '+requestInfo,true);throw error;});
 };
 window.addEventListener('message',function(event){var d=event.data&&event.data.pluginMessage;if(!d)return;
  if(d.type==='AEUX_EXPORT_BEGIN'){phase='idle';notice='';if(timer)clearInterval(timer);timer=null;show('正在读取选中图层…');}
  if(d.type==='AEUX_EXPORT_PROGRESS')show('PNG '+d.done+'/'+d.total+' · '+d.name);
  if(d.type==='AEUX_EXPORT_ERROR')settle(d.error,true);
  if(d.type==='AEUX_EXPORT_NOTICE'){notice=d.message;show(d.message);}
  if((d.type==='fetchImagesAndAEUX'||d.type==='fetchAEUX')&&phase==='idle')show('正在转换图层数据…');
 });
 window.addEventListener('error',function(event){status.style.color='#ffb4ab';status.textContent='转换失败：'+event.message;});
 window.addEventListener('unhandledrejection',function(event){status.style.color='#ffb4ab';status.textContent='传输失败：'+String(event.reason);});
}());
