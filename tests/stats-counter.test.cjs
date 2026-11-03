const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/stats-counter.js'),'utf8');
const final=['120+','18','180','70','867'];
function setup({reduce=false,hasObserver=true}={}){
  const events={},mediaEvents={},frames=new Map();let id=0,io,resolve;
  const values=final.map(textContent=>({textContent,labels:{},setAttribute(k,v){this.labels[k]=v}}));
  const block={dataset:{},querySelectorAll:()=>values};
  const document={hidden:false,querySelector:()=>block,addEventListener:(k,v)=>events[k]=v};
  const media={matches:reduce,addEventListener:(k,v)=>mediaEvents[k]=v};
  class Observer{constructor(callback){io=this;this.callback=callback}observe(){}disconnect(){this.disconnected=true}}
  const window={matchMedia:()=>media,lectoriumPreloader:{ready:new Promise(r=>resolve=r)},requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:n=>frames.delete(n),addEventListener:(k,v)=>events[k]=v};
  if(hasObserver)window.IntersectionObserver=Observer;
  vm.runInNewContext(source,{window,document,IntersectionObserver:Observer,Promise});
  return {values,block,document,events,mediaEvents,frames,visible(r=.5){io.callback([{target:block,isIntersecting:r>0,intersectionRatio:r}])},async ready(){resolve();await Promise.resolve();await Promise.resolve()},tick(t){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(t))},texts:()=>values.map(x=>x.textContent)};
}
(async()=>{
  const a=setup();a.visible();assert.equal(a.frames.size,0,'must wait until the loader disappears');
  await a.ready();assert.equal(a.block.dataset.counterState,'counting');a.tick(0);a.tick(700);
  assert.ok(Number(a.texts()[4])>0&&Number(a.texts()[4])<867);assert.ok(a.texts()[0].endsWith('+'));
  a.document.hidden=true;a.events.visibilitychange();assert.equal(a.frames.size,0);
  const paused=a.texts();a.document.hidden=false;a.events.visibilitychange();a.tick(5000);assert.deepEqual(a.texts(),paused,'hidden time is not counted');
  a.tick(5700);assert.deepEqual(a.texts(),final);a.visible(0);a.visible();assert.equal(a.frames.size,0,'only one run');
  assert.deepEqual(a.values.map(x=>x.labels['aria-label']),final);
  const b=setup();await b.ready();b.visible(.1);assert.equal(b.frames.size,0,'off-screen block waits');b.visible(.5);assert.equal(b.frames.size,1);
  b.mediaEvents.change({matches:true});assert.deepEqual(b.texts(),final);assert.equal(b.frames.size,0);
  assert.deepEqual(setup({reduce:true}).texts(),final);
  assert.deepEqual(setup({hasObserver:false}).texts(),final);
  console.log('PASS: loader/visibility gates, one run, exact totals and suffix, hidden-tab pause, accessible totals, reduced motion and static fallback.');
})().catch(error=>{console.error(error);process.exitCode=1});
