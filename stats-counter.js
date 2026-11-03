(() => {
  'use strict';
  const block=document.querySelector('.project-stats');
  if(!block)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||!('IntersectionObserver' in window))return;
  const values=[...block.querySelectorAll('dt')].map(element=>{
    const original=element.textContent.trim();
    const match=original.match(/^(\d+)(.*)$/);
    return match?{element,original,target:Number(match[1]),suffix:match[2]}:null;
  }).filter(Boolean);
  if(!values.length)return;
  const duration=1400;
  let ready=false,visible=false,started=false,done=false,frame=0,last=null,elapsed=0;
  const observer=new IntersectionObserver(entries=>{
    const entry=entries.find(item=>item.target===block);
    if(!entry)return;
    visible=entry.isIntersecting&&entry.intersectionRatio>=.3;
    start();
  },{threshold:[0,.3]});
  function finish(){
    done=true;
    if(frame)window.cancelAnimationFrame(frame);
    frame=0;
    observer.disconnect();
    values.forEach(({element,original})=>{element.textContent=original;});
    block.dataset.counterState='complete';
  }
  function tick(now){
    frame=0;
    if(done||document.hidden){last=null;return;}
    if(last!==null)elapsed+=Math.max(0,now-last);
    last=now;
    const progress=Math.min(1,elapsed/duration);
    const eased=1-Math.pow(1-progress,3);
    values.forEach(({element,target,suffix})=>{element.textContent=String(Math.round(target*eased))+suffix;});
    if(progress===1){finish();return;}
    frame=window.requestAnimationFrame(tick);
  }
  function start(){
    if(!ready||!visible||started||done||document.hidden)return;
    started=true;
    observer.disconnect();
    block.dataset.counterState='counting';
    frame=window.requestAnimationFrame(tick);
  }
  values.forEach(({element,original,suffix})=>{
    // Keep the final value available to assistive technology throughout.
    element.setAttribute('aria-label',original);
    element.textContent='0'+suffix;
  });
  block.dataset.counterState='waiting';
  observer.observe(block);
  (window.lectoriumPreloader?.ready||Promise.resolve()).then(()=>{ready=true;start();});
  document.addEventListener('visibilitychange',()=>{
    if(done)return;
    if(document.hidden){
      if(frame)window.cancelAnimationFrame(frame);
      frame=0;last=null;
    }else if(started&&!frame){frame=window.requestAnimationFrame(tick);}
    else start();
  });
  reduced.addEventListener?.('change',event=>{if(event.matches)finish();});
  window.addEventListener('beforeprint',finish);
})();
