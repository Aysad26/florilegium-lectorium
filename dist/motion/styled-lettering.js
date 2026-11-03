/* Lettering for the three selected illustrated styles. Deterministic progress only.
 * Manrope Bold outlines are from the project's OFL-licensed local font.
 * Existing serif outlines preserve the approved proportions of the word. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const el=(tag,attrs,parent)=>{
    const node=document.createElementNS(NS,tag);
    for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));
    if(parent)parent.appendChild(node);
    return node;
  };
  const SERIF=["M12 662V644C86 644 102 629 103 559V103C102 33 86 18 12 18V0H298V18C224 18 208 33 208 103V618L513 617V103C512 33 497 18 423 18V0H708V18C634 18 618 33 618 103V559C618 629 634 644 708 644V662Z","M1357 155C1296 75 1224 37 1133 37C988 37 895 150 895 328C895 512 988 632 1130 632C1190 632 1246 609 1289 566C1324 531 1341 494 1349 437L1367 439L1361 662H1340C1336 634 1327 622 1310 622C1300 622 1299 622 1259 641C1220 659 1170 669 1119 669C926 669 774 520 774 331C774 145 923 -7 1107 -7C1212 -7 1310 49 1374 144Z","M1587 0H1874V18C1799 18 1783 33 1783 104V614H1872C1957 615 1990 584 1994 500L2013 502L2003 662H1458L1448 502L1467 500C1471 584 1504 615 1589 614H1678V104C1678 33 1662 18 1587 18Z","M2282 617H2458C2543 618 2576 587 2580 500L2599 501L2589 662H2086V644C2160 644 2176 629 2177 559V103C2176 33 2160 18 2086 18V0H2392V18C2302 18 2283 32 2282 102Z","M2653 662V644C2717 643 2746 621 2792 542L2991 160C2950 76 2937 59 2912 59C2900 59 2891 63 2872 77C2852 91 2841 95 2824 95C2792 95 2770 77 2770 50C2770 14 2802 -9 2853 -9C2896 -9 2936 7 2965 36C2987 58 2996 71 3028 139L3210 524C3253 610 3291 642 3354 644V662H3131V644C3180 644 3193 637 3193 614C3193 607 3193 607 3184 582L3176 560L3046 277L2908 547C2894 573 2885 600 2885 613C2885 634 2903 644 2941 644H2954V662Z"];
  const SERIF_BOUNDS=[[12.0,0.0,708.0,662.0],[774.0,-7.0,1374.0,669.0],[1448.0,0.0,2013.0,662.0],[2086.0,0.0,2599.0,662.0],[2653.0,-9.0,3354.0,662.0]];
  const FLAT=["M140 0V1440H1307V0H1066V1214H381V0Z","M2210 -30Q1994 -30 1840.0 64.5Q1686 159 1603.5 328.0Q1521 497 1521 720Q1521 943 1603.5 1112.0Q1686 1281 1840.0 1375.5Q1994 1470 2210 1470Q2459 1470 2625.0 1345.5Q2791 1221 2858 1010L2615 943Q2573 1084 2472.0 1163.5Q2371 1243 2210 1243Q2065 1243 1968.5 1178.0Q1872 1113 1823.5 995.5Q1775 878 1774 720Q1774 562 1822.5 444.5Q1871 327 1968.0 262.0Q2065 197 2210 197Q2371 197 2472.0 277.0Q2573 357 2615 497L2858 430Q2791 219 2625.0 94.5Q2459 -30 2210 -30Z","M3438 0V1214H2972V1440H4145V1214H3679V0Z","M4319 0V1440H5249V1214H4560V0Z","M5613 0 5803 388 5306 1440H5578L5929 642L6291 1440H6548L5870 0Z"];
  const FLAT_BOUNDS=[[140,0,1307,1440],[1521,-30,2858,1470],[2972,0,4145,1440],[4319,0,5249,1440],[5306,0,6548,1440]];

  window.createFlorilegiumStyledLettering=function(defs,svg,uid,options={}){
    const style=['flat','pencil','line'].includes(options.style)?options.style:'line';
    const effect=['reveal','sheen','wave'].includes(options.effect)?options.effect:'wave';
    const isFlat=style==='flat',isPencil=style==='pencil';
    const glyphs=isFlat?FLAT:SERIF;
    const bounds=isFlat?FLAT_BOUNDS:SERIF_BOUNDS;
    // The flat word is slightly wider and heavier, like its selected reference.
    const sx=isFlat?510/6408:.144,sy=isFlat?110/1500:.144;
    const tx=isFlat?375-140*sx:384.5,ty=isFlat?745+1470*sy:850;
    const transform=`translate(${tx} ${ty}) scale(${sx} ${-sy})`;
    const blue=isFlat?'#064ed9':isPencil?'#1d579b':'#164c8b';
    const cyan='#59c7f4';
    const root=el('g',{'data-layer':'lettering','data-letter-effect':effect,'data-letter-style':style,'aria-label':'ПСТГУ'},svg);
    root.dataset.baseColor=blue;

    function glyph(parent,index,attrs={}){
      return el('path',{d:glyphs[index],transform,'data-glyph':'ПСТГУ'[index],...attrs},parent);
    }
    function word(parent,attrs={}){return glyphs.map((_,i)=>glyph(parent,i,attrs));}

    let grain;
    if(isPencil){
      // A fixed noise field supplies paper grain; it never changes with progress.
      const filter=el('filter',{id:`${uid}-pencil-letters`,filterUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190,'color-interpolation-filters':'sRGB'},defs);
      el('feTurbulence',{type:'fractalNoise',baseFrequency:.45,numOctaves:2,seed:19,stitchTiles:'stitch',result:'grain'},filter);
      el('feColorMatrix',{in:'grain',type:'matrix',values:'0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .20 .20 .20 0 .48',result:'grain-alpha'},filter);
      el('feComposite',{in:'SourceGraphic',in2:'grain-alpha',operator:'in'},filter);
      grain=`url(#${uid}-pencil-letters)`;
    }
    const paint={fill:blue,...(isFlat?{}:{stroke:blue,'stroke-width':12,'stroke-linejoin':'round','paint-order':'stroke fill'})};

    if(effect==='reveal'){
      const letters=glyphs.map((_,i)=>{
        const group=el('g',{'data-letter-index':i,opacity:0,...(grain?{filter:grain}:{})},root);
        glyph(group,i,paint);return group;
      });
      const update=value=>{
        const p=clamp(Number(value)||0);
        let visible=0;
        letters.forEach((letter,i)=>{
          // Retain the approved 72 ms stagger and 144 ms entrance.
          const t=smooth(phase(p,.742+i*.020,.782+i*.020));
          letter.setAttribute('opacity',t);
          letter.setAttribute('transform',`translate(0 ${8*(1-t)})`);
          letter.dataset.activation=t.toFixed(4);
          if(t>0)visible++;
        });
        root.dataset.activation=phase(p,.742,.862).toFixed(4);
        root.dataset.visibleLetters=String(visible);
      };
      update(0);return {update,group:root};
    }

    const shineGradient=el('linearGradient',{id:`${uid}-styled-shine`,gradientUnits:'userSpaceOnUse',x1:-58,y1:0,x2:58,y2:0},defs);
    for(const [offset,opacity] of [[0,0],[.3,.18],[.48,1],[.58,.9],[1,0]])el('stop',{offset,'stop-color':'#fff','stop-opacity':opacity},shineGradient);
    function shine(parent,clip){
      const clipped=el('g',{'clip-path':clip,'data-layer':'lettering-shine'},parent);
      const moving=el('g',{opacity:0},clipped);
      el('path',{d:'M -34 710 L 82 710 L 31 895 L -85 895 Z',fill:`url(#${uid}-styled-shine)`},moving);
      return moving;
    }

    if(effect==='sheen'){
      const base=el('g',{'data-layer':'lettering-base',...(grain?{filter:grain}:{})},root);
      word(base,paint);
      const clip=el('clipPath',{id:`${uid}-styled-word-clip`,clipPathUnits:'userSpaceOnUse'},defs);
      word(clip);
      const reveal=el('linearGradient',{id:`${uid}-styled-color-reveal`,gradientUnits:'userSpaceOnUse',x1:0,y1:0,x2:1,y2:0},defs);
      el('stop',{offset:0,'stop-color':'white'},reveal);el('stop',{offset:1,'stop-color':'black'},reveal);
      const mask=el('mask',{id:`${uid}-styled-color-mask`,maskUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190,'mask-type':'luminance'},defs);
      el('rect',{x:340,y:710,width:580,height:190,fill:`url(#${uid}-styled-color-reveal)`},mask);
      const maskUrl=`url(#${uid}-styled-color-mask)`;
      const blur=el('filter',{id:`${uid}-styled-halo`,filterUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190,'color-interpolation-filters':'sRGB'},defs);
      el('feGaussianBlur',{stdDeviation:7},blur);
      const halo=el('g',{filter:`url(#${uid}-styled-halo)`,'data-layer':'lettering-halo'},root);
      const haloReveal=el('g',{mask:maskUrl},halo);
      word(haloReveal,{fill:cyan,stroke:cyan,'stroke-width':12});
      const color=el('g',{mask:maskUrl,'data-layer':'lettering-color',...(grain?{filter:grain}:{})},root);
      word(color,{fill:cyan,stroke:cyan,'stroke-width':12,'paint-order':'stroke fill'});
      const moving=shine(root,`url(#${uid}-styled-word-clip)`);
      const update=value=>{
        const p=clamp(Number(value)||0),t=phase(p,.735,.96),x=290+680*smooth(t);
        reveal.setAttribute('x1',x-18);reveal.setAttribute('x2',x+22);
        moving.setAttribute('transform',`translate(${x} 0)`);
        moving.setAttribute('opacity',smooth(phase(t,0,.09))*(1-smooth(phase(t,.90,1))));
        halo.setAttribute('opacity',.52+.16*Math.sin(t*Math.PI));
        root.dataset.activation=t.toFixed(4);root.dataset.sweepX=x.toFixed(3);
      };
      update(0);return {update,group:root};
    }

    // Wave: the same blue base is present before and after the highlight.
    const waveClip=el('clipPath',{id:`${uid}-wave-word-clip`,clipPathUnits:'userSpaceOnUse'},defs);
    const letters=glyphs.map((_,i)=>{
      const group=el('g',{'data-letter-index':i},root);
      glyph(group,i,paint);
      const clipGroup=el('g',{'data-letter-clip-index':i},waveClip);
      glyph(clipGroup,i);
      const b=bounds[i];
      return {group,clipGroup,cx:tx+(b[0]+b[2])*.5*sx,cy:ty-(b[1]+b[3])*.5*sy};
    });
    const moving=shine(root,`url(#${uid}-wave-word-clip)`);
    const update=value=>{
      const p=clamp(Number(value)||0),t=phase(p,.742,.915),x=290+680*smooth(t);
      letters.forEach((letter,i)=>{
        // 324 ms per letter, 65 ms stagger: all five settle in 584 ms.
        const local=phase(p,.742+i*65/3600,.832+i*65/3600);
        const scale=1+.16*Math.pow(Math.sin(Math.PI*local),2);
        const transform=`translate(${letter.cx} ${letter.cy}) scale(${scale}) translate(${-letter.cx} ${-letter.cy})`;
        letter.group.setAttribute('transform',transform);
        letter.clipGroup.setAttribute('transform',transform);
        letter.group.dataset.scale=scale.toFixed(5);
        letter.group.dataset.activation=local.toFixed(4);
      });
      moving.setAttribute('transform',`translate(${x} 0)`);
      moving.setAttribute('opacity',smooth(phase(t,0,.08))*(1-smooth(phase(t,.90,1))));
      root.dataset.activation=t.toFixed(4);root.dataset.sweepX=x.toFixed(3);
      root.dataset.waveActive=String(p>.742&&p<.915);
    };
    update(0);return {update,group:root};
  };
})();
