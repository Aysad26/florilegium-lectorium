/* Florilegium: deterministic, scrubbable 2.5D motion with one continuous lid. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const smooth = v => {v=clamp(v); return v*v*(3-2*v);};
  const phase = (p,a,b) => clamp((p-a)/(b-a));
  const out = v => 1-Math.pow(1-clamp(v),3);
  const spring = v => {v=clamp(v); const c=1.25; return 1+(c+1)*Math.pow(v-1,3)+c*Math.pow(v-1,2);};
  let counter=0;
  const el = (tag,attrs={},parent) => { const n=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v)); if(parent)parent.appendChild(n);return n;};
  const path = (d,parent,attrs={}) => el('path',{d,...attrs},parent);
  window.createFlorilegiumMotion = function(container,options={}) {
    const uid=`florilegium-${++counter}`;
    const asset = name => (options.assetBase || './assets/')+name;
    let mode=options.mode==='mask'?'mask':'hinge', progress=0, speed=1, playing=false, raf=0, previous=0, disposed=false;
    const duration=3600;
    const svg=el('svg',{viewBox:'0 0 1254 1254',role:'img','aria-label':'Кейс Флорилегия: крышка открывается, появляются цветы и наушники',class:'florilegium-rig',width:'100%',height:'100%','data-rig':'florilegium','data-mode':mode},container);
    svg.style.cssText='display:block;width:100%;height:100%;overflow:visible;isolation:isolate';
    const defs=el('defs',{},svg);
    const clip = (name,shape) => {const c=el('clipPath',{id:`${uid}-${name}`,clipPathUnits:'userSpaceOnUse'},defs);shape(c);return `url(#${uid}-${name})`;};
    const reference = (parent,attrs={}) => el('image',{href:asset('case-empty-open.png'),x:0,y:0,width:1254,height:1254,...attrs},parent);
    // Foreground begins at the INNER edge of the front lip: its full white thickness
    // must stay in front of the stems, earbuds and flowers.
    const bodyBoundary='M 241 573 L 272 583 C 280 598 298 605 320 608 C 399 622 507 626 627 625 C 750 627 869 620 940 606 C 962 599 976 592 982 582 L 1013 573 L 1050 1190 L 205 1190 Z';
    const frontClip=clip('front',c=>path(bodyBoundary,c));
    const frontRimClip=clip('front-rim',c=>path('M 241 573 L 272 583 C 280 598 298 605 320 608 C 399 622 507 626 627 625 C 750 627 869 620 940 606 C 962 599 976 592 982 582 L 1013 573 L 1013 621 C 941 651 781 655 627 654 C 452 653 302 644 241 620 Z',c));
    const cavityClip=clip('cavity',c=>path('M 245 594 C 255 545 345 529 627 529 C 909 529 999 545 1013 594 V 645 H 245 Z',c));
    const cleanBodyClip=clip('clean-case',c=>el('rect',{x:235,y:520,width:790,height:655},c));
    const contentClip=clip('contents',c=>path('M 145 70 H 1115 V 565 L 1013 574 C 1004 604 966 616 891 627 C 749 649 510 646 365 627 C 293 618 248 606 241 574 L 145 565 Z',c));
    let cavityRevealRect;
    const cavityReveal=clip('cavity-reveal',c=>cavityRevealRect=el('rect',{x:230,y:530,width:800,height:110},c));
    const leftBudClip=clip('bud-left',c=>el('rect',{x:90,y:230,width:465,height:795},c));
    const rightBudClip=clip('bud-right',c=>el('rect',{x:697,y:230,width:470,height:795},c));
    const flowerClip=clip('bouquet-clean',c=>el('rect',{x:20,y:245,width:1215,height:700},c));
    // Replace only the three rounded, short raster tips. The long continuations
    // share the bouquet transform, so even its highest bounce stays rooted
    // behind the existing foreground rim instead of exposing cut-off stems.
    const stemTips=el('mask',{id:`${uid}-stem-tips`,maskUnits:'userSpaceOnUse',x:0,y:0,width:1254,height:1254,'mask-type':'luminance'},defs);
    el('rect',{width:1254,height:1254,fill:'white'},stemTips);
    for(const [x,y,width]of [[330,897,90],[555,904,65],[815,897,85]])el('rect',{x,y,width,height:65,fill:'black'},stemTips);
    const shadowFilter=el('filter',{id:`${uid}-shadow`,x:'-50%',y:'-300%',width:'200%',height:'700%'},defs);
    el('feGaussianBlur',{stdDeviation:15},shadowFilter);
    const glowFilter=el('filter',{id:`${uid}-glow`,x:'-40%',y:'-100%',width:'180%',height:'300%'},defs);
    el('feGaussianBlur',{stdDeviation:9},glowFilter);
    const sheenGradient=el('linearGradient',{id:`${uid}-sheen`,x1:'0%',y1:'100%',x2:'100%',y2:'0%'},defs);
    el('stop',{offset:'0%','stop-color':'#8be5ff','stop-opacity':0},sheenGradient);
    el('stop',{offset:'55%','stop-color':'#c0eeff','stop-opacity':0.52},sheenGradient);
    el('stop',{offset:'100%','stop-color':'#8be5ff','stop-opacity':0},sheenGradient);
    const floor=el('ellipse',{cx:627,cy:1168,rx:333,ry:15,fill:'#143d6d',opacity:.12,filter:`url(#${uid}-shadow)`},svg);
    const back=el('g',{'clip-path':cavityReveal,'data-layer':'cavity'},svg);
    reference(back,{'clip-path':cavityClip});
    const cavityShade=el('ellipse',{cx:627,cy:580,rx:344,ry:44,fill:'#09274b',opacity:.15},back);
    const lidRig=window.createFlorilegiumLid(defs,svg,uid,asset);
    const content=el('g',{'clip-path':contentClip,'data-layer':'contents'},svg);
    const left=el('g',{'data-layer':'earbud-left'},content);
    const leftScale=el('g',{transform:'translate(260 161) scale(.57)'},left);
    el('image',{href:asset('earbuds.png'),width:1254,height:1254,'clip-path':leftBudClip},leftScale);
    const right=el('g',{'data-layer':'earbud-right'},content);
    const rightScale=el('g',{transform:'translate(284 161) scale(.57)'},right);
    el('image',{href:asset('earbuds.png'),width:1254,height:1254,'clip-path':rightBudClip},rightScale);
    const flowers=el('g',{'data-layer':'bouquet'},content);
    const flowerScale=el('g',{transform:'translate(188 94) scale(.7 .59)'},flowers);
    const stems=el('g',{'data-layer':'stem-extensions'},flowerScale);
    const stemShapes=[
      {d:'M 370 885 C 380 922 390 987 396 1070',x:374,colors:['#7ab018','#4c8206'],width:38},
      {d:'M 586 890 C 590 938 590 1003 591 1070',x:588,colors:['#7db116','#5e9605'],width:36},
      {d:'M 862 885 C 848 920 833 984 825 1070',x:856,colors:['#87b70b','#68a003'],width:38}
    ];
    stemShapes.forEach((s,i)=>{
      const gradient=el('linearGradient',{id:`${uid}-stem-${i}`,gradientUnits:'userSpaceOnUse',x1:s.x-10,y1:0,x2:s.x+10,y2:0},defs);
      s.colors.forEach((color,j)=>el('stop',{offset:j,'stop-color':color},gradient));
      path(s.d,stems,{fill:'none',stroke:'#02172e','stroke-width':s.width,'stroke-linecap':'round'});
      path(s.d,stems,{fill:'none',stroke:`url(#${uid}-stem-${i})`,'stroke-width':s.width-16,'stroke-linecap':'round'});
    });
    el('image',{href:asset('bouquet.png'),width:1254,height:1254,'clip-path':flowerClip,mask:`url(#${uid}-stem-tips)`},flowerScale);
    const front=el('g',{'data-layer':'front-shell','clip-path':cleanBodyClip,mask:lidRig.bodyMask},svg);
    reference(front,{'clip-path':frontClip});
    const frontRim=el('g',{'data-layer':'front-rim','clip-path':frontRimClip,mask:lidRig.bodyMask},svg);
    reference(frontRim);
    const lettering=window.createFlorilegiumLettering(defs,svg,uid,asset);
    function render(p) {
      progress=clamp(Number(p)||0);
      const lidT=phase(progress,.055,.455), lid=smooth(lidT);
      const capOpen=mode==='hinge'?lid:out(phase(progress,.10,.48));
      lidRig.update(capOpen);
      cavityRevealRect.setAttribute('y',527);
      cavityRevealRect.setAttribute('height',118);
      cavityShade.setAttribute('opacity',.18*(1-capOpen)+.04);
      const bloomT=phase(progress,.26,.73), bloom=spring(bloomT);
      const budLT=phase(progress,.25,.66), budRT=phase(progress,.285,.70);
      const bL=spring(budLT), bR=spring(budRT);
      const sway=Math.sin(bloomT*Math.PI*3)*(1-bloomT)*1.2;
      flowers.setAttribute('transform',`translate(0 ${355*(1-bloom)}) rotate(${sway} 627 620)`);
      flowers.setAttribute('opacity',smooth(phase(progress,.25,.32)));
      left.setAttribute('transform',`translate(${-9*(1-bL)} ${370*(1-bL)}) rotate(${-5*(1-bL)} 450 610)`);
      right.setAttribute('transform',`translate(${10*(1-bR)} ${370*(1-bR)}) rotate(${5*(1-bR)} 810 610)`);
      left.setAttribute('opacity',smooth(phase(progress,.245,.31)));
      right.setAttribute('opacity',smooth(phase(progress,.275,.34)));
      lettering.update(progress);

      floor.setAttribute('rx',333+7*Math.sin(lid*Math.PI));
      svg.dataset.progress=progress.toFixed(4);
      svg.dataset.phase=progress<.07?'closed':progress<.25?'lid-opening':progress<.73?'bloom':progress<.97?'glow':'open';
      svg.dataset.lidOpen=capOpen.toFixed(5);
      svg.dataset.mode=mode;
      options.onProgress?.(progress);
    }
    function tick(now){
      if(!playing||disposed)return;
      if(!previous)previous=now;
      const dt=Math.max(0,now-previous);previous=now;
      render(progress+dt*speed/duration);
      if(progress>=1){playing=false;previous=0;svg.dataset.playing='false';options.onComplete?.();return;}
      raf=requestAnimationFrame(tick);
    }
    function pause(){playing=false;previous=0;cancelAnimationFrame(raf);svg.dataset.playing='false';}
    function play(){if(disposed)return;if(progress>=.9999)render(0);if(playing)return;playing=true;previous=0;svg.dataset.playing='true';raf=requestAnimationFrame(tick);}
    function visibility(){if(document.hidden)pause();}
    document.addEventListener('visibilitychange',visibility);
    render(0);
    return {play,pause,setGlowColor(value){lettering.setColor(value);lettering.update(progress);},seek(p){pause();render(p);},setMode(value){mode=value==='mask'?'mask':'hinge';render(progress);},setSpeed(value){speed=clamp(Number(value)||1,.15,3);},getProgress(){return progress;},destroy(){disposed=true;pause();document.removeEventListener('visibilitychange',visibility);svg.remove();},svg};
  };
})();
