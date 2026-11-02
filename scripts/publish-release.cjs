'use strict';
// Run inside the release workflow, with its repository-scoped GH_TOKEN.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),os=require('os');
const root=path.resolve(__dirname,'..');
const request=require('../.github/release-request.json');
const version=require('../package.json').version;
if(request.version!==version||!/^\d+\.\d+\.\d+$/.test(version))throw Error('Release version mismatch');
if(!process.env.GITHUB_ACTIONS||!process.env.GH_REPO||!process.env.GITHUB_SHA)throw Error('Run through the GitHub release workflow');
function gh(args){return cp.execFileSync('gh',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});}
const built=require('../dist/latest.json'),tag='v'+version,name='AEUX-'+version+'.zip';
if(path.basename(built.zip)!==name)throw Error('Unexpected package');
const expected=crypto.createHash('sha256').update(fs.readFileSync(built.zip)).digest('hex');
const notes=path.join(os.tmpdir(),'aeux-release-'+process.env.GITHUB_RUN_ID+'.md');
fs.writeFileSync(notes,request.notes+'\n\nSource: '+process.env.GITHUB_SHA+'\n');
gh(['release','view',tag,'--json','id']); // Updating an existing release is intentional.
gh(['release','upload',tag,built.zip,'--clobber']);
const download=fs.mkdtempSync(path.join(os.tmpdir(),'aeux-download-'));
gh(['release','download',tag,'--pattern',name,'--dir',download]);
const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(download,name))).digest('hex');
if(actual!==expected)throw Error('Published asset checksum mismatch');
// Keep GitHub's automatic source archive paired with the revised release ZIP.
gh(['api','repos/'+process.env.GH_REPO+'/git/refs/tags/'+tag,'--method','PATCH','-f','sha='+process.env.GITHUB_SHA,'-F','force=true']);
gh(['release','edit',tag,'--title','AEUX '+version,'--notes-file',notes,'--latest']);
const report={version,asset:name,sha256:actual,source:process.env.GITHUB_SHA,verified:true};
console.log(JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'Published **'+name+'** and verified download SHA-256.\n\n`'+actual+'`\n');
