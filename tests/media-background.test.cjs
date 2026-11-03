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
const position=n=>n.attrs.transform.match(/translate\(([^ ]+) ([^)]+)\)/).slice(1).map(Number);
const scale=n=>Number(n.attrs.transform.match(/scale\(([^)]+)\)/)[1]);
for(const p of [0,.04,.055]){flat.seek(p);assert.ok(icons.every(n=>Number(n.attrs.opacity)===0),'symbols are absent before the lid starts');}
const origins=icons.map(position),initialScales=icons.map(scale);
assert.ok(origins.every(([x,y])=>x>400&&x<850&&y>=700&&y<=950),'all symbols begin behind the opaque case body');
flat.seek(.07);const partial=icons.map(n=>Number(n.attrs.opacity));
assert.ok(partial.some(v=>v>0)&&partial.some(v=>v===0),'flight starts with the lid, with a small stagger');
assert.notDeepEqual(position(icons[0]),origins[0],'icons travel out instead of fading at their final coordinates');
flat.seek(.3);assert.ok(icons.every((n,i)=>scale(n)>initialScales[i]),'all icons enlarge during opening');
flat.seek(.57);const settled=icons.map(n=>n.attrs.transform);
assert.ok(icons.every((n,i)=>scale(n)>initialScales[i]*5),'new larger symbols reach their full size');
flat.seek(1);assert.ok(icons.every(n=>Number(n.attrs.opacity)===.62));
assert.deepEqual(icons.map(n=>n.attrs.transform),settled,'decoration settles without perpetual movement');
const snapshot=()=>JSON.stringify(icons.map(n=>n.attrs));
const final=snapshot();flat.seek(0);assert.ok(icons.every(n=>Number(n.attrs.opacity)===0),'replay clears the decoration');flat.seek(1);assert.equal(snapshot(),final,'positions do not jump across replays');
for(const style of ['line','pencil'])assert.equal(walk(create(style).svg).filter(n=>n.dataset.mediaIcon).length,0,'other styles retain their original backgrounds');
console.log('PASS: seven larger symbols only in 02, rear layer, hidden origins, flight/scale with lid opening, stagger, static final state and deterministic replay.');
