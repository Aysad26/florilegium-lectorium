/* A short, bounded loading screen. Without JavaScript the page stays visible. */
(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const began=performance.now();
  const minimum=650,fade=200,maximum=9000;
  let released=false,resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  root.dataset.preloaderState='loading';
  function finish(){
    root.dataset.preloaderState='complete';
    const overlay=document.querySelector('#page-preloader');
    if(overlay)overlay.hidden=true;
    resolveReady();
  }
  function release(){
    if(released)return;
    released=true;
    window.clearTimeout(deadline);
    window.setTimeout(()=>{
      root.dataset.preloaderState='leaving';
      window.setTimeout(finish,reduced.matches?0:fade);
    },Math.max(0,minimum-(performance.now()-began)));
  }
  // Even missing or failed initialization scripts cannot leave an overlay up.
  const deadline=window.setTimeout(release,maximum);
  window.lectoriumPreloader={ready,release};
})();
