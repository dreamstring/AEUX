'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const {extractZip,sha,files}=require('./archive.cjs');
const root=path.resolve(__dirname,'..');
function build(){const result=cp.spawnSync(process.execPath,[path.join(__dirname,'build.cjs'),'--verify'],{cwd:root,encoding:'utf8',timeout:120000});if(result.status!==0)throw Error(result.stderr||result.stdout);return JSON.parse(fs.readFileSync(path.join(root,'dist/latest.json'),'utf8'));}
const first=build(),second=build();
if(first.zipSha256!==second.zipSha256)throw Error('Two builds produced different archives');
const dir=fs.mkdtempSync(path.join(root,'dist/zip-verification-'));extractZip(second.zip,dir);
const tree=path.join(dir,'AEUX-1.0.2'),baseline=require('../tests/baseline/1.0.2.json');
const actual=files(tree);if(actual.length!==Object.keys(baseline.files).length)throw Error('Packaged file count mismatch');
for(const file of actual){const name=path.relative(tree,file).replaceAll('\\','/');if(sha(fs.readFileSync(file))!==baseline.files[name])throw Error('Archive roundtrip mismatch: '+name);}
console.log(JSON.stringify({reproducible:true,zipSha256:first.zipSha256,packagedFiles:actual.length,liveAppsUsed:false}));
