'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const {sha,files,extractZip,makeZip}=require('./archive.cjs');
const root=path.resolve(__dirname,'..'), baseline=require('../tests/baseline/1.0.2.json');
const version=require('../package.json').version;
// A unique owned directory avoids deleting any pre-existing output or user files.
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
const run=fs.mkdtempSync(path.join(root,'dist/build-'));
const archive=path.join(root,'vendor/aeux-1.0.2-runtime.zip');
if(sha(fs.readFileSync(archive))!==baseline.archiveSha256)throw Error('Frozen dependency checksum mismatch');
extractZip(archive,run);
const tree=path.join(run,'AEUX-1.0.2');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const norm=s=>s.replaceAll('\r\n','\n');
const maskFunctions={...require('../packages/repair/mask-type-candidate.cjs'),...require('../packages/repair/mask-scope-candidate.cjs'),...require('../packages/repair/native-path-candidate.cjs'),...require('../packages/repair/mask-padding-candidate.cjs'),...require('../packages/repair/shadow-caster-candidate.cjs')};
const generated=[];
for(const rule of require('../build/templates.json')){
  let output=read(rule.template);
  for(const slot of rule.slots){
    let source;
    if(slot.function)source=norm(maskFunctions[slot.function].toString());
    else {
      source=read(slot.source);
      if(slot.transform==='container')source=source.slice(0,source.indexOf("\nif(typeof module"));
      if(slot.transform==='enrich')source=source.slice(source.indexOf('function enrichProtocol')).replace('module.exports={enrichProtocol};','');
      if(slot.transform==='status')source=source.replace('0.1.7 · 就绪','就绪');
      if(slot.eol==='lf')source=norm(source);
      else if(slot.eol==='crlf')source=norm(source).replaceAll('\n','\r\n');
    }
    if(output.split(slot.marker).length!==2)throw Error('Invalid template slot '+slot.marker);
    output=output.replace(slot.marker,()=>source);
  }
  // Restore the frozen file's mixed newline convention when line counts match.
  // Source edits which add/remove lines use LF instead; never change semantics.
  output=norm(output);
  const lines=output.split('\n');
  if(lines.length-1===rule.endings.length)output=lines.map((line,i)=>line+(i<rule.endings.length?(rule.endings[i]?'\r\n':'\n'):'')).join('');
  if(output.includes('/*@@AEUX_'))throw Error('Unresolved build slot');
  fs.writeFileSync(path.join(tree,rule.output),output);generated.push(rule.output);
}
const {patchMaskAeHost}=require('../packages/repair/patch-mask-host.cjs');
const host=patchMaskAeHost(read('build/inputs/upstream-host.jsx'),{typographySource:read('packages/core/typography.js'),richTextSource:read('packages/repair/ae-rich-text.jsx')})
 .replace("build:'0.1.8-mask-scope-v1'","build:'1.0.2',baseline:'0.1.8-mask-scope-v1'");
const hostPath='CEP/AEUX/src/host/AEFT/host.jsx';fs.writeFileSync(path.join(tree,hostPath),host);generated.push(hostPath);
for(const [source,output] of [
 ['cep-startup.js','dist/aeux-fix-startup.js'],
 ['cep-build-interceptor.cjs','dist/alignment/cep-build-interceptor.cjs'],
 ['prepare-styled-text.cjs','dist/alignment/prepare-styled-text.cjs'],
 ['psd-text-document.cjs','dist/alignment/psd-text-document.cjs']
]){const destination='CEP/AEUX/'+output;fs.copyFileSync(path.join(root,'packages/cep',source),path.join(tree,destination));generated.push(destination);}
for(const name of ['Figma/dist/ui.js','Figma/dist/code.js','CEP/AEUX/dist/js/app.aeux-pp3.js'])new vm.Script(fs.readFileSync(path.join(tree,name),'utf8'),{filename:name});
const actual={};for(const f of files(tree))actual[path.relative(tree,f).replaceAll('\\','/')]=sha(fs.readFileSync(f));
const changed=Object.keys(baseline.files).filter(f=>actual[f]!==baseline.files[f]);
const extra=Object.keys(actual).filter(f=>!baseline.files[f]);
const report={version,baseline:'1.0.2',generated,matched:Object.keys(actual).length-changed.length,files:Object.keys(actual).length,changed,extra,byteIdentical:changed.length===0&&extra.length===0,liveAppsUsed:false};
fs.writeFileSync(path.join(run,'verification.json'),JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--verify')&&!report.byteIdentical)throw Error('Baseline mismatch: '+changed.join(', ')+'; extra: '+extra.join(', ')+'; report '+path.join(run,'verification.json'));
let releaseTree=tree;
if(!process.argv.includes('--frozen')){
 const {patchImageTextUi,patchImageTextCode,patchImageTextHost}=require('./image-text-feature.cjs');
 for(const name of ['Figma/dist/ui.js','Figma/dist/ui.html']){
  const p=path.join(tree,name);let source=patchImageTextUi(fs.readFileSync(p,'utf8'));
  if(name.endsWith('.html'))source+='\n<script>'+read('packages/figma-export/image-text-preflight.js')+'</script>';
  fs.writeFileSync(p,source);
 }
 const code=path.join(tree,'Figma/dist/code.js');fs.writeFileSync(code,patchImageTextCode(fs.readFileSync(code,'utf8')));
 const hostFile=path.join(tree,hostPath);fs.writeFileSync(hostFile,patchImageTextHost(fs.readFileSync(hostFile,'utf8')));
 // Update runtime identity and paired package metadata without touching the frozen dependency.
 for(const file of files(tree)){
  if(/\.(?:js|jsx|html|json|xml|md|txt)$/i.test(file)){
   const source=fs.readFileSync(file,'utf8');if(source.includes('1.0.2'))fs.writeFileSync(file,source.replaceAll('1.0.2',version));
  }
 }
 releaseTree=path.join(run,'AEUX-'+version);if(releaseTree!==tree)fs.renameSync(tree,releaseTree);
 for(const name of ['Figma/dist/ui.js','Figma/dist/code.js','CEP/AEUX/dist/js/app.aeux-pp3.js'])new vm.Script(fs.readFileSync(path.join(releaseTree,name),'utf8'),{filename:name});
 report.features=['image-text-v1'];report.byteIdentical=false;
 fs.copyFileSync(path.join(root,'README.md'),path.join(releaseTree,'README.md'));
 const checksums=files(releaseTree).filter(file=>path.basename(file)!=='FILES.sha256');
 fs.writeFileSync(path.join(releaseTree,'FILES.sha256'),checksums.map(file=>sha(fs.readFileSync(file))+'  '+path.relative(releaseTree,file).replaceAll('\\','/')).join('\n')+'\n');
}
const zip=path.join(run,'AEUX-'+(process.argv.includes('--frozen')?'1.0.2':version)+'.zip');makeZip(releaseTree,zip);report.zipSha256=sha(fs.readFileSync(zip));
fs.writeFileSync(path.join(run,'verification.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/latest.json'),JSON.stringify({directory:run,tree:releaseTree,zip,...report},null,2)+'\n');
console.log(JSON.stringify({output:zip,files:report.files,generated:generated.length,byteIdentical:report.byteIdentical,zipSha256:report.zipSha256}));
