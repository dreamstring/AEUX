'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync(require.resolve('../../packages/figma-export/rasterize-toggle.js'),'utf8');
let names=['Frame','* Text'],history=[],cursor=0;
const nodes=names.map((name)=>({name})),messages=[];
function snapshot(){return nodes.map(n=>n.name);}
const figma={currentPage:{selection:nodes},ui:{postMessage:m=>messages.push(m)},commitUndo(){const state=JSON.stringify(snapshot());if(history[cursor]!==state){history=history.slice(0,cursor+1);history.push(state);cursor=history.length-1;}}};
const context={figma};vm.createContext(context);vm.runInContext(code,context);
context.aeuxToggleRasterizeSelection();assert.deepEqual(snapshot(),['* Frame','* Text']);
context.aeuxToggleRasterizeSelection();assert.deepEqual(snapshot(),['Frame','Text']);
// Both operations have a separate undo checkpoint; restoring the checkpoint also
// restores the original mixed selection, including its pre-existing star.
cursor--;JSON.parse(history[cursor]).forEach((name,i)=>nodes[i].name=name);assert.deepEqual(snapshot(),['* Frame','* Text']);
cursor--;JSON.parse(history[cursor]).forEach((name,i)=>nodes[i].name=name);assert.deepEqual(snapshot(),names);
figma.currentPage.selection=[];const count=history.length;context.aeuxToggleRasterizeSelection();assert.equal(history.length,count);
assert.equal(messages.at(-1).action,'Select layers first');
const {patchRasterizeToggle}=require('../../scripts/rasterize-toggle.cjs');
const source=fs.readFileSync('build/templates/Figma__dist__code.js.template','utf8');
assert(patchRasterizeToggle(source).includes('aeuxToggleRasterizeSelection();'));
assert.throws(()=>patchRasterizeToggle('changed'),/handler changed/);
console.log('PASS: rasterize toggle, mixed selection, undo checkpoints, empty selection and build guard');
