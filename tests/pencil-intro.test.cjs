'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.style={};}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  appendChild(n){this.children.push(n);n.parentNode=this;return n;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
}
const walk=n=>[n,...n.children.flatMap(walk)];
function setup(style='pencil'){
  let now=1000,nextId=0,completed=0;
  const frames=new Map(),events={};
  const document={hidden:false,createElementNS:(_,t)=>new Element(t),addEventListener(n,fn){events[n]=fn;},removeEventListener(n){delete events[n];}};
  const window={};
  const runtime=vm.createContext({document,window,performance:{now:()=>now},requestAnimationFrame(fn){const id=++nextId;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}});
  for(const name of ['lid.js','styled-lettering.js','styled-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/motion',name),'utf8'),runtime);
  const scene=window.createFlorilegiumStyledMotion(new Element('div'),{style,onComplete(){completed++;}});
  return{scene,document,events,frames,get completed(){return completed;},frame(at){now=at;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);}};
}
const s=setup(),nodes=walk(s.scene.svg),find=layer=>nodes.find(n=>n.dataset.layer===layer);
const mask=find('pencil-draw-mask'),art=find('pencil-artwork'),bloom=find('bouquet-and-earbuds'),word=find('lettering');
assert.ok(mask&&art,'the pencil drawing owns one reveal mask around its complete artwork');
assert.equal(art.attrs.mask,`url(#${mask.attrs.id})`);
const strokes=walk(mask).filter(n=>Object.hasOwn(n.dataset,'drawStroke'));
const full=walk(mask).find(n=>n.tagName==='rect'&&n.attrs.fill==='white');
assert.ok(strokes.length>=3,'several brush strokes draw the artwork instead of one overall opacity fade');
assert.ok(full,'the completed drawing has an explicit full-coverage state');
const drawDuration=1400,motionDuration=884,duration=drawDuration+motionDuration;
assert.equal(Number(s.scene.svg.dataset.duration),duration);
const seekTime=milliseconds=>s.scene.seek(milliseconds/duration);
const seekMotion=progress=>seekTime(drawDuration+motionDuration*progress);
const snapshot=()=>JSON.stringify(nodes.map(n=>({attrs:n.attrs,data:n.dataset})));
function assertBlank(){
  assert.equal(art.attrs.mask,`url(#${mask.attrs.id})`,'replay restores the drawing mask');
  assert.equal(Number(full.attrs.opacity),0);
  assert.ok(strokes.every(n=>Number(n.attrs['stroke-dashoffset'])>=Number(n.attrs.pathLength||1)),'all drawing strokes are hidden at the beginning');
  assert.equal(Number(s.scene.svg.dataset.drawProgress),0);
  assert.equal(Number(s.scene.svg.dataset.lidOpen),0);
  assert.equal(Number(bloom.attrs.opacity),0);
}
s.scene.seek(0);assertBlank();
const blank=snapshot();
seekTime(700);
assert.equal(s.scene.svg.dataset.phase,'drawing');
assert.ok(Number(s.scene.svg.dataset.drawProgress)>0&&Number(s.scene.svg.dataset.drawProgress)<1);
assert.ok(strokes.some(n=>Number(n.attrs['stroke-dashoffset'])<Number(n.attrs.pathLength||1)),'paint is progressively revealed during the intro');
assert.equal(Number(full.attrs.opacity),0,'the brush effect is not bypassed halfway through');
assert.equal(Number(s.scene.svg.dataset.lidOpen),0,'the case stays closed until the drawing is complete');
assert.equal(Number(bloom.attrs.opacity),0,'flowers cannot emerge while the case is being drawn');
assert.equal(Number(word.dataset.activation),0,'the lettering highlight waits until the opening');
const partial=snapshot();
seekTime(1399);
assert.equal(s.scene.svg.dataset.phase,'drawing','drawing lasts the full requested 1400ms');
assert.ok(Number(s.scene.svg.dataset.drawProgress)<1);
assert.equal(Number(s.scene.svg.dataset.lidOpen),0);
assert.equal(Number(bloom.attrs.opacity),0);
assert.equal(Number(full.attrs.opacity),0);
seekTime(1400);
assert.equal(Number(s.scene.svg.dataset.drawProgress),1);
assert.equal(Number(full.attrs.opacity),1,'the mask fully covers the future moving lid before opening begins');
assert.equal(art.attrs.mask,'none','the fully drawn artwork no longer needs mask compositing');
assert.equal(Number(s.scene.svg.dataset.lidOpen),0);
seekTime(1401);assert.ok(Number(s.scene.svg.dataset.lidOpen)>0,'opening begins immediately after the last drawing stroke');
for(const [elapsed,expected] of [[0,0],[221,.25],[442,.5],[663,.75],[884,1]]){
  seekTime(drawDuration+elapsed);
  assert.equal(Number(s.scene.svg.dataset.motionProgress),expected,'the previously approved 884ms opening timeline keeps its relative timing');
}
seekMotion(.8);assert.equal(Number(s.scene.svg.dataset.lidOpen),1);assert.equal(Number(bloom.attrs.opacity),1);
seekMotion(.85);assert.ok(Number(word.dataset.activation)>0&&Number(word.dataset.activation)<1,'the existing pencil lettering effect retains its opening-relative phase');
s.scene.seek(1);
assert.equal(Number(s.scene.svg.dataset.motionProgress),1);
assert.equal(Number(full.attrs.opacity),1);
assert.equal(Number(word.dataset.activation),1);
assert.equal(s.scene.svg.dataset.phase,'open');
assert.ok(!art.attrs.opacity||Number(art.attrs.opacity)===1,'the complete artwork does not use a whole-object fade');
const final=snapshot();
s.scene.seek(0);assertBlank();assert.equal(snapshot(),blank,'rewinding clears both the mask and the animation');
seekTime(700);assert.equal(snapshot(),partial,'seeking through the paint strokes is deterministic');
s.scene.seek(1);assert.equal(snapshot(),final,'a reduced-motion seek to the end displays the full finished illustration');
s.scene.seek(0);s.scene.play();s.frame(1000);
s.frame(2399);assert.equal(Number(s.scene.svg.dataset.lidOpen),0);assert.equal(s.scene.svg.dataset.phase,'drawing');
s.frame(2400);assert.equal(Number(s.scene.svg.dataset.drawProgress),1);assert.equal(Number(s.scene.svg.dataset.lidOpen),0);
s.frame(2401);assert.ok(Number(s.scene.svg.dataset.lidOpen)>0);
s.frame(3283);assert.equal(s.completed,0,'the complete timeline has not ended a millisecond early');
s.frame(3284);assert.equal(s.completed,1,'the full sequence includes 1400ms of drawing and the unchanged 884ms opening');
assert.equal(s.scene.getProgress(),1);assert.equal(s.frames.size,0);
s.scene.play();assert.equal(s.scene.getProgress(),0,'replay starts with the drawing again');s.frame(3500);s.frame(5568);assert.equal(s.completed,2);
const delayed=setup();delayed.scene.play();delayed.frame(1250);
assert.ok(Math.abs(delayed.scene.getProgress()-250/duration)<1e-9,'a delayed first frame still counts time since play()');
delayed.frame(3284);assert.equal(delayed.completed,1,'first-frame latency cannot extend the complete duration');
assert.equal(delayed.frames.size,0,'the pencil variant schedules no ambient frames after completion');
delayed.frame(6000);assert.equal(delayed.completed,1);assert.equal(delayed.scene.getProgress(),1);
delayed.document.hidden=true;delayed.events.visibilitychange();
delayed.document.hidden=false;delayed.events.visibilitychange();
assert.equal(delayed.frames.size,0,'returning to the finished pencil variant does not start the flat icon loop');
for(const style of ['flat','line']){
  const other=setup(style);assert.equal(Number(other.scene.svg.dataset.duration),3600,'the other variants retain their approved timing');
  assert.ok(!walk(other.scene.svg).some(n=>n.dataset.layer==='pencil-draw-mask'),'no drawing effect is applied to the other styles');
}
console.log('PASS: pencil drawing lasts 1400ms with the case closed; the unchanged 884ms opening follows immediately; full duration, seek, replay, final-state accessibility and other styles are preserved.');
