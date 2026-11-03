'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.style={};}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  appendChild(n){this.children.push(n);n.parentNode=this;return n;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
}
const walk=n=>[n,...n.children.flatMap(walk)];
function setup(style='flat',reducedInitially=false){
  let now=1000,nextId=0,completed=0;
  const frames=new Map(),visibility=new Set(),preferenceListeners=new Set();
  const document={hidden:false,createElementNS:(_,t)=>new Element(t),addEventListener(name,fn){if(name==='visibilitychange')visibility.add(fn);},removeEventListener(name,fn){if(name==='visibilitychange')visibility.delete(fn);}};
  const preference={matches:reducedInitially,addEventListener(name,fn){if(name==='change')preferenceListeners.add(fn);},removeEventListener(name,fn){if(name==='change')preferenceListeners.delete(fn);}};
  const window={matchMedia:()=>preference};
  const runtime=vm.createContext({document,window,performance:{now:()=>now},requestAnimationFrame(fn){const id=++nextId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}});
  for(const file of ['lid.js','styled-lettering.js','styled-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/motion',file),'utf8'),runtime);
  const mount=new Element('div'),scene=window.createFlorilegiumStyledMotion(mount,{style,onComplete(){completed++;}});
  const nodes=walk(scene.svg),icons=nodes.filter(n=>n.dataset.mediaIcon);
  return{scene,mount,icons,frames,visibility,preferenceListeners,get completed(){return completed;},get now(){return now;},advance(ms){now+=ms;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);},hidden(value){document.hidden=value;for(const fn of visibility)fn();},reduced(value){preference.matches=value;for(const fn of preferenceListeners)fn();}};
}
const positions=s=>s.icons.map(n=>n.attrs.transform.match(/translate\(([^ ]+) ([^)]+)\)/).slice(1).map(Number));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const transforms=s=>s.icons.map(n=>n.attrs.transform);
const stableArt=s=>JSON.stringify(walk(s.scene.svg).filter(n=>['lid','contents','front-shell','lettering'].includes(n.dataset.layer)).map(n=>walk(n).map(v=>({attrs:v.attrs,dataset:v.dataset}))));
function finish(s){s.scene.play();s.advance(0);s.advance(Number(s.scene.svg.dataset.duration));assert.equal(s.scene.getProgress(),1);}
const s=setup();finish(s);
assert.equal(s.completed,1);
assert.equal(s.scene.svg.dataset.playing,'false','the main animation finishes normally');
assert.equal(s.scene.svg.dataset.orbiting,'true','the flat background continues independently');
assert.equal(s.frames.size,1,'there is exactly one continuing animation frame');
const art=stableArt(s),endPositions=positions(s);
s.advance(5000);
assert.notDeepEqual(positions(s),endPositions,'the icons continue moving after the opening has finished');
assert.ok(positions(s).every((p,i)=>distance(p,endPositions[i])>1&&distance(p,endPositions[i])<400),'the ongoing travel is slow and continuous');
assert.equal(stableArt(s),art,'the idle loop does not replay or repaint lid, flowers or lettering');
assert.equal(s.completed,1,'ambient frames do not repeat the main completion callback');
assert.ok(Number(s.scene.svg.dataset.ambientElapsed)>=5000);
const beforeCycle=positions(s);s.advance(120000);
assert.ok(positions(s).every((p,i)=>distance(p,beforeCycle[i])<1),'the path closes without a positional reset at the loop boundary');
const beforeNext=positions(s);s.advance(16);
assert.ok(positions(s).every((p,i)=>distance(p,beforeNext[i])<3),'crossing the loop boundary does not jump');
assert.equal(stableArt(s),art);assert.equal(s.completed,1);assert.equal(s.frames.size,1);
s.scene.pause();assert.equal(s.frames.size,0,'an explicit pause stops the ambient loop');
s.scene.play();assert.equal(s.scene.getProgress(),0,'replay begins with the original entrance');assert.ok(s.icons.every(n=>Number(n.attrs.opacity)===0));
s.scene.play();assert.equal(s.frames.size,1,'repeat play calls never accumulate frame callbacks');
s.scene.seek(1);assert.equal(s.frames.size,0);const sought=transforms(s);s.scene.seek(0);s.scene.seek(1);assert.deepEqual(transforms(s),sought,'seeking is deterministic regardless of the previous ambient time');
s.hidden(true);s.scene.seek(1);s.hidden(false);assert.equal(s.frames.size,0,'an explicit seek while hidden does not resume ambient motion on return');
const h=setup();finish(h);h.advance(5000);const hiddenPositions=positions(h),hiddenTime=Number(h.scene.svg.dataset.ambientElapsed);
h.hidden(true);assert.equal(h.frames.size,0,'background tabs stop requesting ambient frames');
h.advance(120000);assert.deepEqual(positions(h),hiddenPositions);
h.hidden(false);assert.equal(h.frames.size,1,'returning to the tab resumes the ambient motion');h.advance(16);
assert.ok(positions(h).every((p,i)=>distance(p,hiddenPositions[i])<3),'time spent hidden does not cause a jump on return');
assert.ok(Number(h.scene.svg.dataset.ambientElapsed)<=hiddenTime+20);assert.equal(h.completed,1,'returning to the tab does not replay the main opening');
h.reduced(true);assert.equal(h.frames.size,0,'reduced-motion preference stops the infinite animation');h.advance(5000);const reducedPositions=positions(h);h.advance(5000);assert.deepEqual(positions(h),reducedPositions);
h.reduced(false);assert.equal(h.frames.size,1,'disabling reduced motion restores the ambient loop');
h.scene.destroy();assert.equal(h.frames.size,0);assert.equal(h.visibility.size,0);assert.equal(h.preferenceListeners.size,0);assert.equal(h.mount.children.length,0,'destroy removes its visual scene and listeners');
const reduced=setup('flat',true);reduced.scene.seek(1);assert.equal(reduced.frames.size,0,'the accessibility final-state path remains completely static');
for(const style of ['line','pencil']){const other=setup(style);finish(other);assert.equal(other.completed,1);assert.equal(other.frames.size,0,'only variant 02 gets an infinite loop');}
console.log('PASS: slow continuous 02 orbits preserve the completed illustration, close their path, and handle replay, pause, visibility, reduced motion and destruction without extra RAFs.');
