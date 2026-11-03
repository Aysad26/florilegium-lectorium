'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.style={};}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
  appendChild(n){this.children.push(n);return n;}
}
const document={createElementNS:(_,t)=>new Element(t),addEventListener(){},removeEventListener(){}};
const window={createFlorilegiumStyledLettering:()=>({update(){}})};
const runtime=vm.createContext({document,window,cancelAnimationFrame(){}});
for(const file of ['lid.js','styled-motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/motion',file),'utf8'),runtime);
const walk=n=>[n,...n.children.flatMap(walk)];
function transformPoint(text,x,y){
  const operations=[...text.matchAll(/(translate|rotate|scale)\(([^)]+)\)/g)];
  for(const [,operation,values] of operations.reverse()){
    const [a,b,c]=values.split(/[ ,]+/).map(Number);
    if(operation==='translate'){x+=a;y+=b||0;}
    else if(operation==='scale'){x*=a;y*=b??a;}
    else{const angle=a*Math.PI/180,dx=x-b,dy=y-c;x=b+dx*Math.cos(angle)-dy*Math.sin(angle);y=c+dx*Math.sin(angle)+dy*Math.cos(angle);}
  }
  return[x,y];
}
for(const style of ['flat','pencil','line']){
  const scene=window.createFlorilegiumStyledMotion(new Element('div'),{style});
  const bloom=walk(scene.svg).find(n=>n.dataset.layer==='bouquet-and-earbuds');
  const layers=(walk(scene.svg).find(n=>n.dataset.layer==='pencil-artwork')||scene.svg).children;
  assert.ok(layers.findIndex(n=>n.dataset.layer==='contents')<layers.findIndex(n=>n.dataset.layer==='front-shell'),'front shell and white rim stay in front');
  for(let frame=0;frame<=1000;frame++){
    scene.seek(frame/1000);
    for(const x of [197,300,627,950,1057])for(const y of [574,600,625,638]){
      const [,newY]=transformPoint(bloom.attrs.transform,x,y);
      assert.ok(newY>=y-.01,`${style} lower artwork edge lifted at ${frame/1000}: ${x},${y} -> ${newY}`);
    }
  }
  const inverseSmooth=value=>.5-Math.sin(Math.asin(1-2*value)/3);
  const peakTime=style==='pencil'?(1400+1768*inverseSmooth(.5624))/3168:.5624;
  scene.seek(peakTime);const peak=bloom.attrs.transform;
  assert.ok(transformPoint(peak,627,245)[1]<230,'the flowers retain their upward bounce');
  scene.seek(1);for(const point of [[197,574],[627,245],[1057,638]])assert.deepEqual(transformPoint(bloom.attrs.transform,...point),point,'approved final artwork stays unchanged');
  scene.seek(0);scene.seek(peakTime);assert.equal(bloom.attrs.transform,peak,'replay and seek are deterministic');
}
console.log('PASS: all three bouquets retain their bounce while every lower crop-edge point stays behind its original rim height throughout opening and sway.');
