// CEP's native callback contract is retained. Only JSON AEUX.buildLayers calls
// are intercepted; unrelated scripts pass through unchanged. No timer/retry.
function installBuildInterceptor(cep,prepare){
 const original=cep.evalScript;let tail=Promise.resolve();
 function native(script){return new Promise((resolve,reject)=>original.call(cep,script,result=>{
  let value;try{value=JSON.parse(result);}
  catch(e){reject(Error('AEUX host returned invalid JSON: '+String(result).slice(0,300)));return;}
  if(value&&value.error){reject(Error('AEUX host: '+value.error+(value.line?' (line '+value.line+')':'')));return;}
  resolve({raw:result,value});
 }));}
 function wrapped(script,callback){
  const match=/^AEUX\.buildLayers\(([\s\S]*)\)$/.exec(script);
  if(!match)return original.call(cep,script,callback);
  let params;try{params=JSON.parse(match[1]);}catch(e){return original.call(cep,script,callback);}
  let settled=false;function deliver(value){if(settled)return;settled=true;if(callback)callback(value);}
  tail=tail.then(async()=>{
   const job=await prepare(params);
   const result=await native('AEUX.buildLayers('+JSON.stringify(job.params)+')');
   if(!result.value||typeof result.value!=='object')throw Error('AEUX build rejected');
   if(job.needsFinalize){
    const final=await native('AEUX.finalizeTextLayout()');
    if(!final.value||(final.value.errors&&final.value.errors.length)||
       final.value.aligned!==job.expectedAlignments)throw Error('Styled text layout alignment failed: expected '+job.expectedAlignments+', received '+JSON.stringify(final.value));
   }
   deliver(result.raw);
  }).catch(error=>{
   deliver(JSON.stringify({error:String(error),msg:[],layerCount:'0'}));
  });
 }
 cep.evalScript=wrapped;
 return {idle:()=>tail,uninstall(){if(cep.evalScript===wrapped)cep.evalScript=original;}};
}
module.exports={installBuildInterceptor};
