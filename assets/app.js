(function(){
  "use strict";
  var $=function(s,c){return (c||document).querySelector(s);};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};

  /* mobile menu */
  var burger=$("#burger"), menu=$("#menu");
  if(burger&&menu){
    burger.addEventListener("click",function(){
      var open=menu.classList.toggle("open");
      burger.setAttribute("aria-expanded",open?"true":"false");
      burger.setAttribute("aria-label",open?"關閉選單":"開啟選單");
    });
    $$("a",menu).forEach(function(a){a.addEventListener("click",function(){
      menu.classList.remove("open");burger.setAttribute("aria-expanded","false");
    });});
  }

  /* accordion */
  $$(".acc__q").forEach(function(q){
    q.addEventListener("click",function(){
      var open=q.getAttribute("aria-expanded")==="true";
      var a=q.nextElementSibling;
      q.setAttribute("aria-expanded",open?"false":"true");
      a.style.maxHeight=open?null:a.scrollHeight+"px";
    });
  });

  /* counters */
  var stats=$("#stats");
  var counted=false;
  function runCount(){
    if(counted)return;counted=true;
    $$(".num",stats).forEach(function(el){
      var to=parseFloat(el.getAttribute("data-to"))||0;
      var suf=el.getAttribute("data-suffix")||"";
      var dur=1200,t0=null;
      function step(ts){
        if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);
        var ease=1-Math.pow(1-p,3);
        el.textContent=(Math.round(to*ease*10)/10).toString().replace(/\.0$/,"")+suf;
        if(p<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  if(stats&&"IntersectionObserver" in window){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)runCount();});},{threshold:.4});
    so.observe(stats);
  }else{runCount();}

  /* reviews dots */
  var track=$("#revTrack"), dotsBox=$("#revDots");
  if(track&&dotsBox){
    var cards=$$(".rev",track);
    cards.forEach(function(_,i){
      var b=document.createElement("button");
      b.setAttribute("aria-label","跳至第 "+(i+1)+" 則評價");
      if(i===0)b.setAttribute("aria-current","true");
      b.addEventListener("click",function(){
        cards[i].scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
      });
      dotsBox.appendChild(b);
    });
    var dots=$$("button",dotsBox);
    track.addEventListener("scroll",function(){
      var c=track.scrollLeft+track.clientWidth/2,best=0,bd=1e9;
      cards.forEach(function(card,i){
        var cc=card.offsetLeft+card.clientWidth/2,d=Math.abs(cc-c);
        if(d<bd){bd=d;best=i;}
      });
      dots.forEach(function(d,i){i===best?d.setAttribute("aria-current","true"):d.removeAttribute("aria-current");});
    },{passive:true});
  }


  /* star ratings */
  $$(".stars[data-rating]").forEach(function(s){
    var r=parseFloat(s.getAttribute("data-rating"))||5;
    s.style.setProperty("--p",(r/5*100)+"%");
  });

  /* back to top */
  var totop=$("#totop");
  if(totop){
    window.addEventListener("scroll",function(){
      totop.classList.toggle("show",window.scrollY>window.innerHeight*0.9);
    },{passive:true});
    totop.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
  }

  /* add-to-cart toast (demo) */
  var toast=$("#toast"),tt;
  function showToast(msg){
    if(!toast)return;toast.textContent=msg;toast.classList.add("show");
    clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove("show");},2200);
  }
  $$(".add").forEach(function(b){
    b.addEventListener("click",function(){
      var n=b.getAttribute("data-name")||"商品";
      showToast("已將「"+n+"」加入訂單　（示範）");
    });
  });

  /* scroll reveal */
  var targets=$$(".card, .sec-head, .hero__copy, .hero__media, .steps li, .stat");
  targets.forEach(function(t){t.classList.add("reveal");});
  if("IntersectionObserver" in window){
    var ro=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");ro.unobserve(e.target);}});
    },{threshold:.12});
    targets.forEach(function(t){ro.observe(t);});
  }else{targets.forEach(function(t){t.classList.add("in");});}
})();
