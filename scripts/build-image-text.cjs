'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),vm=require('vm');
const {files,sha,makeZip}=require('./archive.cjs');
const {patchImageTextUi,patchImageTextCode,patchImageTextHost}=require('./image-text-feature.cjs');
const root=path.resolve(__dirname,'..');
const built=cp.spawnSync(process.execPath,[path.join(__dirname,'build.cjs'),'--verify','--frozen'],{cwd:root,encoding:'utf8',timeout:120000});
if(built.status!==0)throw Error(built.stderr||built.stdout);
const baseline=JSON.parse(fs.readFileSync(path.join(root,'dist/latest.json'),'utf8'));
const run=fs.mkdtempSync(path.join(root,'dist/image-text-')),tree=path.join(run,'AEUX-image-text-preview');fs.cpSync(baseline.tree,tree,{recursive:true});
for(const file of ['Figma/dist/ui.js','Figma/dist/ui.html']){const p=path.join(tree,file);let text=patchImageTextUi(fs.readFileSync(p,'utf8'));if(file.endsWith('.html'))text+='\n<script>'+fs.readFileSync(path.join(root,'packages/figma-export/image-text-preflight.js'),'utf8')+'</script>';fs.writeFileSync(p,text);}
let p=path.join(tree,'Figma/dist/code.js');let text=patchImageTextCode(fs.readFileSync(p,'utf8'));new vm.Script(text);fs.writeFileSync(p,text);
p=path.join(tree,'CEP/AEUX/src/host/AEFT/host.jsx');fs.writeFileSync(p,patchImageTextHost(fs.readFileSync(p,'utf8')));
p=path.join(tree,'Figma/manifest.json');let manifest=JSON.parse(fs.readFileSync(p));manifest.name='AEUX Image Text Preview';manifest.id='179310760900006';fs.writeFileSync(p,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(tree,'IMAGE-TEXT-PREVIEW.md'),'Editable single-image-filled text preview. Text supplies the Alpha matte; only the texture plane is rasterized. Uniform text style, one image fill, no visible strokes or effects. Unsupported appearances retain the original fallback. The current texture plane covers the original text frame; automatic infinite expansion is not implemented. Install the paired CEP before using the Figma preview. Original 1.0.2 build remains frozen.\n');
const listing=files(tree).filter(f=>path.basename(f)!=='FILES.sha256');fs.writeFileSync(path.join(tree,'FILES.sha256'),listing.map(f=>sha(fs.readFileSync(f))+'  '+path.relative(tree,f).replaceAll('\\','/')).join('\n')+'\n');
const zip=path.join(run,'AEUX-image-text-preview.zip');makeZip(tree,zip);
fs.writeFileSync(path.join(root,'dist/image-text-latest.json'),JSON.stringify({tree,zip,contract:'image-text-v1',baseline:'1.0.2'},null,2)+'\n');console.log(JSON.stringify({tree,zip}));
