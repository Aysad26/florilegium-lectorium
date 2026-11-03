/* The accepted scene plus independently loaded graphic studies for comparison. */
(() => {
  'use strict';
  const container=document.querySelector('#hero-motion');
  if(!container)return;
  const fallback=container.querySelector('img');
  const controls=document.querySelector('.motion-variants');
  const buttons=[...(controls?.querySelectorAll('[data-motion-variant]')||[])];
  const variants={
    original:{factory:'createFlorilegiumMotion'},
    reveal:{factory:'createFlorilegiumStyledMotion',style:'flat',letterEffect:'reveal'},
    sheen:{factory:'createFlorilegiumStyledMotion',style:'pencil',letterEffect:'sheen'},
    wave:{factory:'createFlorilegiumStyledMotion',style:'line',letterEffect:'wave'}
  };
  const readiness={original:'loading',reveal:'loading',sheen:'loading',wave:'loading'};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const assetBase='./motion/assets/';
  const assetNames=['case-empty-open.png','closed-case-v2.png','earbuds.png','bouquet.png'];
  let rig,playing=false,initialPending=true,playCount=0,presentationReady=false,delayPassed=false,initialTimer=0;
  let selectedVariant='original',generation=0;
  container.dataset.motionState='loading';
  container.dataset.playCount='0';
  if(controls)controls.hidden=true;
  function syncSelection(){
    container.dataset.motionVariant=selectedVariant;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.motionVariant===selectedVariant)));
  }
  syncSelection();
  function syncAvailability(){
    buttons.forEach(button=>{
      const id=button.dataset.motionVariant;
      const available=Object.hasOwn(variants,id)&&readiness[id]==='ready'&&typeof window[variants[id].factory]==='function';
      button.disabled=!available;
      button.dataset.motionAvailability=readiness[id]||'unavailable';
    });
    if(controls)controls.hidden=!rig||typeof window.createFlorilegiumStyledMotion!=='function';
  }
  syncAvailability();

  function createRig(variant=selectedVariant){
    const config=variants[variant],factory=window[config.factory];
    if(typeof factory!=='function')throw new Error('Animation unavailable');
    const currentGeneration=generation+1;
    // Build off-DOM first, so a broken optional style cannot remove the current one.
    const mount=document.createDocumentFragment();
    const next=factory(mount,{
      assetBase,mode:'hinge',...(config.style?{style:config.style,letterEffect:config.letterEffect}:{}),
      onProgress(p){if(currentGeneration===generation)container.dataset.progress=p.toFixed(4);},
      onComplete(){
        if(currentGeneration!==generation)return;
        playing=false;initialPending=false;container.dataset.motionState='open';
      }
    });
    next.setGlowColor?.('cyan');
    next.svg.setAttribute('aria-hidden','true');
    generation=currentGeneration;
    rig?.destroy();
    rig=next;
    container.appendChild(rig.svg);
    if(fallback)fallback.hidden=true;
    container.dataset.progress=rig.getProgress().toFixed(4);
    container.dataset.motionState='ready';
  }

  function showFallback(){
    window.clearTimeout(assetDeadline);
    if(initialTimer){window.clearTimeout(initialTimer);initialTimer=0;}
    ++generation;
    rig?.destroy();rig=undefined;playing=false;initialPending=false;
    if(controls)controls.hidden=true;
    if(fallback)fallback.hidden=false;
    container.dataset.motionState='fallback';
    window.lectoriumPreloader?.release();
  }

  buttons.forEach(button=>button.addEventListener('click',()=>{
    const variant=button.dataset.motionVariant;
    if(!Object.hasOwn(variants,variant)||readiness[variant]!=='ready'||typeof window[variants[variant].factory]!=='function')return;
    const changed=variant!==selectedVariant;
    if(!rig)return;
    try{
      if(changed)createRig(variant);
    }catch{
      readiness[variant]='unavailable';syncAvailability();return;
    }
    selectedVariant=variant;syncSelection();
    // A ready style may be selected during the loader, but playback still waits.
    rig.seek(0);playing=false;initialPending=true;
    container.dataset.motionState='ready';
    if(reduced.matches)syncReducedMotion();
    else scheduleInitial();
  }));

  const pageReady=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
  const fontsReady=document.fonts?.ready||Promise.resolve();
  const loadAssets=names=>Promise.all(names.map(name=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      if(!image.naturalWidth){reject(new Error('Empty animation asset'));return;}
      (typeof image.decode==='function'?image.decode():Promise.resolve()).then(resolve,reject);
    };
    image.onerror=reject;
    image.src=assetBase+name;
  })));
  const assetsReady=loadAssets(assetNames);
  let assetDeadline;
  const deadlineReady=new Promise((resolve,reject)=>{
    assetDeadline=window.setTimeout(()=>reject(new Error('Animation readiness timeout')),8000);
  });
  // Optional images start after window.load, so they cannot hold the main page's
  // load event or the accepted scene behind a slow or failed comparison asset.
  pageReady.then(()=>{
    for(const [id,config]of Object.entries(variants)){
      if(!config.style)continue;
      if(typeof window[config.factory]!=='function'){
        readiness[id]='unavailable';syncAvailability();continue;
      }
      let timer;
      const deadline=new Promise((resolve,reject)=>{
        timer=window.setTimeout(()=>reject(new Error('Style readiness timeout')),8000);
      });
      Promise.race([loadAssets([`styles/${config.style}-reference.png`,`styles/${config.style}-empty.png`]),deadline])
        .then(()=>{readiness[id]='ready';})
        .catch(()=>{readiness[id]='unavailable';})
        .finally(()=>{window.clearTimeout(timer);syncAvailability();});
    }
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
    readiness.original='ready';
    createRig();
    syncAvailability();
    if(reduced.matches)syncReducedMotion();
    window.lectoriumPreloader?.release();
    (window.lectoriumPreloader?.ready||Promise.resolve()).then(()=>{
      presentationReady=true;scheduleInitial();
    });
  }).catch(showFallback);
})();
