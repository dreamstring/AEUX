(function(){
 var previous=window.fetch.bind(window);
 function hasImageText(nodes){return (nodes||[]).some(function(n){return !!n.imageText||hasImageText(n.layers);});}
 window.fetch=function(url,options){
  var body;try{body=JSON.parse(options&&options.body||'null');}catch(e){}
  if(url!=='http://127.0.0.1:7240/writeFiles'||!body||!body.data||!hasImageText(body.data.layerData))return previous(url,options);
  return previous('http://127.0.0.1:7240/evalScript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method:'getAlignmentInfo',data:{}})}).then(function(response){return response.json();}).then(function(info){
   if(info.imageTextContract!=='image-text-v1'){
    var message='当前 CEP 不支持可编辑图片文字，请安装配套预览版。',status=document.querySelector('[role="status"]');
    if(status){status.textContent=message;status.style.color='#ffb4ab';}
    return new Response(JSON.stringify({error:message}),{status:409,headers:{'Content-Type':'application/json'}});
   }
   return previous(url,options);
  });
 };
}());
