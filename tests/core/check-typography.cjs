const fs=require('fs'),vm=require('vm'),assert=require('assert');
const fn=vm.runInNewContext(fs.readFileSync(__dirname+'/../../packages/core/typography.js','utf8')+';aeuxTrackingToAe');
const animator=vm.runInNewContext(fs.readFileSync(__dirname+'/../../packages/core/typography.js','utf8')+';aeuxTrackingAnimatorPixels');
assert.strictEqual(animator(2000,28),56);
assert.strictEqual(animator(1000,28),28);
for(const size of [16,28,32,64])for(const value of [-2000,-1000,0,1000,2000])
 assert(Math.abs(animator(value,size)-value/1000*size)<1e-10);
for(const size of [12,16,32,64,120])for(const px of [-2,0,1,2,8]){
 const ae=fn({unit:'PIXELS',value:px},size);assert(Math.abs(ae/1000*size-px)<1e-10);
}
assert.strictEqual(fn({unit:'PERCENT',value:5},32),50);
assert.strictEqual(fn({unit:'PIXELS',value:1},0),0);
assert.strictEqual(fn(null,32),0);
console.log('PASS: typography contracts');
