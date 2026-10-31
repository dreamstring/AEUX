// Preserve range styles before legacy serialization replaces mixed values with
// the first character. UTF-16 indices follow both Figma and JavaScript strings.
function aeuxCaptureTextSegments(node,record){
    if(node.type!=='TEXT'||typeof node.getStyledTextSegments!=='function')return;
    var runs=node.getStyledTextSegments(['fontSize','fontName','fills','letterSpacing','lineHeight']);
    record.aeuxTextStyleRuns=JSON.parse(JSON.stringify(runs));
    // The PSD range bridge supports exactly one opaque solid fill per run.
    // Preserve complex range paint appearance via this node's native PNG.
    if(runs.length>1&&runs.some(function(run){
        if(!run.fills)return false;
        var fills=run.fills.filter(function(p){return p.visible!==false;});
        return fills.length!==1||fills[0].type!=='SOLID'||(fills[0].opacity!==undefined&&fills[0].opacity!==1);
    })){
        record.rasterize=true;
        record.aeuxRasterReason='complex-text-range-paint';
    }
}
