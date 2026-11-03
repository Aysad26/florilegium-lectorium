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
function setup({reduced=false,fine=true,hidden=false,failed=false,withoutHero=false,missingVariants=false,failedStyles=[],throwStyles=[],deferStyles=false}={}){
  const fallback={hidden:false},overlay={hidden:false},images=[],created=[],fonts=deferred();
  let now=0,nextTimer=0;const timers=new Map();
  const clock={
    setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,at:now+ms});return id},
    clearTimeout(id){timers.delete(id)},
    async advance(ms){const end=now+ms;let next;while((next=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0])){now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();await flush();}now=end;await flush();await flush();},
    now:()=>now
  };
  const container=eventTarget({dataset:{},children:[],querySelector:()=>fallback,appendChild(n){this.children.push(n)}});
  const buttons=['original','reveal','sheen','wave'].map(variant=>eventTarget({dataset:{motionVariant:variant},attributes:{},disabled:false,setAttribute(k,v){this.attributes[k]=v}}));
  const controls={hidden:true,querySelectorAll:()=>buttons};
  const doc=eventTarget({hidden,readyState:'loading',documentElement:{dataset:{}},fonts:{ready:fonts.promise},querySelector:q=>q==='#page-preloader'?overlay:q==='.motion-variants'?controls:container,createDocumentFragment:()=>({})});
  const reduce=eventTarget({matches:reduced}),pointer=eventTarget({matches:fine});
  const factory=variant=>(_mount,options)=>{
    if(throwStyles.includes(options.style))throw new Error('Invalid style rig');
    let progress=0;
    const rig={variant,options,svg:{setAttribute(){}},starts:0,pauses:0,seekValues:[],colors:[],destroyed:false,active:false,
      play(){this.starts++;this.active=true},pause(){this.pauses++;this.active=false},seek(p){progress=p;this.active=false;this.seekValues.push(p);options.onProgress(p)},
      getProgress(){return progress},destroy(){this.destroyed=true;this.active=false;container.children=container.children.filter(svg=>svg!==this.svg)},
      advance(p){progress=p;options.onProgress(p);if(p===1)options.onComplete()}};
    if(variant==='original')rig.setGlowColor=function(c){this.colors.push(c)};
    created.push(rig);return rig;
  };
  const win=eventTarget({setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout,matchMedia:q=>q.includes('reduced-motion')?reduce:pointer,createFlorilegiumMotion:factory('original')});
  if(!missingVariants)win.createFlorilegiumStyledMotion=(mount,options)=>factory({flat:'reveal',pencil:'sheen',line:'wave'}[options.style])(mount,options);
  class Image{constructor(){this.naturalWidth=1254;images.push(this)}decode(){return failed||failedStyles.some(style=>this.src.includes(`/styles/${style}-`))?Promise.reject(new Error('decode failure')):Promise.resolve()}}
  const runtime=vm.createContext({window:win,document:doc,Image,Promise,performance:{now:clock.now}});
  vm.runInContext(preloaderSource,runtime);
  if(!withoutHero)vm.runInContext(source,runtime);
  const loadImages=async(predicate=()=>true)=>{
    images.filter(image=>!image.loaded&&predicate(image.src)).forEach(image=>{image.loaded=true;image.onload()});
    await flush();await flush();
  };
  return{container,controls,buttons,fallback,overlay,images,created,fonts,doc,win,reduce,pointer,clock,loadImages,select(variant){buttons.find(b=>b.dataset.motionVariant===variant).dispatch('click')},async ready(finish=true){win.dispatch('load');fonts.resolve();await loadImages();if(!deferStyles)await loadImages();if(finish)await clock.advance(1070);return created[0]}};
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

  s=setup();
  assert.equal(s.controls.hidden,true,'comparison controls stay hidden until assets and rigs are ready');
  rig=await s.ready(false);assert.equal(s.controls.hidden,false);
  s.select('sheen');let selected=s.created.at(-1);
  assert.equal(rig.destroyed,true);assert.equal(selected.variant,'sheen');assert.equal(selected.starts,0,'selection behind the preloader does not play');
  assert.equal(selected.setGlowColor,undefined,'fixed-color variants do not expose the optional color API');
  assert.equal(s.container.dataset.motionVariant,'sheen');
  assert.equal(selected.options.style,'pencil');assert.equal(selected.options.letterEffect,'sheen');assert.equal(selected.options.assetBase,'./motion/assets/');
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='sheen').attributes['aria-pressed'],'true');
  await s.clock.advance(850);assert.equal(s.overlay.hidden,true);assert.equal(selected.starts,0);
  s.select('reveal');const waiting=selected;selected=s.created.at(-1);
  assert.equal(waiting.destroyed,true);assert.equal(selected.variant,'reveal');assert.equal(selected.starts,0,'switching during the visual pause still waits');
  assert.equal(selected.options.style,'flat');assert.equal(selected.options.letterEffect,'reveal');
  await s.clock.advance(219);assert.equal(selected.starts,0);
  await s.clock.advance(1);assert.equal(selected.starts,1);assert.equal(s.container.dataset.playCount,'1');
  assert.equal(s.created.reduce((sum,r)=>sum+r.starts,0),1,'only the last selected scene autoplays');
  assert.equal(s.container.children.length,1,'switches keep one mounted scene');

  selected.advance(.4);s.select('reveal');
  assert.equal(s.created.length,3,'same-version clicks reuse the current rig');
  assert.equal(selected.starts,2,'same-version clicks restart during playback');
  assert.equal(selected.getProgress(),0);assert.deepEqual(selected.seekValues,[0,0]);
  s.container.dispatch('mouseenter');assert.equal(selected.starts,2,'hover still cannot interrupt a forced replay');
  const oldReveal=selected;
  s.select('sheen');selected=s.created.at(-1);
  assert.equal(oldReveal.destroyed,true);assert.equal(oldReveal.active,false);assert.equal(selected.starts,1);
  s.select('original');const oldSheen=selected;selected=s.created.at(-1);
  assert.equal(oldSheen.destroyed,true);assert.equal(selected.variant,'original');assert.equal(selected.starts,1);
  assert.equal(s.created.filter(r=>r.active).length,1,'rapid switches stop all prior timelines');
  assert.equal(s.container.children.length,1);assert.deepEqual(selected.colors,['cyan']);
  oldReveal.advance(1);oldSheen.advance(1);
  assert.equal(s.container.dataset.motionState,'playing','late callbacks from discarded scenes cannot finish the active one');
  assert.equal(s.container.dataset.progress,'0.0000');
  selected.advance(1);s.select('original');assert.equal(selected.starts,2,'clicking the active version also replays after completion');
  assert.equal(s.buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);
  s.select('wave');selected=s.created.at(-1);
  assert.equal(selected.variant,'wave');assert.equal(selected.options.style,'line');assert.equal(selected.options.letterEffect,'wave');
  assert.equal(selected.options.mode,'hinge');assert.equal(selected.starts,1);assert.equal(s.container.dataset.motionVariant,'wave');
  selected.advance(.6);s.select('wave');assert.equal(selected.starts,2);assert.equal(selected.getProgress(),0);
  assert.equal(s.container.children.length,1);assert.equal(s.created.filter(r=>r.active).length,1);

  s=setup({reduced:true});await s.ready();
  s.select('reveal');selected=s.created.at(-1);
  assert.equal(selected.starts,0);assert.equal(selected.getProgress(),1);assert.equal(s.container.dataset.motionState,'open');
  s.select('sheen');selected=s.created.at(-1);s.select('sheen');s.select('wave');selected=s.created.at(-1);s.select('wave');
  assert.equal(s.created.reduce((sum,r)=>sum+r.starts,0),0,'explicit variant choices respect reduced motion');
  assert.equal(selected.getProgress(),1);assert.equal(s.container.children.length,1);

  s=setup();await s.ready();s.doc.hidden=true;s.doc.dispatch('visibilitychange');s.select('sheen');selected=s.created.at(-1);
  assert.equal(selected.starts,0,'selection in a hidden tab waits');
  s.doc.hidden=false;s.doc.dispatch('visibilitychange');assert.equal(selected.starts,1,'pending selection starts when the page is visible');
  s.reduce.matches=true;s.reduce.dispatch('change',{matches:true});assert.equal(selected.getProgress(),1);assert.equal(selected.active,false);

  s=setup({missingVariants:true});rig=await s.ready();assert.equal(rig.starts,1);assert.equal(s.controls.hidden,true,'the accepted scene still works if comparison scripts are unavailable');
  assert.equal(s.images.length,4,'unavailable optional factories do not request their assets');

  s=setup({deferStyles:true});rig=await s.ready();
  assert.equal(s.images.length,10,'four original images and six independent style images are requested');
  assert.equal(rig.starts,1,'slow optional graphics do not delay initial playback');
  assert.equal(s.overlay.hidden,true);assert.equal(s.controls.hidden,false);
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='original').disabled,false);
  for(const id of ['reveal','sheen','wave'])assert.equal(s.buttons.find(b=>b.dataset.motionVariant===id).disabled,true);
  s.select('reveal');assert.equal(s.created.length,1,'an undecoded style cannot replace the active scene');
  await s.loadImages(src=>src.includes('/styles/flat-'));
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='reveal').disabled,false);
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='sheen').disabled,true);
  s.select('reveal');selected=s.created.at(-1);assert.equal(selected.starts,1);
  await s.clock.advance(8000);
  assert.equal(s.container.dataset.motionVariant,'reveal');assert.equal(selected.destroyed,false,'optional style timeouts do not discard the working scene');
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='sheen').dataset.motionAvailability,'unavailable');
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='wave').disabled,true);
  await s.loadImages();assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='wave').disabled,true,'a late response after a failed deadline does not revive that style');

  s=setup({failedStyles:['flat']});rig=await s.ready();
  assert.equal(rig.starts,1);assert.equal(s.container.dataset.motionVariant,'original');
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='reveal').disabled,true);
  assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='sheen').disabled,false);
  s.select('reveal');assert.equal(s.created.length,1,'failed decoding disables only its own variant');
  s.select('wave');selected=s.created.at(-1);assert.equal(selected.variant,'wave');assert.equal(selected.starts,1);

  s=setup({throwStyles:['line']});rig=await s.ready();rig.advance(.4);s.select('wave');
  assert.equal(s.container.dataset.motionVariant,'original');assert.equal(rig.destroyed,false);assert.equal(rig.active,true);
  assert.equal(s.container.children.length,1);assert.equal(s.buttons.find(b=>b.dataset.motionVariant==='wave').disabled,true);
  rig.advance(1);assert.equal(s.container.dataset.motionState,'open','an optional constructor error preserves the original rig and callbacks');

  s=setup({failed:true});await s.ready();assert.equal(s.container.dataset.motionState,'fallback');assert.equal(s.created.length,0);assert.equal(s.fallback.hidden,false);
  assert.equal(s.controls.hidden,true,'failed initialization keeps unusable comparison controls hidden');
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
  console.log('PASS: original initialization independent of optional styles, four variant mappings, per-style readiness/failure/timeout, loader selection, forced replay, rapid switches, atomic replacement, stale callback isolation, lifecycle/reduced motion and unchanged approved assets.');
})().catch(error=>{console.error(error);process.exitCode=1});
