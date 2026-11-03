/* Extract the embossed lettering from the actual case image at render time.
 * No substitute typeface: illumination follows the existing letter contours. */
(() => {
  const NS='http://www.w3.org/2000/svg';
  function make(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n;}
  window.createFlorilegiumLettering=function(defs,svg,uid,asset){
    const filter=make('filter',{id:uid+'-letter-detail',filterUnits:'userSpaceOnUse',x:375,y:745,width:510,height:120,'color-interpolation-filters':'sRGB'},defs);
    make('feColorMatrix',{in:'SourceGraphic',type:'saturate',values:0,result:'gray'},filter);
    make('feGaussianBlur',{in:'gray',stdDeviation:.8,result:'clean'},filter);
    make('feConvolveMatrix',{in:'clean',order:3,kernelMatrix:'0 -1 0 -1 4 -1 0 -1 0',divisor:1,bias:0,preserveAlpha:true,result:'detail'},filter);
    make('feColorMatrix',{in:'detail',type:'matrix',values:'0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  8 8 8 0 -.04',result:'letterAlpha'},filter);
    const transfer=make('feComponentTransfer',{in:'letterAlpha'},filter);
    make('feFuncA',{type:'linear',slope:1.8,intercept:-.045},transfer);
    make('feGaussianBlur',{stdDeviation:.45},filter);
    const mask=make('mask',{id:uid+'-letter-mask',maskUnits:'userSpaceOnUse',x:375,y:745,width:510,height:120,'mask-type':'alpha'},defs);
    make('image',{href:asset('case-empty-open.png'),x:0,y:0,width:1254,height:1254,filter:'url(#'+uid+'-letter-detail)'},mask);
    const haloFilter=make('filter',{id:uid+'-letter-halo',filterUnits:'userSpaceOnUse',x:340,y:710,width:580,height:190},defs);
    make('feGaussianBlur',{stdDeviation:8},haloFilter);
    const group=make('g',{'data-layer':'lettering-glow','aria-hidden':'true',opacity:0},svg);
    const halo=make('g',{filter:'url(#'+uid+'-letter-halo)'},group);
    const haloPaint=make('rect',{x:375,y:745,width:510,height:120,fill:'#9de5ff',mask:'url(#'+uid+'-letter-mask)',opacity:.7},halo);
    const crisp=make('rect',{x:375,y:745,width:510,height:120,fill:'#dff7ff',mask:'url(#'+uid+'-letter-mask)',opacity:.85},group);
    let color='cyan';
    const colors={white:[255,255,255],cyan:[95,205,255],blue:[49,135,245]};
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
    const phase=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
    function update(p){
      // The embossed text is always present. Only its emitted light is animated.
      const t=phase(p,.74,.98), warm=smooth(phase(t,.18,.72));
      const rgb=colors[color].map(c=>Math.round(255+(c-255)*warm));
      const glowColor='rgb('+rgb.join(',')+')';
      haloPaint.setAttribute('fill',glowColor);crisp.setAttribute('fill',glowColor);
      const rise=smooth(phase(t,0,.38));
      const settle=smooth(phase(t,.55,1));
      group.setAttribute('opacity',String(rise*(.86-.48*settle)));
      group.dataset.color=color;
      group.dataset.activation=t.toFixed(4);
    }
    return {update,setColor(v){color=Object.hasOwn(colors,v)?v:'cyan'},group};
  };
})();
