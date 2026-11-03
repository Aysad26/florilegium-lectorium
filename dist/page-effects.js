(() => {
  'use strict';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||!('IntersectionObserver' in window))return;
  const selector='.lc-section-heading,.lc-feature-card,.lc-card,.authors-heading,.author-card,.footer-top,.footer-bottom';
  const elements=[...document.querySelectorAll(selector)];
  const show=element=>{
    element.classList.remove('is-pending');
    element.classList.add('is-visible');
  };
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  },{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  elements.forEach((element,index)=>{
    // Do not fade already-visible content or the animated first screen.
    if(element.getBoundingClientRect().top<window.innerHeight)return;
    element.classList.add('scroll-reveal','is-pending');
    element.style.setProperty('--reveal-delay',`${element.matches('.lc-card,.author-card')?(index%3)*40:0}ms`);
    observer.observe(element);
  });
  const showAll=()=>{elements.forEach(show);observer.disconnect();};
  reduced.addEventListener?.('change',event=>{if(event.matches)showAll();});
  window.addEventListener('beforeprint',showAll);
})();
