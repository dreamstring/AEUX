'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {makeZip,extractZip}=require('../../scripts/archive.cjs');
const root=path.resolve(__dirname,'../../dist');fs.mkdirSync(root,{recursive:true});
const temp=fs.mkdtempSync(path.join(root,'archive-test-')),input=path.join(temp,'safe');fs.mkdirSync(input);
fs.writeFileSync(path.join(input,'name.txt'),'roundtrip contents');
const zip=path.join(temp,'test.zip');makeZip(input,zip);extractZip(zip,path.join(temp,'roundtrip'));
assert.equal(fs.readFileSync(path.join(temp,'roundtrip/safe/name.txt'),'utf8'),'roundtrip contents');
const corrupt=fs.readFileSync(zip);corrupt[0]=0;const broken=path.join(temp,'broken.zip');fs.writeFileSync(broken,corrupt);
assert.throws(()=>extractZip(broken,path.join(temp,'broken-out')),/local ZIP header/);
const unsafe=Buffer.from(fs.readFileSync(zip));let index=0;while((index=unsafe.indexOf('safe/name.txt',index))!==-1){unsafe.write('../x/name.txt',index,'utf8');index+=13;}
const slip=path.join(temp,'unsafe.zip');fs.writeFileSync(slip,unsafe);
assert.throws(()=>extractZip(slip,path.join(temp,'unsafe-out')),/Unsafe ZIP path/);
assert(!fs.existsSync(path.join(temp,'x/name.txt')));
console.log('PASS: archive roundtrip, corrupt local header and path traversal checks');
