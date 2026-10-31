// Deterministic AE host transformation shared by test and release builders.
// Receives source text explicitly; no app, file, or installation access.
const assert=require('assert');
function patchAeHost(source,{apiName='AEUX',typographySource,richTextSource='',ffxDirectory=null}){
 let host=source;assert(typeof typographySource==='string');
 // Reflection changes orientation, not the sign of effect lengths. Preserve
 // the baseline scale compensation while making it finite for collapsed layers.
 const shadowScale='var layerScaleFactor = 100 / r("ADBE Transform Group")("ADBE Scale").value[0];';
 assert.equal(host.split(shadowScale).length,2);
 host=host.replace(shadowScale,'var shadowScaleX = Math.abs(r("ADBE Transform Group")("ADBE Scale").value[0]);\n        var layerScaleFactor = shadowScaleX > 0 ? 100 / shadowScaleX : 0;');
 const shadowStart=host.indexOf('    function addDropShadow(r, layer) {');
 const shadowEnd=host.indexOf('    function addBlur(',shadowStart);
 assert(shadowStart>=0&&shadowEnd>shadowStart);
 const shadowBody=host.slice(shadowStart,shadowEnd);
 const shadowAlert='alert(e.toString() + "\\nError on line: " + e.line.toString());';
 assert.equal(shadowBody.split(shadowAlert).length,2);
 host=host.slice(0,shadowStart)+shadowBody.replace(shadowAlert,'throw e;')+host.slice(shadowEnd);
 // Figma layer blur spreads into transparency. AE's repeat-edge default
 // materially distorts the kernel on imported shape bounds (native-tested).
 const blurAmount="blur.property('ADBE Gaussian Blur 2-0001').setValue(layer.blur[i].radius * compMult);";
 assert.equal(host.split(blurAmount).length,2);
 host=host.replace(blurAmount,blurAmount+"\n                    blur.property('ADBE Gaussian Blur 2-0003').setValue(0);");
 // Shape modifiers (such as rounded corners) shift indexed fill positions.
 // Find fill opacity semantically on the duplicate adjustment mask only.
 const bgEntry='    function addBgBlur(r, layer, ignoreCompMult) {';
 assert.equal(host.split(bgEntry).length,2);
 host=host.replace(bgEntry,`    function aeuxOpaqueBackgroundMask(group) {
        if (!group) return;
        for (var k = 1; k <= group.numProperties; k++) {
            var property = group.property(k);
            if (property.matchName === 'ADBE Vector Fill Opacity') property.setValue(100);
            else if (property.numProperties) aeuxOpaqueBackgroundMask(property);
        }
    }
`+bgEntry);
 const bgFill='newLayer("ADBE Root Vectors Group")(1)("ADBE Vectors Group")(2)("ADBE Vector Fill Opacity").setValue(100);';
 assert.equal(host.split(bgFill).length,2);
 host=host.replace(bgFill,"aeuxOpaqueBackgroundMask(newLayer.property('ADBE Root Vectors Group'));");
 const bgStart=host.indexOf(bgEntry),bgEnd=host.indexOf('    function addInnerShadow(',bgStart);
 let bgBody=host.slice(bgStart,bgEnd);
 const bgEffect="var blur = newLayer.property('Effects').addProperty('ADBE Gaussian Blur 2');";
 assert.equal(bgBody.split(bgEffect).length,2);
 bgBody=bgBody.replace(bgEffect,`var aeuxColorDomain = layer.aeuxBackgroundBlur === 'figma-native-v1' && app.project.workingSpace === 'None';
            var aeuxEffects = newLayer.property('ADBE Effect Parade');
            if (aeuxColorDomain) aeuxBackgroundGamma(aeuxEffects, 2.4);
            `+bgEffect);
 const bgRadius="blur.property('ADBE Gaussian Blur 2-0001').setValue(layer.bgBlur * compMult);";
 assert.equal(bgBody.split(bgRadius).length,2);
 bgBody=bgBody.replace(bgRadius,"blur.property('ADBE Gaussian Blur 2-0001').setValue(layer.bgBlur * compMult * (aeuxColorDomain ? 0.75 : 1));\n            if (aeuxColorDomain) aeuxBackgroundGamma(aeuxEffects, 1 / 2.4);");
 host=host.slice(0,bgStart)+bgBody+host.slice(bgEnd);
 host=host.replace(bgEntry,`    function aeuxBackgroundGamma(effects, value) {
        var effect = effects.addProperty('ADBE Gamma/Pedestal/Gain2');
        effect.name = 'Figma background color compensation';
        effect.property(2).setValue(value);
        effect.property(5).setValue(value);
        effect.property(8).setValue(value);
    }
`+bgEntry);
// Preserve import failure as a callback error rather than a blocking modal and
// a misleading success response containing the intended layer count.
const buildAlert='alert(e.toString() + "\\nError on line: " + e.line.toString());';
const buildStart=host.indexOf('    function buildLayers(compObj) {');
const buildEnd=host.indexOf('    function filterTypes(',buildStart);
assert(buildStart>=0&&buildEnd>buildStart);
const buildBody=host.slice(buildStart,buildEnd);assert.equal(buildBody.split(buildAlert).length,2);
host=host.slice(0,buildStart)+buildBody.replace(buildAlert,'progressDialog.hide(); try { app.endUndoGroup(); } catch (undoError) {} return JSON.stringify({error:String(e),line:e.line,msg:returnMessage,layerCount:"0"});')+host.slice(buildEnd);
assert.equal(host.split('var AEUX = (function () {').length,2);
const infoEntry='        setFilePath: function () {';
assert.equal(host.split(infoEntry).length,2);
host=host.replace(infoEntry,"        getAlignmentInfo: function () { return JSON.stringify({build:'0.1.4-background-v1',backgroundColorContract:'figma-native-v1',backgroundWorkingSpace:'None',semanticBackgroundMask:true}); },\n"+infoEntry);
assert(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(apiName),'Invalid API identifier');
if(richTextSource){
 const textEntry='    function aeText(layer, opt_parent) {';
 assert.equal(host.split(textEntry).length,2);
 host=host.replace(textEntry,richTextSource+'\n'+textEntry+'\n        if(layer.richTextPsd)return aeuxImportRichText(layer,opt_parent);');
 const apiEntry='        setFilePath: function () {';
 assert.equal(host.split(apiEntry).length,2);
 host=host.replace(apiEntry,'        finalizeTextLayout: function () { return aeuxFinalizeRichText(); },\n'+apiEntry);
}
host=host.replace('var AEUX = (function () {','var '+apiName+' = (function () {');
host=host.replace("layerData[i].type === 'Rect' && prefs.parametrics","layerData[i].type === 'Rect' && (prefs.parametrics || layerData[i].sideStrokes)");
host=host.replace("(!prefs.parametrics && (layerData[i].type === 'Rect' || layerData[i].type === 'Ellipse'))","(!prefs.parametrics && !layerData[i].sideStrokes && (layerData[i].type === 'Rect' || layerData[i].type === 'Ellipse'))");
if(ffxDirectory)host=host.replace("Folder.userData.toString() + '/' + devName + '/' + scriptName + '/ffx/'",JSON.stringify(ffxDirectory.replace(/\\/g,'/')+'/'));
host=host.replace("thisComp.layers.addBoxText([layer.frame.width, layer.frame.height], '')","thisComp.layers.addBoxText([layer.frame.width, layer.textBoxHeight || layer.frame.height], '')");
host=host.replace('textDoc.boxTextSize = [layer.frame.width, layer.frame.height];','if(layer.kind === "Area") textDoc.boxTextSize = [layer.frame.width, layer.textBoxHeight || layer.frame.height];');
const rectStart=host.indexOf('    function aeRect(layer, opt_parent) {');
const rectFill=host.indexOf('        addFill(r, layer);',rectStart);
assert(rectFill>rectStart);
host=host.slice(0,rectFill)+host.slice(rectFill).replace('        addFill(r, layer);',`        addFill(r, layer);
        if(layer.sideStrokes){
            var ss=layer.sideStrokes,w=layer.frame.width,h=layer.frame.height;
            for(var pi=ss.paints.length-1;pi>=0;pi--){var paint=ss.paints[pi];
                for(var si=0;si<4;si++){var t=ss.weights[si];if(t<=0)continue;
                    var sideRect=ss.rectangles[si];
                    var group=r(2).addProperty('ADBE Vector Group');group.name='Side stroke '+si;
                    group.property('ADBE Vector Transform Group').property('ADBE Vector Scale').setValue([100*compMult,100*compMult]);
                    group.property('ADBE Vector Transform Group').property('ADBE Vector Rotation').setValue(layer.rotation);
                    var contents=group.property('ADBE Vectors Group');
                    var rect=contents.addProperty('ADBE Vector Shape - Rect');
                    rect.property('ADBE Vector Rect Size').setValue(sideRect.size);
                    rect.property('ADBE Vector Rect Position').setValue(sideRect.position);
                    var fill=contents.addProperty('ADBE Vector Graphic - Fill');
                    fill.property('ADBE Vector Fill Color').setValue(paint.color.slice(0,3));
                    fill.property('ADBE Vector Fill Opacity').setValue(paint.opacity);
                    group.enabled=paint.enabled;
                }
            }
        }`);
const rectEnd=host.indexOf('        return r;',rectStart);
assert(rectEnd>rectStart);
host=host.slice(0,rectEnd)+`        if(layer.sideStrokes){
            for(var sideIndex=r(2).numProperties;sideIndex>1;sideIndex--){
                // Move the final side group above the base fill. Repeatedly take
                // the last group so the base remains behind every side.
                r(2)(r(2).numProperties).moveTo(1);
            }
        }
`+host.slice(rectEnd);
const trackingMarker=".setValue(layer.trackingAdjusted);";
assert.equal(host.split(trackingMarker).length,2);
host=host.replace(trackingMarker,'.setValue(aeuxTrackingAnimatorPixels(layer.trackingAdjusted,layer.fontSize));');
host=typographySource+'\n'+host;
const textScale="            r('ADBE Transform Group')('ADBE Scale').setValue([layer.flip[0] * compMult, layer.flip[1] * compMult]);";
assert.equal(host.split(textScale).length,2);
host=host.replace(textScale,textScale+`
            if(layer.targetInkCenter){
                var ink=r.sourceRectAtTime(0,false);
                if(ink.width>0&&ink.height>0){
                    r('ADBE Transform Group')('ADBE Anchor Point').setValue([ink.left+ink.width/2,ink.top+ink.height/2]);
                    r('ADBE Transform Group')('ADBE Position').setValue([layer.targetInkCenter[0]*compMult,layer.targetInkCenter[1]*compMult]);
                }
            }`);
const collapse='            r.collapseTransformation = true;';
assert(host.includes(collapse));
host=host.replace(collapse,`            r.collapseTransformation = layer.clipsContent !== true;
            r('ADBE Transform Group')('ADBE Anchor Point').setValue([layer.frame.width*compMult/2,layer.frame.height*compMult/2]);`);
const start=host.indexOf('    function aeImage(layer, opt_parent) {');
const end=host.indexOf('    function ',start+20); // Next outer function after aeImage includes a nested function; use exact block marker instead.
const marker="        setMask(r, layer);\n        addDropShadow(r, layer);\n        addInnerShadow(r, layer);";
const pos=host.indexOf(marker,start);assert(pos>=start);
const override=`        if(layer.rasterTransform){
            var rt=layer.rasterTransform;
            r('ADBE Transform Group')('ADBE Anchor Point').setValue(rt.anchor);
            r('ADBE Transform Group')('ADBE Position').setValue([rt.position[0]*compMult,rt.position[1]*compMult]);
            r('ADBE Transform Group')('ADBE Scale').setValue([rt.scale[0]*compMult,rt.scale[1]*compMult]);
            r('ADBE Transform Group')('ADBE Rotate Z').setValue(rt.rotation);
        }\n`;
host=host.slice(0,pos)+host.slice(pos).replace(marker,marker+'\n'+override);
return host;
}
module.exports={patchAeHost};
