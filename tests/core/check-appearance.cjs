const fs=require('fs'),vm=require('vm'),assert=require('assert');
const fn=vm.runInNewContext(fs.readFileSync(__dirname+'/../../packages/core/appearance.js','utf8')+';aeuxOpacityPercent');
assert.strictEqual(fn(0),0);assert.strictEqual(fn(.5),50);assert.strictEqual(fn(1),100);
assert.strictEqual(fn(undefined),100);assert.strictEqual(fn(NaN),100);
const blur=vm.runInNewContext(fs.readFileSync(__dirname+'/../../packages/core/appearance.js','utf8')+';aeuxLayerBlurAmount');
for(const r of [0,8,32,128,800])assert.strictEqual(blur(r),r*1.5);
assert.throws(()=>blur(-1));assert.throws(()=>blur(NaN));
console.log('PASS: appearance contracts');
