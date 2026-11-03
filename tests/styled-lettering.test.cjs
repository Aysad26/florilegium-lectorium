'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};}
  setAttribute(name,value){this.attrs[name]=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  appendChild(node){this.children.push(node);return node;}
}
const window={};
const runtime=vm.createContext({window,document:{createElementNS:(_,tag)=>new Element(tag)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/motion/styled-lettering.js'),'utf8'),runtime);
const walk=node=>[node,...node.children.flatMap(walk)];
const layers=(node,key,value)=>walk(node).filter(n=>n.dataset[key]===value);
function create(style,effect){const defs=new Element('defs'),svg=new Element('svg');const lettering=window.createFlorilegiumStyledLettering(defs,svg,'test-'+style+'-'+effect,{style,effect});return{defs,svg,...lettering};}
const letters=root=>walk(root).filter(n=>n.dataset.letterIndex!==undefined);
const shine=root=>layers(root,'layer','lettering-shine')[0].children[0];
function sample(scene,p){scene.update(p);return JSON.stringify({root:scene.group.dataset,letters:letters(scene.group).map(n=>({attrs:n.attrs,dataset:n.dataset})),shine:shine(scene.group)?.attrs});}

const reveal=create('flat','reveal');
assert.equal(letters(reveal.group).length,5);
assert.equal(reveal.group.dataset.visibleLetters,'0');
reveal.update(.741);assert.equal(reveal.group.dataset.visibleLetters,'0','word stays absent until contents finish rising');
reveal.update(.752);assert.equal(reveal.group.dataset.visibleLetters,'1','first glyph enters before the next glyph');
reveal.update(.862);assert.equal(reveal.group.dataset.visibleLetters,'5');
assert.ok(letters(reveal.group).every(n=>n.getAttribute('opacity')==='1'));
reveal.update(0);assert.equal(reveal.group.dataset.visibleLetters,'0','rewind clears every letter');
assert.ok(walk(reveal.group).filter(n=>n.tagName==='path').every(n=>n.attrs.fill==='#064ed9'));

const sheen=create('pencil','sheen');
assert.equal(sheen.group.dataset.sweepX,'290.000');
assert.equal(shine(sheen.group).getAttribute('opacity'),'0');
assert.equal(layers(sheen.group,'layer','lettering-base')[0].children.length,5,'initial lettering remains present');
sheen.update(.85);assert.ok(Number(shine(sheen.group).getAttribute('opacity'))>0);
assert.ok(Number(sheen.group.dataset.sweepX)>375&&Number(sheen.group.dataset.sweepX)<900);
sheen.update(1);assert.equal(sheen.group.dataset.sweepX,'970.000');assert.equal(shine(sheen.group).getAttribute('opacity'),'0');
const noise=walk(sheen.defs).find(n=>n.tagName==='feTurbulence');assert.equal(noise.getAttribute('seed'),'19');
const noiseBefore=JSON.stringify(noise.attrs);sheen.update(.3);sheen.update(.9);assert.equal(JSON.stringify(noise.attrs),noiseBefore,'paper grain is fixed across all progress values');
assert.equal(walk(sheen.defs).filter(n=>/^(animate|set)/i.test(n.tagName)).length,0);

const wave=create('line','wave'),glyphs=letters(wave.group);
assert.equal(glyphs.length,5);
const flatPaths=letters(reveal.group).map(n=>n.children[0]);
const linePaths=glyphs.map(n=>n.children[0]);
for(let i=0;i<5;i++){
  for(const attr of ['d','transform','stroke-width','stroke-linejoin','paint-order'])assert.equal(flatPaths[i].getAttribute(attr),linePaths[i].getAttribute(attr),'02 uses exactly the same font geometry and weight as 04');
}
for(const p of [0,.2,.741]){wave.update(p);assert.ok(glyphs.every(n=>n.dataset.scale==='1.00000'),'no letter pulse before opening');assert.equal(shine(wave.group).getAttribute('opacity'),'0');}
wave.update(.787);assert.equal(glyphs[0].dataset.scale,'1.16000');assert.equal(glyphs[4].dataset.scale,'1.00000','pulse must travel left-to-right');
for(let p=0;p<=1;p+=.002){
  wave.update(p);
  glyphs.forEach((g,i)=>{
    assert.ok(Number(g.dataset.scale)>=1&&Number(g.dataset.scale)<=1.16);
    const clip=walk(wave.defs).find(n=>n.dataset.letterClipIndex===String(i));
    assert.equal(clip.tagName,'path','Chrome clipPath contains direct glyph geometry, not nested groups');
    assert.equal(clip.getAttribute('transform'),g.getAttribute('transform')+' '+g.children[0].getAttribute('transform'),'direct clip composes pulse and base glyph transforms');
  });
}
const waveClip=walk(wave.defs).find(n=>n.getAttribute('id')==='test-line-wave-wave-word-clip');
assert.equal(waveClip.children.length,5);assert.ok(waveClip.children.every(n=>n.tagName==='path'),'all five clipping glyphs are direct clipPath children');
wave.update(.905);assert.ok(glyphs.every(n=>n.dataset.scale==='1.00000'));
assert.equal(shine(wave.group).getAttribute('opacity'),'0','the closing swipe waits for the last letter pulse to settle');
wave.update(.950);assert.ok(Number(shine(wave.group).getAttribute('opacity'))>.9,'the diagonal swipe is visible at the end');
assert.equal(wave.group.dataset.waveActive,'false');assert.equal(wave.group.dataset.swipeActive,'true');
const diagonal=walk(wave.defs).find(n=>n.getAttribute('id')==='test-line-wave-wave-swipe');
assert.notEqual(diagonal.getAttribute('y1'),diagonal.getAttribute('y2'),'the highlight ridge itself is diagonal');
const sweepStart=(()=>{wave.update(.92);return Number(wave.group.dataset.sweepX)})();
wave.update(.975);assert.ok(Number(wave.group.dataset.sweepX)>sweepStart,'swipe travels left to right');
wave.update(1);assert.equal(shine(wave.group).getAttribute('opacity'),'0');assert.equal(wave.group.dataset.waveActive,'false');assert.equal(wave.group.dataset.swipeActive,'false');
const first=sample(wave,.81);sample(wave,.9);sample(wave,.1);assert.equal(sample(wave,.81),first,'scrubbing is deterministic without independent timers');
for(const p of [0,.77,.82,.9,1]){wave.update(p);for(const n of walk(wave.group).filter(n=>n.dataset.glyph))assert.equal(n.getAttribute('fill'),'#164c8b','base letters keep one color before/after the transient white highlight');}
console.log('PASS: matching 02/04 serif geometry, reveal timing/rewind, persistent pencil lettering and fixed grain, sheen bounds, 584ms wave/stagger, synchronized moving clips, end-only diagonal swipe, stable blue and deterministic seek.');
