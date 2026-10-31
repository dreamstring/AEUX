// Build a PSD text descriptor, keeping UTF-16 style ranges. The caller supplies
// a verified PostScript font resolver; never guess a different font silently.
function buildPsdTextDocument(record,resolveFont){
 const text=record.stringValue,runs=record.textStyleRuns;
 if(typeof text!=='string'||!Array.isArray(runs)||!runs.length)throw Error('Missing styled text');
 let offset=0,maxSize=0;
 const styleRuns=runs.map(run=>{
  if(run.start!==offset||run.end<=run.start||run.end>text.length)throw Error('Non-contiguous text ranges');
  if(run.characters!==text.slice(run.start,run.end))throw Error('Range text mismatch');
  offset=run.end;
  if(!Number.isFinite(run.fontSize)||run.fontSize<=0)throw Error('Invalid range font size');
  const font=resolveFont(run.fontName,run);if(typeof font!=='string'||!font)throw Error('Unresolved range font');
  const style={font:{name:font},fontSize:run.fontSize};maxSize=Math.max(maxSize,run.fontSize);
  if(run.fills){
   const fills=run.fills.filter(p=>p.visible!==false);
   if(fills.length!==1||fills[0].type!=='SOLID'||(fills[0].opacity!==undefined&&fills[0].opacity!==1))throw Error('Paint requires separate text appearance handling');
   const c=fills[0].color;style.fillColor={r:c.r*255,g:c.g*255,b:c.b*255};
  }
  if(run.letterSpacing){const s=run.letterSpacing;style.tracking=s.unit==='PIXELS'?s.value/run.fontSize*1000:s.value*10;}
  if(run.lineHeight&&run.lineHeight.unit!=='AUTO'){
   style.autoLeading=false;style.leading=run.lineHeight.unit==='PIXELS'?run.lineHeight.value:run.fontSize*run.lineHeight.value/100;
  }
  return {length:run.end-run.start,style};
 });
 if(offset!==text.length)throw Error('Text range coverage incomplete');
 const width=Math.ceil(Math.max(256,record.frame.width+maxSize*4));
 const height=Math.ceil(Math.max(128,record.frame.height+maxSize*4));
 if(width>8192||height>8192)throw Error('Text bridge canvas exceeds bounded probe limit');
 const baseStyle={...styleRuns[0].style};
 // AE's PSD-to-editable conversion mishandles redundant per-run font entries.
 // Inherit the base font for identical runs; retain explicit different fonts.
 const inheritedRuns=styleRuns.map(run=>{const style={...run.style};
  if(style.font.name===baseStyle.font.name)delete style.font;
  return {length:run.length,style};
 });
 const textData={text,transform:[1,0,0,1,maxSize,maxSize*2],styleRuns:inheritedRuns,
  style:baseStyle,paragraphStyle:{justification:['left','right','center'][record.justification]||'left'}};
 if(record.kind==='Area'){textData.shapeType='box';textData.boxBounds=[0,0,record.frame.width,record.textBoxHeight||record.frame.height];}
 return {width,height,text:textData};
}
module.exports={buildPsdTextDocument};
