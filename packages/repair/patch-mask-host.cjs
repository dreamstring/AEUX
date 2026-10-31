// Paired mask host integration; preserve working CEP frontend separately.
const assert=require('assert');
const {patchAeHost}=require('./patch-ae-host.cjs');
const {patchMaskTypes}=require('./mask-type-candidate.cjs');
const {patchNativeClipPaths}=require('./native-path-candidate.cjs');
const {patchPaddedCompAnchor}=require('./mask-padding-candidate.cjs');
const {patchShadowCasterHost}=require('./shadow-caster-candidate.cjs');
function patchMaskAeHost(source,options){
 let host=patchShadowCasterHost(patchPaddedCompAnchor(patchNativeClipPaths(patchMaskTypes(patchAeHost(source,options)))));
 const marker="build:'0.1.4-background-v1'";assert.equal(host.split(marker).length,2);
 return host.replace(marker,"build:'0.1.8-mask-scope-v1',maskScopeContract:'composite-v1',shadowContract:'opaque-caster-v1'");
}
module.exports={patchMaskAeHost};
