/* Independent, deterministic letter treatments for the approved arch-mask scene.
 * Outlined Cyrillic glyphs are embedded; no font download or raster text layer. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(parent)parent.appendChild(n);return n};
  const TRANSFORM='translate(384.5 850) scale(.144 -.144)';
  const CYAN='#59c7f4';
  const GLYPHS=[
    'M12 662V644C86 644 102 629 103 559V103C102 33 86 18 12 18V0H298V18C224 18 208 33 208 103V618L513 617V103C512 33 497 18 423 18V0H708V18C634 18 618 33 618 103V559C618 629 634 644 708 644V662Z',
    'M1357 155C1296 75 1224 37 1133 37C988 37 895 150 895 328C895 512 988 632 1130 632C1190 632 1246 609 1289 566C1324 531 1341 494 1349 437L1367 439L1361 662H1340C1336 634 1327 622 1310 622C1300 622 1299 622 1259 641C1220 659 1170 669 1119 669C926 669 774 520 774 331C774 145 923 -7 1107 -7C1212 -7 1310 49 1374 144Z',
    'M1587 0H1874V18C1799 18 1783 33 1783 104V614H1872C1957 615 1990 584 1994 500L2013 502L2003 662H1458L1448 502L1467 500C1471 584 1504 615 1589 614H1678V104C1678 33 1662 18 1587 18Z',
    'M2282 617H2458C2543 618 2576 587 2580 500L2599 501L2589 662H2086V644C2160 644 2176 629 2177 559V103C2176 33 2160 18 2086 18V0H2392V18C2302 18 2283 32 2282 102Z',
    'M2653 662V644C2717 643 2746 621 2792 542L2991 160C2950 76 2937 59 2912 59C2900 59 2891 63 2872 77C2852 91 2841 95 2824 95C2792 95 2770 77 2770 50C2770 14 2802 -9 2853 -9C2896 -9 2936 7 2965 36C2987 58 2996 71 3028 139L3210 524C3253 610 3291 642 3354 644V662H3131V644C3180 644 3193 637 3193 614C3193 607 3193 607 3184 582L3176 560L3046 277L2908 547C2894 573 2885 600 2885 613C2885 634 2903 644 2941 644H2954V662Z'
  ];

  function paths(parent,attrs={}){
    return GLYPHS.map((d,i)=>el('path',{d,transform:TRANSFORM,'data-glyph':'ПСТГУ'[i],...attrs},parent));
  }
  function group(svg,kind){return el('g',{'data-layer':'lettering','data-letter-effect':kind,'aria-label':'ПСТГУ'},svg)}

  window.createFlorilegiumLetterReveal=function(defs,svg,uid,asset){
    const root=group(svg,'reveal');
    const glyphs=GLYPHS.map((d,i)=>{
      const g=el('g',{'data-letter-index':i,opacity:0},root);
      el('path',{d,transform:TRANSFORM,fill:'#245ba5','data-glyph':'ПСТГУ'[i]},g);
      return g;
    });
    function update(value){
      const p=clamp(Number(value)||0);
      // 72 ms stagger with a 144 ms entrance: 432 ms for the whole word.
      // Begins only after the contents have completed their upward movement.
      let visible=0;
      glyphs.forEach((letter,i)=>{
        const t=smooth(phase(p,.742+i*.020,.782+i*.020));
        letter.setAttribute('opacity',t);
        letter.setAttribute('transform',`translate(0 ${8*(1-t)})`);
        letter.dataset.activation=t.toFixed(4);
        if(t>0)visible++;
      });
      root.dataset.activation=phase(p,.742,.862).toFixed(4);
      root.dataset.visibleLetters=String(visible);
    }
    update(0);
    return{update,group:root};
  };

  window.createFlorilegiumLetterSheen=function(defs,svg,uid,asset){
    const root=group(svg,'sheen');
    const baseGradient=el('linearGradient',{id:`${uid}-letters-base`,x1:0,y1:0,x2:0,y2:1},defs);
    el('stop',{offset:0,'stop-color':'#fcfdff'},baseGradient);
    el('stop',{offset:1,'stop-color':'#d8e6f6'},baseGradient);
    // Pale, legible lettering is present from the closed state.
    paths(root,{fill:`url(#${uid}-letters-base)`,stroke:'#6a86aa','stroke-width':12,'stroke-linejoin':'round','paint-order':'stroke fill'});

    const clip=el('clipPath',{id:`${uid}-letters-clip`,clipPathUnits:'userSpaceOnUse'},defs);
    paths(clip);
    const revealGradient=el('linearGradient',{id:`${uid}-letters-reveal-gradient`,gradientUnits:'userSpaceOnUse',x1:0,y1:0,x2:1,y2:0},defs);
    el('stop',{offset:0,'stop-color':'white'},revealGradient);
    el('stop',{offset:1,'stop-color':'black'},revealGradient);
    const revealMask=el('mask',{id:`${uid}-letters-reveal`,maskUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190,'mask-type':'luminance'},defs);
    el('rect',{x:340,y:710,width:580,height:190,fill:`url(#${uid}-letters-reveal-gradient)`},revealMask);
    const maskUrl=`url(#${uid}-letters-reveal)`;
    const glowFilter=el('filter',{id:`${uid}-letters-halo`,filterUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190,'color-interpolation-filters':'sRGB'},defs);
    el('feGaussianBlur',{stdDeviation:7},glowFilter);
    const halo=el('g',{filter:`url(#${uid}-letters-halo)`,opacity:0,'data-layer':'lettering-halo'},root);
    const haloReveal=el('g',{mask:maskUrl},halo);
    paths(haloReveal,{fill:CYAN,stroke:CYAN,'stroke-width':12});
    const colorLayer=el('g',{mask:maskUrl,'data-layer':'lettering-color'},root);
    paths(colorLayer,{fill:CYAN,stroke:'#4ca4d4','stroke-width':5,'paint-order':'stroke fill'});

    const shineGradient=el('linearGradient',{id:`${uid}-letters-shine-gradient`,gradientUnits:'userSpaceOnUse',x1:-58,y1:0,x2:58,y2:0},defs);
    for(const[offset,opacity]of [[0,0],[.3,.18],[.48,1],[.58,.9],[1,0]])el('stop',{offset,'stop-color':'#ffffff','stop-opacity':opacity},shineGradient);
    const shineClip=el('g',{'clip-path':`url(#${uid}-letters-clip)`,'data-layer':'lettering-shine'},root);
    const shine=el('g',{opacity:0},shineClip);
    // This slanted highlight is clipped to the actual word, never to a rectangle.
    el('path',{d:'M -34 725 L 82 725 L 31 885 L -85 885 Z',fill:`url(#${uid}-letters-shine-gradient)`},shine);

    function update(value){
      const p=clamp(Number(value)||0);
      const t=phase(p,.735,.96),travel=smooth(t),x=290+680*travel;
      revealGradient.setAttribute('x1',x-18);
      revealGradient.setAttribute('x2',x+22);
      shine.setAttribute('transform',`translate(${x} 0)`);
      // Once the sweep passes, cyan remains while its initial glow settles gently.
      shine.setAttribute('opacity',smooth(phase(t,0,.09))*(1-smooth(phase(t,.90,1))));
      halo.setAttribute('opacity',.52+.16*Math.sin(t*Math.PI));
      root.dataset.activation=t.toFixed(4);
      root.dataset.sweepX=x.toFixed(3);
    }
    update(0);
    return{update,group:root};
  };
})();
