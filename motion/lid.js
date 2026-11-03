/* One opaque silhouette, two complementary surface clips and a shared moving edge. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg', K=.5522847498;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const make=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(parent)parent.appendChild(n);return n};
  function geometry(value){
    const h=clamp(value), L=245,R=1010;
    const T=364-239*h,B=638-106*smooth(h/.35),S=mix(590,330,h),rx=210-30*h;
    const a=S-T,b=B-S;
    const outline=`M ${L+rx} ${T} H ${R-rx} C ${R-rx+K*rx} ${T} ${R} ${S-K*a} ${R} ${S} C ${R} ${S+K*b} ${R-rx+K*rx} ${B} ${R-rx} ${B} H ${L+rx} C ${L+rx-K*rx} ${B} ${L} ${S+K*b} ${L} ${S} C ${L} ${S-K*a} ${L+rx-K*rx} ${T} ${L+rx} ${T} Z`;
    // The ends remain on the side extrema. Only the crown of the reveal rises.
    // Signed d naturally turns the lower closing curve into the upper opening arch.
    const u=smooth((h-.025)/.91),Y=mix(B,T,u),E=S,d=Y-E;
    const edge=`M ${L} ${E} C ${L} ${E+K*d} ${L+rx-K*rx} ${Y} ${L+rx} ${Y} H ${R-rx} C ${R-rx+K*rx} ${Y} ${R} ${E+K*d} ${R} ${E}`;
    return {h,L,R,T,B,S,rx,u,Y,E,outline,edge,
      inner:`${edge} L ${R+40} ${E} V 700 H ${L-40} V ${E} Z`,
      outer:`${edge} L ${R+40} ${E} V 0 H ${L-40} V ${E} Z`};
  }
  window.florilegiumLidGeometry=geometry;
  window.createFlorilegiumLid=function(defs,svg,uid,asset){
    const clip=(id)=>{const c=make('clipPath',{id:uid+'-'+id,clipPathUnits:'userSpaceOnUse'},defs);return {path:make('path',{d:''},c),url:`url(#${uid}-${id})`}};
    const envelope=clip('lid-envelope'),outerClip=clip('lid-outer-surface'),innerClip=clip('lid-inner-surface');
    const bodyMask=make('mask',{id:uid+'-body-occlusion',maskUnits:'userSpaceOnUse',x:0,y:0,width:1254,height:1254,'mask-type':'luminance'},defs);
    make('rect',{width:1254,height:1254,fill:'white'},bodyMask);
    const bodyCover=make('path',{d:'',fill:'black'},bodyMask);
    const gradient=make('linearGradient',{id:uid+'-lid-base',x1:0,y1:0,x2:.4,y2:1},defs);
    make('stop',{offset:0,'stop-color':'#f3f7ff'},gradient);make('stop',{offset:1,'stop-color':'#b7cbea'},gradient);
    const group=make('g',{'data-layer':'lid','data-surface-system':'shared-envelope',opacity:1},svg);
    const base=make('path',{d:'',fill:`url(#${uid}-lid-base)`},group);
    const surfaces=make('g',{'clip-path':envelope.url},group);
    const outer=make('g',{'clip-path':outerClip.url,'data-layer':'lid-outer',opacity:1},surfaces);
    const inner=make('g',{'clip-path':innerClip.url,'data-layer':'lid-inner',opacity:1},surfaces);
    // The two affine patches meet on S, keeping the upper crown and lower wall
    // attached. They use the same image and overlap by <1 source pixel.
    function texture(parent,name,nativeTop,nativeSide,nativeBottom,left,right,id){
      const bands=[];
      for(let i=0;i<2;i++){
        const cp=make('clipPath',{id:`${uid}-${id}-${i}`,clipPathUnits:'userSpaceOnUse'},defs);
        make('rect',{x:210,y:i?nativeSide-.3:nativeTop-12,width:840,height:i?nativeBottom-nativeSide+16:nativeSide-nativeTop+12.3},cp);
        const transform=make('g',{},parent);
        make('image',{href:asset(name),x:0,y:0,width:1254,height:1254,'clip-path':`url(#${uid}-${id}-${i})`},transform);
        bands.push(transform);
      }
      return g=>{
        // Overscan the source's painted border beyond the shared silhouette.
        // The stable vector contour below owns the line weight at every angle.
        const bleed=18;
        const sx=(g.R-g.L+2*bleed)/(right-left),tx=g.L-bleed-left*sx;
        const sy0=(g.S-(g.T-bleed))/(nativeSide-nativeTop),sy1=(g.B+bleed-g.S)/(nativeBottom-nativeSide);
        bands[0].setAttribute('transform',`translate(${tx} ${g.T-bleed-nativeTop*sy0}) scale(${sx} ${sy0})`);
        bands[1].setAttribute('transform',`translate(${tx} ${g.S-nativeSide*sy1}) scale(${sx} ${sy1})`);
      };
    }
    const deformOuter=texture(outer,'closed-case-v2.png',364,590,638,244,1010,'outer-texture');
    const deformInner=texture(inner,'case-empty-open.png',125,330,534,249,999,'inner-texture');
    const edgeFade=make('linearGradient',{id:uid+'-edge-fade',gradientUnits:'userSpaceOnUse',x1:245,y1:0,x2:1010,y2:0},defs);
    for(const [offset,opacity]of [[0,0],[.035,1],[.965,1],[1,0]])make('stop',{offset,'stop-color':'white','stop-opacity':opacity},edgeFade);
    const edgeMask=make('mask',{id:uid+'-edge-taper',maskUnits:'userSpaceOnUse',x:230,y:0,width:800,height:700},defs);
    make('rect',{x:230,y:0,width:800,height:700,fill:`url(#${uid}-edge-fade)`},edgeMask);
    const seam=make('g',{mask:`url(#${uid}-edge-taper)`},surfaces);
    // The moving front edge uses the same visible 9px weight as the silhouette.
    // Its endpoints taper underneath the outer contour instead of piling up.
    const edgeContour=make('path',{d:'',fill:'none',stroke:'#173b60','stroke-width':9,'stroke-linecap':'butt','data-layer':'lid-front-edge'},seam);
    const edgeLight=make('path',{d:'',fill:'none',stroke:'#f6f9ff','stroke-width':0,'stroke-linecap':'butt'},seam);
    // Half of this stroke is clipped, leaving an even 9px inner outline,
    // matching the case while preserving the exact left/right silhouette.
    const outline=make('path',{d:'',fill:'none',stroke:'#173b60','stroke-width':18,'stroke-linejoin':'round','clip-path':envelope.url,'data-layer':'lid-outline'},group);
    function update(open){
      const g=geometry(open);
      for(const p of [envelope.path,base,outline,bodyCover])p.setAttribute('d',g.outline);
      innerClip.path.setAttribute('d',g.inner);
      outerClip.path.setAttribute('d',g.outer);
      // A small underlap guards against antialiased seams, never a transparency fade.
      outerClip.path.setAttribute('transform','translate(0 1.4)');
      deformOuter(g);deformInner(g);
      edgeContour.setAttribute('d',g.edge);edgeLight.setAttribute('d',g.edge);
      const bevel=Math.sin(Math.PI*g.u);
      edgeLight.setAttribute('stroke-width',3*bevel);
      edgeLight.setAttribute('transform',`translate(0 ${-6.5*bevel})`);
      group.dataset.open=g.h.toFixed(5);group.dataset.reveal=g.u.toFixed(5);
      return g;
    }
    update(0);
    return {group,update,bodyMask:`url(#${uid}-body-occlusion)`};
  };
})();
