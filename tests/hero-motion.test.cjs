'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'dist/hero-motion.js'),'utf8');
const preloaderSource=fs.readFileSync(path.join(root,'dist/preloader.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
function eventTarget(extra={}){
  const events={};
  return Object.assign(extra,{addEventListener(type,fn){(events[type]??=[]).push(fn)},dispatch(type,event={}){for(const fn of events[type]||[])fn(event)}});
}
function setup({reduced=false,fine=true,hidden=false,failed=false,withoutHero=false}={}){
  const fallback={hidden:false},overlay={hidden:false},images=[],created=[],fonts=deferred();
  let now=0,nextTimer=0;const timers=new Map();
  const clock={
    setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,at:now+ms});return id},
    clearTimeout(id){timers.delete(id)},
    async advance(ms){const end=now+ms;let next;while((next=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0])){now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();await flush();}now=end;await flush();await flush();},
    now:()=>now
  };
  const container=eventTarget({dataset:{},children:[],querySelector:()=>fallback,appendChild(n){this.children.push(n)}});
  const doc=eventTarget({hidden,readyState:'loading',documentElement:{dataset:{}},fonts:{ready:fonts.promise},querySelector:q=>q==='#page-preloader'?overlay:container,createDocumentFragment:()=>({})});
  const reduce=eventTarget({matches:reduced}),pointer=eventTarget({matches:fine});
  const win=eventTarget({setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout,matchMedia:q=>q.includes('reduced-motion')?reduce:pointer,createFlorilegiumMotion(_mount,options){
    let progress=0;
    const rig={svg:{setAttribute(){}},starts:0,pauses:0,seekValues:[],colors:[],destroyed:false,
      play(){this.starts++},pause(){this.pauses++},seek(p){progress=p;this.seekValues.push(p);options.onProgress(p)},
      getProgress(){return progress},setGlowColor(c){this.colors.push(c)},destroy(){this.destroyed=true},
      advance(p){progress=p;options.onProgress(p);if(p===1)options.onComplete()}};
    created.push(rig);return rig;
  }});
  class Image{constructor(){this.naturalWidth=1254;images.push(this)}decode(){return failed?Promise.reject(new Error('decode failure')):Promise.resolve()}}
  const runtime=vm.createContext({window:win,document:doc,Image,Promise,performance:{now:clock.now}});
  vm.runInContext(preloaderSource,runtime);
  if(!withoutHero)vm.runInContext(source,runtime);
  return{container,fallback,overlay,images,created,fonts,doc,win,reduce,pointer,clock,async ready(finish=true){win.dispatch('load');fonts.resolve();images.forEach(i=>i.onload());await flush();await flush();if(finish)await clock.advance(1070);return created[0]}};
}
(async()=>{
  let s=setup();
  assert.equal(s.container.dataset.motionState,'loading');
  s.images.forEach(i=>i.onload());await flush();
  assert.equal(s.created.length,0,'images alone must not bypass page and font initialization');
  s.fonts.resolve();await flush();assert.equal(s.created.length,0);
  s.win.dispatch('load');await flush();await flush();
  let rig=s.created[0];
  assert.equal(rig.starts,0,'the scene waits behind the loading screen');
  assert.equal(s.doc.documentElement.dataset.preloaderState,'loading');
  s.container.dispatch('mouseenter');s.container.dispatch('focus');assert.equal(rig.starts,0,'input cannot start the scene behind the overlay');
  await s.clock.advance(649);assert.equal(s.doc.documentElement.dataset.preloaderState,'loading');
  await s.clock.advance(1);assert.equal(s.doc.documentElement.dataset.preloaderState,'leaving');assert.equal(rig.starts,0);
  await s.clock.advance(200);assert.equal(s.overlay.hidden,true);assert.equal(rig.starts,0,'the open page has a short visual pause');
  await s.clock.advance(219);assert.equal(rig.starts,0);
  await s.clock.advance(1);
  assert.equal(rig.starts,1);assert.equal(s.fallback.hidden,true);assert.equal(s.container.dataset.playCount,'1');
  assert.deepEqual(rig.colors,['cyan']);
  s.container.dispatch('mouseenter');assert.equal(rig.starts,1,'hover must not restart a playing scene');
  rig.advance(1);assert.equal(s.container.dataset.motionState,'open');
  s.container.dispatch('mouseenter');assert.equal(rig.starts,2);assert.deepEqual(rig.seekValues,[0]);
  s.container.dispatch('mouseleave');assert.equal(rig.pauses,0,'leaving does not reset the scene');
  rig.advance(.5);s.doc.hidden=true;s.doc.dispatch('visibilitychange');
  const starts=rig.starts;s.doc.hidden=false;s.doc.dispatch('visibilitychange');assert.equal(rig.starts,starts,'later hover playback is not restarted when the tab returns');

  s=setup({hidden:true});rig=await s.ready();assert.equal(rig.starts,0);
  s.doc.hidden=false;s.doc.dispatch('visibilitychange');assert.equal(rig.starts,0);await s.clock.advance(220);assert.equal(rig.starts,1,'initial playback waits for visibility and its short pause');
  rig.advance(.35);s.doc.hidden=true;s.doc.dispatch('visibilitychange');s.doc.hidden=false;s.doc.dispatch('visibilitychange');
  assert.equal(rig.starts,2);assert.deepEqual(rig.seekValues,[],'interrupted initialization resumes, rather than resetting');

  s=setup({reduced:true});rig=await s.ready();assert.deepEqual(rig.seekValues,[1]);assert.equal(rig.starts,0);
  assert.equal(s.overlay.hidden,true,'reduced motion still releases the loading screen');
  s.container.dispatch('mouseenter');s.container.dispatch('focus');assert.equal(rig.starts,0,'reduced motion remains still on hover/focus');

  s=setup({fine:false});rig=await s.ready();rig.advance(1);s.container.dispatch('mouseenter');assert.equal(rig.starts,1,'coarse pointer cannot synthesize hover replays');
  s.container.dispatch('focus');assert.equal(rig.starts,2,'keyboard focus can replay');

  s=setup({failed:true});await s.ready();assert.equal(s.container.dataset.motionState,'fallback');assert.equal(s.created.length,0);assert.equal(s.fallback.hidden,false);
  assert.equal(s.overlay.hidden,true,'a decoding failure cannot trap the page behind an overlay');

  s=setup();await s.clock.advance(8000);assert.equal(s.container.dataset.motionState,'fallback','stalled images or fonts have a finite deadline');
  await s.clock.advance(200);assert.equal(s.overlay.hidden,true);assert.equal(s.fallback.hidden,false);
  s=setup({withoutHero:true});await s.clock.advance(9000);assert.equal(s.doc.documentElement.dataset.preloaderState,'leaving');await s.clock.advance(200);assert.equal(s.overlay.hidden,true,'even a missing hero script cannot trap the page');
  const approved={
    'lettering.js':'4c3d1360e0b8621309ec3e37a2f5239e319d4c6613f87125a988498c1226b651',
    'lid.js':'1bb1a6b89660a719d66032f6c07b745fa8dbbe68b7c532994e1a7c66b630cc0b',
    'motion.js':'886d07a262d202a3a73c2fa7c7ec1610a6313124601d0f8d4832aef825d1cbdb',
    'assets/bouquet.png':'a918e9a228f7eb293cb50a77e1329715ac82e75931ac005991ee5c07e3168070',
    'assets/case-empty-open.png':'c910452ff794cc9c2095ac7b7804cebede16f1283b8a8ea0f0e8e8ec9ff08289',
    'assets/closed-case-v2.png':'2a4a9ab1d7f4cd4713212b3f1b5fc7501d830fd86e2588a79b76d80b3408bf82',
    'assets/earbuds.png':'732230cea85027557355891848f474c406615ca6f65e4e68a1cae26e8f92d349'
  };
  for(const[name,sha]of Object.entries(approved))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'dist/motion',name))).digest('hex'),sha,`approved source/asset retained: ${name}`);
  console.log('PASS: decoded initialization, 650ms loader + 200ms fade + 220ms pause, blocked early input, finite failure/missing-script deadlines, single autoplay, noninterrupting hover, visibility, keyboard replay, reduced motion and unchanged approved assets.');
})().catch(error=>{console.error(error);process.exitCode=1});
