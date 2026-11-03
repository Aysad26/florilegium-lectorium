/* The accepted «По эскизу» scene: play once on initialization, replay on hover. */
(() => {
  'use strict';
  const container=document.querySelector('#hero-motion');
  if(!container)return;
  const fallback=container.querySelector('img');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const assetBase='./motion/assets/';
  const assetNames=['case-empty-open.png','closed-case-v2.png','earbuds.png','bouquet.png'];
  let rig,playing=false,initialPending=true,playCount=0,presentationReady=false,delayPassed=false,initialTimer=0;
  container.dataset.motionState='loading';
  container.dataset.playCount='0';

  const pageReady=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  const fontsReady=document.fonts?.ready||Promise.resolve();
  const assetsReady=Promise.all(assetNames.map(name=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      if(!image.naturalWidth){reject(new Error('Empty animation asset'));return;}
      (typeof image.decode==='function'?image.decode():Promise.resolve()).then(resolve,reject);
    };
    image.onerror=reject;
    image.src=assetBase+name;
  })));
  let assetDeadline;
  const deadlineReady=new Promise((resolve,reject)=>{
    assetDeadline=window.setTimeout(()=>reject(new Error('Animation readiness timeout')),8000);
  });

  function scheduleInitial(){
    if(!rig||!presentationReady||!initialPending||document.hidden)return;
    if(reduced.matches){syncReducedMotion();return;}
    if(delayPassed){start(false);return;}
    if(initialTimer)return;
    initialTimer=window.setTimeout(()=>{
      initialTimer=0;
      if(document.hidden)return;
      delayPassed=true;start(false);
    },220);
  }

  function start(restart){
    if(!rig||!presentationReady||!delayPassed||playing||document.hidden||reduced.matches)return;
    if(restart)rig.seek(0);
    playing=true;
    container.dataset.motionState='playing';
    container.dataset.playCount=String(++playCount);
    rig.play();
  }
  function replay(){start(true);}
  container.addEventListener('mouseenter',()=>{if(pointer.matches)replay();});
  container.addEventListener('focus',replay);
  container.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();replay();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!rig)return;
    if(document.hidden){
      if(initialTimer){window.clearTimeout(initialTimer);initialTimer=0;}
      rig.pause();playing=false;
      if(rig.getProgress()<1)container.dataset.motionState='paused';
    }else if(initialPending){scheduleInitial();}
  });
  function syncReducedMotion(){
    if(!rig||!reduced.matches)return;
    if(initialTimer){window.clearTimeout(initialTimer);initialTimer=0;}
    delayPassed=true;
    rig.seek(1);playing=false;initialPending=false;
    container.dataset.motionState='open';
  }
  reduced.addEventListener?.('change',syncReducedMotion);

  Promise.race([Promise.all([pageReady,fontsReady,assetsReady]),deadlineReady]).then(()=>{
    window.clearTimeout(assetDeadline);
    if(typeof window.createFlorilegiumMotion!=='function')throw new Error('Animation unavailable');
    // Construct off-DOM and reveal only after all raster layers have decoded.
    const mount=document.createDocumentFragment();
    rig=window.createFlorilegiumMotion(mount,{
      assetBase,mode:'hinge',
      onProgress(p){container.dataset.progress=p.toFixed(4);},
      onComplete(){playing=false;initialPending=false;container.dataset.motionState='open';}
    });
    rig.setGlowColor('cyan');
    rig.svg.setAttribute('aria-hidden','true');
    container.appendChild(rig.svg);
    if(fallback)fallback.hidden=true;
    container.dataset.motionState='ready';
    if(reduced.matches)syncReducedMotion();
    window.lectoriumPreloader?.release();
    (window.lectoriumPreloader?.ready||Promise.resolve()).then(()=>{
      presentationReady=true;scheduleInitial();
    });
  }).catch(()=>{
    window.clearTimeout(assetDeadline);
    rig?.destroy();rig=undefined;playing=false;initialPending=false;
    if(fallback)fallback.hidden=false;
    container.dataset.motionState='fallback';
    window.lectoriumPreloader?.release();
  });
})();
