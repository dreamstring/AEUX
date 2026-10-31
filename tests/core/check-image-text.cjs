'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {aeuxImageTextPlan:plan,aeuxPrepareImageTextScene:prepare}=require('../../packages/core/image-text.js');
const sample=()=>({id:'1:2',name:'Text',type:'TEXT',fontSize:24,fontName:{family:'Inter',style:'Regular'},fills:[{type:'IMAGE',visible:true,imageHash:'test',scaleMode:'TILE'}],strokes:[],effects:[],aeuxTextStyleRuns:[{fills:[]}],aeuxRasterExport:{imageTextPlane:true}});
assert.equal(plan(sample()).assetName,'AEUX_ImageText_1-2');
for(const modify of [n=>n.name='*Text',n=>n.effects=[{visible:true}],n=>n.strokes=[{}],n=>n.fills.push({type:'SOLID'}),n=>n.fontSize='mixed',n=>n.aeuxTextStyleRuns.push({})]){const n=sample();modify(n);assert.equal(plan(n),null);}
const source=sample(),before=JSON.stringify(source),result=prepare(source);
assert.equal(JSON.stringify(source),before);assert.equal(result.fills[0].type,'SOLID');assert.equal(result.rasterize,false);assert.equal(result.aeuxImageText.contract,'image-text-v1');
const missing=sample();delete missing.aeuxRasterExport;assert.equal(prepare(missing).fills[0].type,'IMAGE');
// The temporary plane must always be removed, including failed exports.
(async()=>{
 const code=fs.readFileSync(require.resolve('../../packages/figma-export/image-text-plane.js'),'utf8');
 for(const fails of [false,true]){
  let removed=0;const metadata={};const rect={id:'temp',resize(w,h){assert.equal(w,100);assert.equal(h,50);},async exportAsync(){if(fails)throw Error('export failed');return new Uint8Array([1]);},remove(){removed++;}};
  const context={figma:{createRectangle:()=>rect},aeuxRasterExports:metadata,aeuxCaptureRasterExport(){metadata.temp={bounds:{x:0,y:0,width:100,height:50},size:[100,50]};}};
  vm.createContext(context);vm.runInContext(code,context);
  const node={...sample(),width:100,height:50,absoluteTransform:[[1,0,0],[0,1,0]],parent:{absoluteTransform:[[1,0,0],[0,1,0]]}};
  if(fails)await assert.rejects(context.aeuxExportImageTextPlane(node,1,plan(node)),/export failed/);
  else{const exported=await context.aeuxExportImageTextPlane(node,1,plan(node));assert.equal(exported.id,'AEUX_ImageText_1-2');assert.equal(metadata['1:2'].imageTextPlane,true);assert.equal(metadata.temp,undefined);}
  assert.equal(removed,1);
 }
 // An older CEP must never receive editable image-text records it cannot render.
 const preflight=fs.readFileSync(require.resolve('../../packages/figma-export/image-text-preflight.js'),'utf8');
 for(const compatible of [false,true]){
  const calls=[];const context={Response,document:{querySelector:()=>null},window:{fetch:async(url)=>{calls.push(url);return url.endsWith('/evalScript')?new Response(JSON.stringify({imageTextContract:compatible?'image-text-v1':undefined})):new Response('{}');}}};
  vm.createContext(context);vm.runInContext(preflight,context);
  const response=await context.window.fetch('http://127.0.0.1:7240/writeFiles',{body:JSON.stringify({data:{layerData:[{layers:[{imageText:{contract:'image-text-v1'}}]}]}})});
  assert.equal(response.status,compatible?200:409);assert.equal(calls.length,compatible?2:1);
 }
 console.log('Image text qualification, immutable conversion, plane cleanup and paired-host preflight passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
