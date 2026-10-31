// Inserted inside the AEUX closure. PSD is prepared by the CEP-side writer.
// Keep the imported TextDocument intact: reassigning base style flattens runs.
var aeuxPendingRichText=[];
function aeuxFinalizeRichText(){
    var pending=aeuxPendingRichText;aeuxPendingRichText=[];var aligned=0,errors=[];
    for(var i=0;i<pending.length;i++)try{
        var item=pending[i],r=item.layer;
        if(!(r instanceof TextLayer)||r.text.sourceText.value.text!==item.text)throw Error('Imported text changed before alignment');
        var b=r.sourceRectAtTime(0,false);
        r.transform.anchorPoint.setValue([b.left+b.width/2,b.top+b.height/2]);aligned++;
    }catch(e){errors.push(String(e));}
    return JSON.stringify({aligned:aligned,errors:errors});
}
function aeuxImportRichText(layer,opt_parent){
    var file=new File(layer.richTextPsd);
    if(!file.exists||!/\.psd$/i.test(file.name))throw Error('AEUX: styled text PSD missing');
    var labels=['Convert to Editable Text','\u8f6c\u6362\u4e3a\u53ef\u7f16\u8f91\u6587\u5b57','\u8f6c\u6362\u4e3a\u53ef\u7f16\u8f91\u6587\u672c'],command=0;
    for(var ci=0;ci<labels.length&&!command;ci++)command=app.findMenuCommandId(labels[ci]);
    if(!command)throw Error('AEUX: editable text command unavailable in this language');
    var options=new ImportOptions(file);
    if(!options.canImportAs(ImportAsType.COMP_CROPPED_LAYERS))throw Error('AEUX: layered PSD import unavailable');
    options.importAs=ImportAsType.COMP_CROPPED_LAYERS;
    var imported=app.project.importFile(options),target=thisComp;
    if(!(imported instanceof CompItem)||imported.numLayers!==1)throw Error('AEUX: expected one styled text layer');
    imported.name='AEUX styled text source - '+layer.name;imported.openInViewer();
    imported.layer(1).selected=true;app.executeCommand(command);
    var source=imported.layer(1);
    if(!(source instanceof TextLayer))throw Error('AEUX: PSD did not convert to editable text');
    source.copyToComp(target);var r=target.layer(1);r.name=layer.name;r.selected=false;
    var ink=r.sourceRectAtTime(0,false),t=r.property('ADBE Transform Group');
    t.property('ADBE Anchor Point').setValue([ink.left+ink.width/2,ink.top+ink.height/2]);
    var center=layer.targetInkCenter||[layer.frame.x,layer.frame.y];
    t.property('ADBE Position').setValue([center[0]*compMult,center[1]*compMult]);
    t.property('ADBE Scale').setValue([layer.flip[0]*compMult,layer.flip[1]*compMult]);
    t.property('ADBE Rotate Z').setValue(layer.rotation);t.property('ADBE Opacity').setValue(layer.opacity);
    if(opt_parent){r.setParentWithJump(opt_parent);r.moveAfter(opt_parent);}
    r.enabled=layer.isVisible&&(!opt_parent||opt_parent.enabled);
    setLayerBlendMode(r,layer);setMask(r,layer);addDropShadow(r,layer);addBlur(r,layer);addInnerShadow(r,layer);addBgBlur(r,layer);
    aeuxPendingRichText.push({layer:r,text:layer.stringValue});
    target.openInViewer();return r;
}
