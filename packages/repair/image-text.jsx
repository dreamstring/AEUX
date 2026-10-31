// Called after the editable native text layer has been positioned.
function aeuxCreateImageTextFill(text,layer,parent) {
    var descriptor=layer.imageText;
    if(!descriptor||descriptor.contract!=='image-text-v1')return;
    var file=new File(folderPath+'/'+descriptor.assetName+'.png');
    if(!file.exists)throw Error('AEUX image-text texture missing');
    var footage=app.project.importFile(new ImportOptions(file));
    var texture=thisComp.layers.add(footage),rt=descriptor.rasterTransform;
    texture.name=layer.name+' / texture';
    var transform=texture.property('ADBE Transform Group');
    transform.property('ADBE Anchor Point').setValue(rt.anchor);
    transform.property('ADBE Position').setValue([rt.position[0]*compMult,rt.position[1]*compMult]);
    transform.property('ADBE Scale').setValue([rt.scale[0]*compMult,rt.scale[1]*compMult]);
    transform.property('ADBE Rotate Z').setValue(rt.rotation);
    transform.property('ADBE Opacity').setValue(layer.opacity);
    if(parent)texture.setParentWithJump(parent);
    texture.moveAfter(text);
    text.name=layer.name+' / text matte';
    text.property('ADBE Transform Group').property('ADBE Opacity').setValue(100);
    if(typeof texture.setTrackMatte==='function')texture.setTrackMatte(text,TrackMatteType.ALPHA);
    else texture.trackMatteType=TrackMatteType.ALPHA;
    text.enabled=false;texture.enabled=layer.isVisible;
    setLayerBlendMode(texture,layer);
    return texture;
}
