'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.style={};}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  appendChild(n){this.children.push(n);return n;}
}
const document={createElementNS:(_,t)=>new Element(t),addEventListener(){},removeEventListener(){}};
const window={createFlorilegiumStyledLettering:()=>({update(){}})};
const runtime=vm.createContext({document,window,cancelAnimationFrame(){}});
for(const f of ['lid.js','styled-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/motion',f),'utf8'),runtime);
const walk=n=>[n,...n.children.flatMap(walk)];
function create(style){const mount=new Element('div');return window.createFlorilegiumStyledMotion(mount,{style});}
const flat=create('flat'),icons=walk(flat.svg).filter(n=>n.dataset.mediaIcon);
assert.deepEqual(icons.map(n=>n.dataset.mediaIcon),['play','video','microphone','bookmark','book','waveform','note']);
const visibleLayers=flat.svg.children.filter(n=>n.tagName!=='defs');
assert.equal(visibleLayers[0].dataset.layer,'media-background','every case surface occludes the decoration');
for(const p of [0,.455,.73,.745]){flat.seek(p);assert.ok(icons.every(n=>Number(n.attrs.opacity)===0),'no background appears before opening and contents settle');}
flat.seek(.81);const partial=icons.map(n=>Number(n.attrs.opacity));
assert.ok(partial.some(v=>v>0)&&partial.some(v=>v===0),'symbols appear with staggered timing');
flat.seek(1);assert.ok(icons.every(n=>Number(n.attrs.opacity)===.62));
const snapshot=()=>JSON.stringify(icons.map(n=>n.attrs));
const final=snapshot();flat.seek(0);assert.ok(icons.every(n=>Number(n.attrs.opacity)===0),'replay clears the decoration');flat.seek(1);assert.equal(snapshot(),final,'positions do not jump across replays');
for(const style of ['line','pencil'])assert.equal(walk(create(style).svg).filter(n=>n.dataset.mediaIcon).length,0,'other styles retain their original backgrounds');
console.log('PASS: seven solid symbols only in 02, rear layer, opening gate, stagger, static final state and deterministic replay.');
