// CEP/Node entry point: prepare PSD assets before dispatching buildLayers.
// Pure descriptor validation completes before any files are written.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {buildPsdTextDocument}=require('./psd-text-document.cjs');
function prepareStyledText(records,{outputDirectory,resolveFont,writePsdBuffer}){
 if(!path.isAbsolute(outputDirectory))throw Error('Styled text output directory must be absolute');
 const result=JSON.parse(JSON.stringify(records)),plans=[];
 function walk(n){
  if(n.type==='Text'&&n.textStyleRuns&&n.textStyleRuns.length>1){
   const document=buildPsdTextDocument(n,resolveFont);
   const digest=crypto.createHash('sha256').update(JSON.stringify(document)).digest('hex');
   plans.push({node:n,document,file:path.join(outputDirectory,'.aeux-styled-text',digest+'.psd')});
  }
  for(const child of n.layers||[])walk(child);
 }
 result.forEach(walk);
 const assets=[];
 for(const plan of plans){
  const d=plan.document;
  const imageData={width:d.width,height:d.height,data:new Uint8ClampedArray(d.width*d.height*4)};
  const buffer=writePsdBuffer({width:d.width,height:d.height,imageData,
   children:[{name:'AEUX styled text',left:0,top:0,imageData,text:d.text}]},{invalidateTextLayers:true,noBackground:true});
  fs.mkdirSync(path.dirname(plan.file),{recursive:true});
  fs.writeFileSync(plan.file,buffer,{flag:'w'});
  plan.node.richTextPsd=plan.file.replace(/\\/g,'/');assets.push({id:plan.node.id,file:plan.file,bytes:buffer.length});
 }
 return {records:result,assets};
}
module.exports={prepareStyledText};
