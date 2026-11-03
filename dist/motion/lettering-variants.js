/* Two lettering studies reuse the exact approved arch rig, masks and timing. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  let count=0;
  const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.appendChild(n);return n};
  const walk=n=>[n,...Array.from(n.children).flatMap(walk)];
  const layer=(n,name)=>walk(n).find(e=>e.getAttribute('data-layer')===name);
  function create(container,options={},kind){
    const uid=`florilegium-letters-${++count}`;
    let lettering;
    const rig=window.createFlorilegiumMotion(container,{...options,onProgress(p){lettering?.update(p);options.onProgress?.(p)}});
    const svg=rig.svg,defs=Array.from(svg.children).find(n=>n.tagName.toLowerCase()==='defs');
    svg.dataset.style=kind;
    layer(svg,'lettering-glow').remove();
    const front=layer(svg,'front-shell');
    const reduced=kind==='reveal';
    // Rebuild the editable front inset in SVG so the original raster lettering
    // cannot ghost through an empty state. The rim and outside silhouette stay
    // in their existing layers, with the original lid-occlusion mask.
    const faceGradient=el('linearGradient',{id:uid+'-face',gradientUnits:'userSpaceOnUse',x1:350,y1:650,x2:865,y2:1085},defs);
    const stops=reduced?[[0,'#f1f5ff'],[.48,'#ecf2ff'],[1,'#e1eafa']]:[[0,'#f7f9ff'],[.48,'#eaf0fd'],[1,'#d7e3f9']];
    for(const[offset,color]of stops)el('stop',{offset,'stop-color':color},faceGradient);
    const panel='M 283 641 C 424 665 818 665 969 641 L 963 929 C 960 1028 931 1075 817 1080 L 437 1080 C 330 1080 287 1035 285 935 Z';
    el('path',{d:panel,fill:`url(#${uid}-face)`,'data-layer':'unlettered-front-inset'},front);
    if(reduced){
      // Compress only the light plastic tones. Dark painted edges, plants and
      // earbuds retain the original contrast and accepted illustration style.
      const filter=el('filter',{id:uid+'-soft-plastic',x:0,y:0,width:1,height:1,'color-interpolation-filters':'sRGB'},defs);
      const transfer=el('feComponentTransfer',{},filter);
      for(const c of ['R','G','B'])el('feFunc'+c,{type:'table',tableValues:'0 .1 .2 .3 .45 .58 .69 .80 .88 .94 1'},transfer);
      for(const part of [front,layer(svg,'lid')])for(const n of walk(part))if(n.tagName.toLowerCase()==='image')n.setAttribute('filter',`url(#${uid}-soft-plastic)`);
      const floor=Array.from(svg.children).find(n=>n.tagName.toLowerCase()==='ellipse');
      if(floor)floor.setAttribute('opacity',.085);
    }
    const factory=reduced?window.createFlorilegiumLetterReveal:window.createFlorilegiumLetterSheen;
    lettering=factory(defs,svg,uid);
    lettering.update(rig.getProgress());
    // Fixed blue/cyan is intentional for these two requested comparison studies.
    const {setGlowColor,...api}=rig;
    return api;
  }
  window.createFlorilegiumMotionReveal=(container,options)=>create(container,options,'reveal');
  window.createFlorilegiumMotionSheen=(container,options)=>create(container,options,'sheen');
})();
