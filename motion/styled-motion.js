/* Raster-faithful variants share a continuous opaque lid envelope.
 * Source artwork is never cut into replacement bitmaps: vector clips select
 * its contents, while the generated unlettered case supplies hidden surfaces. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const spring=v=>{v=clamp(v);const c=1.15;return 1+(c+1)*(v-1)**3+c*(v-1)**2};
  const el=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(parent)parent.appendChild(n);return n};
  const CONTENT_PATHS={"flat": "M 533 245 L 549 247 L 559 256 L 563 268 L 561 279 L 558 282 L 560 287 L 568 280 L 576 277 L 586 278 L 597 287 L 600 300 L 598 307 L 590 317 L 600 334 L 603 317 L 614 307 L 632 307 L 643 317 L 645 322 L 643 339 L 634 348 L 623 350 L 620 357 L 619 374 L 622 385 L 637 360 L 657 341 L 679 329 L 696 324 L 700 326 L 692 380 L 683 400 L 684 415 L 678 437 L 676 459 L 683 420 L 690 397 L 702 370 L 715 350 L 742 322 L 756 312 L 772 304 L 794 298 L 817 297 L 835 300 L 863 312 L 879 323 L 902 346 L 912 360 L 925 391 L 928 423 L 922 453 L 912 473 L 902 484 L 903 487 L 907 485 L 919 466 L 925 446 L 933 434 L 942 428 L 954 412 L 967 402 L 980 396 L 982 391 L 984 393 L 998 390 L 1012 392 L 1023 401 L 1026 407 L 1027 422 L 1025 431 L 1011 456 L 991 474 L 971 482 L 957 491 L 946 494 L 940 501 L 933 519 L 934 522 L 941 514 L 962 501 L 992 493 L 1022 495 L 1038 500 L 1048 507 L 1047 510 L 1033 519 L 1015 537 L 1011 544 L 986 567 L 987 571 L 982 569 L 973 575 L 977 581 L 977 589 L 981 593 L 981 600 L 976 606 L 955 615 L 918 622 L 836 628 L 729 630 L 729 637 L 721 638 L 489 638 L 488 630 L 376 627 L 336 623 L 300 616 L 288 612 L 274 603 L 272 595 L 282 584 L 266 572 L 261 572 L 262 569 L 245 551 L 228 526 L 206 504 L 209 500 L 231 491 L 268 489 L 291 495 L 309 505 L 299 487 L 282 484 L 256 470 L 242 457 L 232 441 L 227 425 L 228 402 L 239 388 L 246 385 L 256 385 L 259 382 L 263 387 L 274 390 L 277 393 L 279 392 L 303 414 L 314 432 L 315 442 L 327 470 L 335 482 L 338 483 L 339 479 L 333 474 L 322 455 L 316 435 L 315 405 L 322 377 L 339 348 L 364 323 L 394 305 L 418 298 L 447 297 L 471 303 L 497 317 L 520 338 L 539 363 L 552 388 L 563 423 L 568 456 L 569 449 L 564 418 L 569 406 L 580 408 L 595 416 L 603 424 L 610 436 L 609 413 L 603 398 L 598 393 L 587 397 L 578 396 L 566 387 L 562 379 L 562 368 L 566 359 L 579 350 L 590 349 L 580 343 L 573 342 L 563 350 L 549 350 L 542 346 L 535 336 L 534 324 L 537 317 L 544 310 L 556 306 L 545 293 L 535 294 L 524 290 L 514 277 L 513 266 L 517 256 L 524 249 L 533 245 Z", "pencil": "M 531 247 L 543 248 L 558 260 L 562 269 L 562 275 L 558 283 L 560 287 L 566 282 L 581 280 L 583 283 L 587 283 L 598 295 L 599 308 L 590 319 L 595 329 L 598 318 L 614 306 L 627 306 L 641 318 L 643 323 L 642 337 L 631 349 L 621 353 L 619 363 L 621 385 L 628 370 L 641 353 L 654 341 L 672 330 L 694 324 L 695 322 L 704 328 L 705 331 L 699 351 L 698 374 L 724 338 L 750 316 L 774 305 L 806 300 L 830 303 L 861 316 L 881 331 L 903 355 L 904 360 L 916 379 L 924 408 L 925 430 L 919 458 L 925 452 L 930 452 L 935 439 L 944 430 L 947 430 L 954 417 L 968 403 L 982 394 L 987 394 L 993 390 L 1017 390 L 1031 405 L 1035 421 L 1032 439 L 1028 448 L 1009 470 L 987 482 L 990 484 L 989 486 L 992 485 L 995 489 L 1002 485 L 1008 485 L 1040 493 L 1056 506 L 1054 509 L 1057 511 L 1049 519 L 1047 518 L 1045 521 L 1038 523 L 1024 534 L 1017 544 L 1014 544 L 1013 548 L 998 561 L 999 565 L 995 571 L 990 569 L 985 563 L 981 565 L 987 572 L 988 584 L 980 594 L 976 595 L 965 606 L 959 607 L 957 605 L 948 613 L 935 614 L 932 611 L 925 617 L 899 621 L 893 621 L 888 616 L 880 623 L 855 624 L 845 620 L 840 626 L 815 628 L 809 622 L 803 628 L 771 630 L 746 630 L 743 626 L 739 625 L 735 630 L 729 631 L 728 638 L 676 638 L 489 638 L 488 630 L 430 629 L 428 627 L 414 628 L 405 626 L 388 627 L 303 615 L 298 611 L 281 605 L 272 596 L 272 590 L 283 580 L 270 572 L 261 562 L 255 565 L 251 559 L 249 560 L 249 555 L 246 554 L 243 548 L 240 548 L 240 543 L 236 543 L 237 541 L 232 537 L 232 533 L 228 533 L 227 529 L 225 530 L 220 522 L 218 523 L 211 516 L 209 517 L 208 514 L 197 506 L 197 503 L 200 501 L 199 499 L 204 494 L 207 495 L 216 488 L 221 487 L 223 489 L 226 485 L 229 487 L 230 484 L 242 484 L 243 482 L 253 482 L 257 485 L 260 483 L 251 478 L 249 479 L 244 474 L 249 468 L 246 468 L 236 458 L 230 450 L 224 435 L 224 414 L 228 409 L 227 405 L 230 399 L 239 388 L 252 387 L 276 395 L 288 404 L 297 415 L 301 414 L 307 423 L 307 412 L 313 412 L 313 400 L 318 389 L 317 386 L 336 352 L 354 333 L 374 318 L 388 310 L 393 310 L 405 304 L 413 304 L 414 302 L 445 301 L 452 304 L 458 303 L 459 305 L 476 309 L 478 312 L 490 317 L 513 336 L 538 368 L 550 393 L 558 426 L 562 416 L 571 407 L 580 407 L 590 411 L 606 426 L 602 409 L 595 397 L 585 403 L 572 402 L 557 389 L 553 379 L 555 377 L 555 369 L 567 356 L 577 352 L 584 352 L 588 355 L 585 350 L 578 345 L 572 344 L 561 352 L 547 351 L 534 340 L 535 338 L 531 334 L 532 319 L 542 308 L 552 304 L 543 296 L 533 298 L 532 296 L 523 295 L 511 282 L 512 280 L 508 274 L 509 267 L 514 258 L 525 249 L 527 250 L 531 247 Z M 298 626 L 310 628 L 311 630 L 317 629 L 319 631 L 357 634 L 358 637 L 309 637 L 307 634 L 301 635 L 298 633 L 296 631 L 298 626 Z", "line": "M 533 244 L 549 248 L 558 257 L 561 264 L 561 272 L 556 282 L 559 285 L 562 285 L 570 278 L 581 278 L 595 290 L 598 303 L 595 310 L 585 320 L 599 336 L 597 330 L 599 319 L 615 305 L 630 306 L 644 320 L 645 332 L 642 338 L 632 349 L 617 353 L 617 369 L 621 384 L 634 362 L 656 341 L 670 332 L 692 323 L 700 329 L 696 343 L 692 378 L 685 395 L 679 402 L 683 408 L 702 365 L 717 344 L 734 327 L 750 315 L 766 307 L 793 300 L 818 300 L 842 306 L 871 323 L 895 347 L 912 376 L 919 399 L 920 432 L 913 457 L 915 455 L 918 457 L 925 439 L 937 426 L 942 426 L 941 422 L 955 406 L 969 396 L 979 393 L 975 387 L 982 377 L 988 382 L 983 391 L 996 389 L 1009 391 L 1025 407 L 1026 424 L 1022 437 L 1015 449 L 1002 463 L 992 470 L 979 475 L 972 471 L 971 473 L 978 478 L 973 484 L 981 481 L 986 486 L 984 489 L 995 489 L 993 486 L 998 481 L 1002 484 L 1005 482 L 1012 485 L 1015 484 L 1039 496 L 1049 508 L 1044 512 L 1046 515 L 1041 520 L 1039 519 L 1036 523 L 1025 529 L 1002 550 L 987 560 L 995 566 L 990 572 L 984 567 L 979 566 L 974 559 L 970 561 L 978 570 L 978 581 L 975 585 L 976 587 L 971 592 L 966 596 L 962 596 L 964 599 L 958 605 L 953 606 L 949 603 L 939 613 L 929 614 L 924 611 L 919 617 L 891 621 L 880 621 L 876 616 L 863 622 L 850 622 L 841 618 L 836 624 L 827 625 L 812 625 L 807 619 L 799 625 L 751 626 L 744 621 L 740 626 L 730 626 L 728 638 L 711 638 L 489 638 L 487 626 L 474 626 L 469 620 L 463 626 L 455 626 L 455 629 L 444 629 L 440 627 L 441 625 L 433 625 L 426 620 L 420 623 L 423 626 L 422 628 L 414 628 L 410 626 L 411 624 L 401 624 L 401 627 L 392 626 L 393 622 L 389 618 L 384 621 L 387 624 L 386 626 L 379 626 L 376 624 L 368 625 L 365 623 L 336 621 L 331 616 L 326 618 L 313 616 L 299 611 L 299 607 L 282 594 L 280 587 L 288 576 L 273 563 L 267 568 L 232 522 L 209 502 L 214 497 L 214 494 L 209 489 L 224 479 L 232 477 L 236 480 L 240 475 L 243 475 L 248 480 L 247 482 L 250 482 L 249 478 L 253 474 L 258 478 L 257 482 L 262 482 L 261 480 L 264 478 L 258 471 L 263 466 L 257 459 L 259 456 L 255 456 L 244 445 L 238 435 L 234 421 L 236 402 L 247 388 L 255 384 L 270 384 L 293 395 L 311 415 L 314 413 L 318 417 L 316 424 L 320 433 L 315 438 L 324 448 L 319 417 L 321 416 L 322 400 L 326 385 L 337 361 L 349 344 L 371 322 L 398 306 L 418 300 L 450 299 L 461 301 L 479 307 L 498 318 L 527 345 L 542 366 L 556 396 L 565 431 L 571 414 L 576 409 L 579 409 L 595 417 L 607 429 L 612 438 L 614 410 L 607 405 L 603 396 L 598 393 L 589 400 L 581 400 L 572 396 L 561 382 L 560 376 L 563 366 L 574 354 L 581 353 L 582 351 L 588 352 L 586 348 L 575 339 L 568 348 L 553 350 L 544 346 L 534 333 L 534 326 L 538 315 L 545 308 L 555 304 L 553 303 L 554 296 L 552 297 L 546 290 L 532 293 L 515 280 L 516 278 L 513 273 L 514 261 L 525 248 L 533 244 Z M 627 457 L 620 464 L 620 469 L 622 470 L 630 461 L 627 457 Z M 329 460 L 328 473 L 337 488 L 339 489 L 339 487 L 342 480 L 334 473 L 329 460 Z M 520 500 L 516 504 L 522 512 L 521 517 L 530 517 L 535 517 L 522 506 L 520 500 Z M 940 501 L 931 513 L 931 515 L 933 514 L 943 505 L 940 501 Z"};
  const STYLES={flat:{L:238,R:1015,stroke:'#082c55',weight:7,innerTop:124,innerSide:330,innerBottom:532},pencil:{L:229,R:1022,stroke:'#214c80',weight:5,innerTop:124,innerSide:305,innerBottom:500},line:{L:244,R:1009,stroke:'#082c55',weight:6,innerTop:124,innerSide:330,innerBottom:532}};
  let count=0;
  window.createFlorilegiumStyledMotion=function(container,options={}){
    const style=Object.hasOwn(STYLES,options.style)?options.style:'flat',cfg=STYLES[style],uid=`florilegium-styled-${++count}`;
    const base=options.assetBase||'./assets/',asset=name=>`${base}styles/${style}-${name}.png`;
    const isPencil=style==='pencil';
    let progress=0,speed=1,playing=false,raf=0,previous=null,disposed=false,mode=options.mode==='mask'?'mask':'hinge';
    let orbiting=false,ambientWanted=false,ambientElapsed=0;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    // Pencil retains its separate 1400 ms drawing phase. The opening, bouquet
    // and lettering then run for 1768 ms with a shared ease-in-out timeline.
    const drawDuration=isPencil?1400:0,motionDuration=isPencil?1768:3600;
    const duration=drawDuration+motionDuration;
    const svg=el('svg',{viewBox:'0 0 1254 1254',width:'100%',height:'100%',role:'img','aria-label':'Кейс Флорилегия с цветами и наушниками',class:'florilegium-rig','data-rig':'florilegium-styled','data-style':style},container);
    svg.style.cssText='display:block;width:100%;height:100%;overflow:visible;isolation:isolate';
    const defs=el('defs',{},svg);
    // 03 draws the existing closed artwork with a contour and overlapping
    // brush passes. The same group survives the opening: no bitmap swap/fade.
    const drawStrokes=[];
    let drawFull,lastDraw=-1;
    const artwork=isPencil?el('g',{'data-layer':'pencil-artwork',mask:`url(#${uid}-draw-mask)`},svg):svg;
    if(isPencil){
      const mask=el('mask',{id:`${uid}-draw-mask`,'data-layer':'pencil-draw-mask',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:0,y:0,width:1254,height:1254,'mask-type':'luminance'},defs);
      const stroke=(d,width,start,end)=>{
        const node=el('path',{d,fill:'none',stroke:'white','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',pathLength:1,'stroke-dasharray':'1 1','stroke-dashoffset':1,opacity:0,'data-draw-stroke':drawStrokes.length},mask);
        drawStrokes.push({node,start,end});
      };
      stroke('M 447 365 C 306 365 229 449 229 590 L 229 942 C 229 1105 288 1158 445 1158 H 808 C 963 1158 1022 1103 1022 944 V 590 C 1022 449 944 365 804 365 Z',24,0,.62);
      stroke('M 231 590 C 243 654 1008 654 1020 590',22,.12,.66);
      for(let i=0;i<8;i++){
        const y=400+i*105;
        const d=i%2?`M 1100 ${y-22} C 830 ${y-8} 450 ${y+8} 150 ${y+20}`:`M 150 ${y+20} C 450 ${y+8} 830 ${y-8} 1100 ${y-22}`;
        stroke(d,160,.10+i*.085,.34+i*.09);
      }
      // The closed silhouette is fully painted before this rect unlocks the
      // empty area above it, where the lid and flowers will subsequently move.
      drawFull=el('rect',{width:1254,height:1254,fill:'white',opacity:0,'data-draw-full':'true'},mask);
    }
    function renderDraw(p){
      if(!isPencil||p===lastDraw)return;
      lastDraw=p;
      for(const {node,start,end}of drawStrokes){
        const t=phase(p,start,end);
        node.setAttribute('stroke-dashoffset',(1-t).toFixed(6));
        node.setAttribute('opacity',t>0?1:0);
      }
      drawFull?.setAttribute('opacity',p>=1?1:0);
      // A completely white mask and no mask have identical coverage. Drop
      // its compositing cost while the lid/flowers are moving, restore on seek.
      artwork.setAttribute('mask',p>=1?'none':`url(#${uid}-draw-mask)`);
    }
    svg.dataset.duration=String(duration);
    svg.dataset.drawDuration=String(drawDuration);
    svg.dataset.motionDuration=String(motionDuration);
    // Variant 02: solid media symbols fly from behind the case as its lid opens.
    // It is part of the same seekable timeline, behind every case surface.
    const mediaIcons=[];
    if(style==='flat'){
      const background=el('g',{'data-layer':'media-background','aria-hidden':'true','pointer-events':'none',fill:'#a8bdcf'},svg);
      const icons=[
        {name:'play',x:110,y:235,ox:500,oy:750,cx:360,cy:230,size:170,angle:-18,delay:0,d:'M 6 3.5 Q 6 2 7.5 3 L 21 11 Q 22.5 12 21 13 L 7.5 21 Q 6 22 6 20.5 Z'},
        {name:'video',x:1095,y:140,ox:740,oy:720,cx:1015,cy:240,size:185,angle:15,delay:.012,d:'M 3 5 H 14 Q 17 5 17 8 V 16 Q 17 19 14 19 H 3 Q 0 19 0 16 V 8 Q 0 5 3 5 Z M 18 9 L 23 6 Q 24 5.5 24 7 V 17 Q 24 18.5 23 18 L 18 15 Z'},
        {name:'microphone',x:60,y:635,ox:480,oy:810,cx:175,cy:720,size:150,angle:-13,delay:.022,d:'M 9 3 Q 9 0 12 0 Q 15 0 15 3 V 12 Q 15 15 12 15 Q 9 15 9 12 Z M 5 10 H 7 V 12 A 5 5 0 0 0 17 12 V 10 H 19 V 12 A 7 7 0 0 1 13 18.93 V 21 H 17 V 24 H 7 V 21 H 11 V 18.93 A 7 7 0 0 1 5 12 Z'},
        {name:'bookmark',x:1170,y:780,ox:790,oy:790,cx:1060,cy:675,size:145,angle:19,delay:.008,d:'M 6 1 H 18 Q 20 1 20 3 V 23 L 12 17.5 L 4 23 V 3 Q 4 1 6 1 Z'},
        {name:'book',x:155,y:1070,ox:490,oy:870,cx:260,cy:925,size:200,angle:-20,delay:.018,d:'M 1 3 Q 7 1 11 4 V 22 Q 7 19 1 21 Z M 13 4 Q 17 1 23 3 V 21 Q 17 19 13 22 Z'},
        {name:'waveform',x:1115,y:1130,ox:775,oy:900,cx:1005,cy:1000,size:190,angle:12,delay:.028,d:'M 0 9 H 3 V 15 H 0 Z M 5 5 H 8 V 19 H 5 Z M 10.5 0 H 13.5 V 24 H 10.5 Z M 16 5 H 19 V 19 H 16 Z M 21 9 H 24 V 15 H 21 Z'},
        {name:'note',x:625,y:70,ox:625,oy:740,cx:625,cy:180,size:145,angle:16,delay:.006,d:'M 9 4 L 22 1 V 17 A 4.5 3.5 0 1 1 19 13.7 V 7 L 12 8.6 V 20 A 4.5 3.5 0 1 1 9 16.7 Z'}
      ];
      for(const icon of icons){
        const group=el('g',{'data-media-icon':icon.name,opacity:0},background);
        el('path',{d:icon.d},group);mediaIcons.push({...icon,group});
      }
    }
    const orbitRoute=['note','video','bookmark','waveform','book','microphone','play'].map(name=>mediaIcons.find(icon=>icon.name===name));
    // A two-minute loop follows the existing arrangement around the case.
    // Smooth tangents join the last point back to the first without a reset.
    function orbitPosition(index,elapsed){
      const eased=elapsed-500*(1-Math.exp(-elapsed/500));
      const position=index+eased/120000*orbitRoute.length;
      const i=Math.floor(position),t=position-i,n=orbitRoute.length;
      const [a,b,c,d]=[-1,0,1,2].map(offset=>orbitRoute[((i+offset)%n+n)%n]);
      const interpolate=key=>.5*((2*b[key])+(-a[key]+c[key])*t+(2*a[key]-5*b[key]+4*c[key]-d[key])*t*t+(-a[key]+3*b[key]-3*c[key]+d[key])*t*t*t);
      return {x:interpolate('x'),y:interpolate('y'),tilt:4*Math.sin(eased/16000+index)-4*Math.sin(index)};
    }
    function renderBackground(p,extra=0){
      for(const icon of mediaIcons){
        const t=phase(p,.055+icon.delay,.535+icon.delay);
        const travel=1-Math.pow(1-t,3),rest=1-travel;
        let x=rest*rest*icon.ox+2*rest*travel*icon.cx+travel*travel*icon.x;
        let y=rest*rest*icon.oy+2*rest*travel*icon.cy+travel*travel*icon.y;
        const scale=(.18+.82*travel)*icon.size/24;
        let angle=icon.angle*(.25+.75*travel);
        if(t>=1&&!reduced?.matches){
          const elapsed=Math.max(0,(p-.535-icon.delay)*duration)+extra;
          const orbit=orbitPosition(orbitRoute.indexOf(icon),elapsed);
          x=orbit.x;y=orbit.y;angle+=orbit.tilt;
        }
        icon.group.setAttribute('opacity',(.62*smooth(phase(t,0,.26))).toFixed(5));
        icon.group.setAttribute('transform',`translate(${x} ${y}) rotate(${angle}) scale(${scale}) translate(-12 -12)`);
      }
    }
    const clip=(name,d)=>{const c=el('clipPath',{id:`${uid}-${name}`,clipPathUnits:'userSpaceOnUse'},defs);const p=el('path',{d:d||''},c);return{path:p,url:`url(#${uid}-${name})`}};
    const image=(parent,kind,attrs={})=>el('image',{href:asset(kind),x:0,y:0,width:1254,height:1254,...attrs},parent);
    const contentShape=clip('drawn-contents',CONTENT_PATHS[style]);
    const contentWindow=clip('cavity-window','M 145 70 H 1115 V 565 L 1013 578 C 1004 608 966 620 891 631 C 749 653 510 650 365 631 C 293 622 248 610 241 578 L 145 565 Z');
    const frontShape=clip('front','M 215 574 L 272 588 C 280 603 298 610 320 613 C 399 627 507 631 627 630 C 750 632 869 625 940 611 C 962 604 976 597 982 587 L 1040 574 V 1254 H 215 Z');
    const mouthShape=clip('mouth','M 215 505 H 1040 V 650 H 215 Z');
    const cavity=el('g',{'clip-path':mouthShape.url,'data-layer':'cavity'},artwork);image(cavity,'empty');
    const cavityShade=el('ellipse',{cx:627,cy:583,rx:340,ry:45,fill:'#062749',opacity:.1},cavity);

    // The same topological construction as the approved animation: two surface
    // clips share one opaque envelope and one moving front edge, never a fade.
    const envelope=clip('lid-envelope'),outerClip=clip('lid-outer'),innerClip=clip('lid-inner');
    const bodyMask=el('mask',{id:`${uid}-body-mask`,maskUnits:'userSpaceOnUse',x:0,y:0,width:1254,height:1254,'mask-type':'luminance'},defs);
    el('rect',{width:1254,height:1254,fill:'white'},bodyMask);
    const horizontal=(cfg.R-cfg.L)/765,offset=cfg.L-245*horizontal;
    const lidTransform=`translate(${offset} 0) scale(${horizontal} 1)`;
    const bodyCover=el('path',{fill:'black',d:'',transform:lidTransform},bodyMask);
    const lid=el('g',{'data-layer':'lid','data-surface-system':'shared-envelope',transform:lidTransform},artwork);
    const lidBase=el('path',{d:'',fill:'#fbfcff'},lid);
    const surfaces=el('g',{'clip-path':envelope.url},lid);
    const outer=el('g',{'clip-path':outerClip.url,'data-layer':'lid-outer'},surfaces);
    const inner=el('g',{'clip-path':innerClip.url,'data-layer':'lid-inner'},surfaces);
    // A sample from the blank front retains the actual pencil grain for the
    // closed outer cap. Its outline is owned by the continuous vector envelope.
    const paperClip=clip('lid-paper-sample','M 290 690 H 960 V 1045 H 290 Z');
    const outerTexture=el('g',{},outer);image(outerTexture,'empty',{'clip-path':paperClip.url});
    const innerBands=[];
    for(let i=0;i<2;i++){
      const y=i?cfg.innerSide-.35:cfg.innerTop-14;
      const bottom=i?cfg.innerBottom+14:cfg.innerSide+.35;
      const cp=clip(`inner-band-${i}`,`M 210 ${y} H 1040 V ${bottom} H 210 Z`);
      const band=el('g',{},inner);image(band,'empty',{'clip-path':cp.url});innerBands.push(band);
    }
    const edgeFade=el('linearGradient',{id:`${uid}-edge-fade`,gradientUnits:'userSpaceOnUse',x1:245,y1:0,x2:1010,y2:0},defs);
    for(const[offset,opacity]of [[0,0],[.04,1],[.96,1],[1,0]])el('stop',{offset,'stop-color':'white','stop-opacity':opacity},edgeFade);
    const edgeMask=el('mask',{id:`${uid}-edge-mask`,maskUnits:'userSpaceOnUse',x:220,y:0,width:820,height:700},defs);
    el('rect',{x:220,y:0,width:820,height:700,fill:`url(#${uid}-edge-fade)`},edgeMask);
    const seam=el('path',{d:'',fill:'none',stroke:cfg.stroke,'stroke-width':cfg.weight,'stroke-linecap':'butt',mask:`url(#${uid}-edge-mask)`,'data-layer':'lid-front-edge'},surfaces);
    const outline=el('path',{d:'',fill:'none',stroke:cfg.stroke,'stroke-width':cfg.weight*2,'stroke-linejoin':'round','clip-path':envelope.url,'data-layer':'lid-outline'},lid);
    if(style==='pencil'){
      const f=el('filter',{id:`${uid}-pencil-edge`,x:'-5%',y:'-5%',width:'110%',height:'110%'},defs);
      el('feTurbulence',{type:'fractalNoise',baseFrequency:.16,numOctaves:1,seed:17,result:'grain'},f);
      el('feDisplacementMap',{in:'SourceGraphic',in2:'grain',scale:1.8,xChannelSelector:'R',yChannelSelector:'G'},f);
      outline.setAttribute('filter',`url(#${uid}-pencil-edge)`);
    }
    function renderLid(open){
      const g=window.florilegiumLidGeometry(open);
      for(const p of [envelope.path,lidBase,outline,bodyCover])p.setAttribute('d',g.outline);
      outerClip.path.setAttribute('d',g.outer);innerClip.path.setAttribute('d',g.inner);
      outerClip.path.setAttribute('transform','translate(0 1.3)');
      const bleed=14;
      const sx=(g.R-g.L+2*bleed)/670,sy=(g.B-g.T+2*bleed)/355;
      outerTexture.setAttribute('transform',`translate(${g.L-bleed-290*sx} ${g.T-bleed-690*sy}) scale(${sx} ${sy})`);
      const innerX=(g.R-g.L+2*bleed)/756,tx=g.L-bleed-244*innerX;
      const sy0=(g.S-g.T+bleed)/(cfg.innerSide-cfg.innerTop),sy1=(g.B+bleed-g.S)/(cfg.innerBottom-cfg.innerSide);
      innerBands[0].setAttribute('transform',`translate(${tx} ${g.T-bleed-cfg.innerTop*sy0}) scale(${innerX} ${sy0})`);
      innerBands[1].setAttribute('transform',`translate(${tx} ${g.S-cfg.innerSide*sy1}) scale(${innerX} ${sy1})`);
      seam.setAttribute('d',g.edge);lid.dataset.open=g.h.toFixed(5);lid.dataset.reveal=g.u.toFixed(5);
      return g;
    }

    const content=el('g',{'clip-path':contentWindow.url,'data-layer':'contents'},artwork);
    const bloom=el('g',{'data-layer':'bouquet-and-earbuds'},content);
    const stems=el('g',{'data-layer':'stem-extensions'},bloom);
    for(const[x,c]of [[390,'#58952c'],[627,'#6eab2e'],[859,'#619b27']]){
      el('path',{d:`M ${x} 600 Q ${x-8} 740 ${x+5} 1005`,fill:'none',stroke:style==='pencil'?'#4d853e':c,'stroke-width':style==='flat'?15:12,'stroke-linecap':'round'},stems);
    }
    image(bloom,'reference',{'clip-path':contentShape.url,'data-layer':'selected-artwork'});
    const front=el('g',{'clip-path':frontShape.url,mask:`url(#${uid}-body-mask)`,'data-layer':'front-shell'},artwork);
    image(front,'empty');
    // Entire front lip remains above the emerging contents, including its white
    // thickness. There is no transparent layer swap at the end of the opening.
    const frontRim=el('g',{'data-layer':'front-rim'},front);
    const rimShape=clip('rim-only','M 215 574 H 1040 V 657 H 215 Z');
    image(frontRim,'empty',{'clip-path':rimShape.url});
    const lettering=window.createFlorilegiumStyledLettering(defs,artwork,uid,{style,effect:options.letterEffect||({flat:'reveal',pencil:'sheen',line:'wave'})[style]});
    function render(value){
      progress=clamp(Number(value)||0);
      const drawProgress=isPencil?phase(progress*duration,0,drawDuration):1;
      const motionProgress=isPencil?smooth(phase(progress*duration,drawDuration,duration)):progress;
      renderDraw(drawProgress);
      const t=phase(motionProgress,isPencil?0:.055,.455),open=mode==='mask'&&!isPencil?1-(1-phase(motionProgress,.10,.48))**3:smooth(t);
      renderLid(open);cavityShade.setAttribute('opacity',.12*(1-open));
      const bt=phase(motionProgress,.26,.73),rise=spring(bt),sway=Math.sin(bt*Math.PI*3)*(1-bt)*.8;
      // Keep the artwork's cut lower edge buried in the case during the bounce.
      // A small stretch above the rim retains the upward spring of the flowers
      // without lifting their cropped base (or the sampled white lip) into view.
      const stretch=1+355*Math.max(0,rise-1)/325;
      const radians=sway*Math.PI/180;
      const swayPad=430*Math.abs(Math.sin(radians))+80*(1-Math.cos(radians));
      const lift=355*Math.max(0,1-rise)+swayPad;
      bloom.setAttribute('transform',`translate(0 ${lift}) rotate(${sway} 627 625) translate(0 570) scale(1 ${stretch}) translate(0 -570)`);
      bloom.setAttribute('opacity',smooth(phase(motionProgress,.245,.32)));
      lettering.update(motionProgress);
      renderBackground(motionProgress,ambientElapsed);
      svg.dataset.progress=progress.toFixed(4);svg.dataset.lidOpen=open.toFixed(5);
      svg.dataset.drawProgress=drawProgress.toFixed(5);svg.dataset.motionProgress=motionProgress.toFixed(5);
      svg.dataset.phase=isPencil&&drawProgress<1?'drawing':motionProgress<.07?'closed':motionProgress<.25?'lid-opening':motionProgress<.73?'bloom':motionProgress<.97?'lettering':'open';
      options.onProgress?.(progress);
    }
    function pause(){playing=false;orbiting=false;previous=null;cancelAnimationFrame(raf);if(!document.hidden)ambientWanted=false;svg.dataset.playing='false';svg.dataset.orbiting='false';}
    function startOrbit(){
      if(disposed||style!=='flat'||progress<1||document.hidden||reduced?.matches||orbiting)return;
      ambientWanted=true;orbiting=true;previous=performance.now();svg.dataset.orbiting='true';raf=requestAnimationFrame(tick);
    }
    function tick(now){
      if((!playing&&!orbiting)||disposed)return;
      if(previous===null)previous=now;
      const dt=Math.max(0,now-previous);previous=now;
      if(playing){
        render(progress+dt*speed/duration);
        if(progress>=1){
          playing=false;previous=null;svg.dataset.playing='false';options.onComplete?.();
          startOrbit();return;
        }
      }else{
        ambientElapsed+=dt;
        renderBackground(1,ambientElapsed);
        svg.dataset.ambientElapsed=ambientElapsed.toFixed(1);
      }
      raf=requestAnimationFrame(tick);
    }
    function play(){if(disposed||playing)return;cancelAnimationFrame(raf);orbiting=false;ambientWanted=false;ambientElapsed=0;svg.dataset.orbiting='false';svg.dataset.ambientElapsed='0';if(progress>=.9999)render(0);playing=true;previous=isPencil?performance.now():null;svg.dataset.playing='true';raf=requestAnimationFrame(tick);}
    const visibility=()=>{if(document.hidden)pause();else if(ambientWanted)startOrbit()};
    const motionPreference=()=>{if(reduced.matches){pause();render(progress);}else if(progress>=1)startOrbit();};
    reduced?.addEventListener?.('change',motionPreference);
    document.addEventListener('visibilitychange',visibility);render(0);
    return{svg,play,pause,seek(p){pause();ambientWanted=false;ambientElapsed=0;svg.dataset.ambientElapsed='0';render(p)},getProgress(){return progress},setMode(v){mode=v==='mask'?'mask':'hinge';render(progress)},setSpeed(v){speed=clamp(Number(v)||1,.15,3)},destroy(){disposed=true;pause();document.removeEventListener('visibilitychange',visibility);reduced?.removeEventListener?.('change',motionPreference);svg.remove()}};
  };
})();
