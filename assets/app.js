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
  }else if(stats){runCount();}

  /* 評價輪播：滑鼠拖曳 + 箭頭 + 分頁點 + 鍵盤 */
  var track=$("#revTrack"), dotsBox=$("#revDots");
  if(track){
    // 頁式輪播：分頁點數量＝實際可捲動的頁數（依視窗寬度而定），避免「點數與項目對不上」
    var rcards=$$(".rev",track);
    var maxLeft=function(){ return Math.max(0,track.scrollWidth-track.clientWidth); };
    var step=function(){ return rcards.length>1 ? Math.max(1,Math.abs(rcards[1].offsetLeft-rcards[0].offsetLeft)) : Math.max(1,track.clientWidth); };
    var pageCount=function(){ return maxLeft()<=2 ? 1 : Math.ceil(maxLeft()/step()-0.001)+1; };
    var pageLeft=function(i){ return Math.max(0,Math.min(i*step(),maxLeft())); };
    var curPage=function(){ var n=pageCount(),best=0,bd=1e9; for(var i=0;i<n;i++){ var d=Math.abs(track.scrollLeft-pageLeft(i)); if(d<bd){bd=d;best=i;} } return best; };
    var anim=null;
    function glide(target){
      target=Math.max(0,Math.min(target,maxLeft()));
      if(anim)cancelAnimationFrame(anim);
      var start=track.scrollLeft, dist=target-start, t0=null, dur=380;
      if(Math.abs(dist)<1){ sync(); return; }
      function fr(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3); track.scrollLeft=Math.round(start+dist*e); if(p<1){ anim=requestAnimationFrame(fr); } else { anim=null; sync(); } }
      anim=requestAnimationFrame(fr);
    }
    function mkArrow(dir){
      var b=document.createElement("button");
      b.className="carrow carrow--"+dir; b.type="button";
      b.setAttribute("aria-label",dir==="prev"?"上一頁評價":"下一頁評價");
      b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="'+(dir==="prev"?"M15 5l-7 7 7 7":"M9 5l7 7-7 7")+'" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return b;
    }
    var prev=mkArrow("prev"), next=mkArrow("next");
    var ctrl=document.createElement("div"); ctrl.className="revctrl";
    if(dotsBox&&dotsBox.parentNode){ dotsBox.parentNode.insertBefore(ctrl,dotsBox); ctrl.appendChild(prev); ctrl.appendChild(dotsBox); ctrl.appendChild(next); }
    else { track.parentNode.appendChild(ctrl); ctrl.appendChild(prev); ctrl.appendChild(next); }
    prev.addEventListener("click",function(){ glide(pageLeft(curPage()-1)); });
    next.addEventListener("click",function(){ glide(pageLeft(curPage()+1)); });

    var dots=[];
    function buildDots(){
      if(!dotsBox)return;
      var n=pageCount();
      if(dots.length===n)return;
      dotsBox.innerHTML="";
      for(var k=0;k<n;k++){ (function(i){ var b=document.createElement("button"); b.type="button"; b.setAttribute("aria-label","第 "+(i+1)+" 頁評價"); b.addEventListener("click",function(){ glide(pageLeft(i)); }); dotsBox.appendChild(b); })(k); }
      dots=$$("button",dotsBox);
    }
    function sync(){
      var p=curPage();
      dots.forEach(function(d,i){ i===p?d.setAttribute("aria-current","true"):d.removeAttribute("aria-current"); });
      prev.disabled = track.scrollLeft<=2;
      next.disabled = track.scrollLeft >= maxLeft()-2;
    }
    buildDots(); sync();
    track.addEventListener("scroll",sync,{passive:true});
    var _rt; window.addEventListener("resize",function(){ clearTimeout(_rt); _rt=setTimeout(function(){ dots=[]; buildDots(); sync(); },150); });

    /* 滑鼠拖曳（觸控用原生捲動，不攔截） */
    var down=false,sx=0,sl=0,moved=false;
    track.addEventListener("pointerdown",function(e){ if(e.pointerType!=="mouse")return; down=true;moved=false;sx=e.clientX;sl=track.scrollLeft;track.classList.add("grabbing"); try{track.setPointerCapture(e.pointerId);}catch(_){} });
    track.addEventListener("pointermove",function(e){ if(!down)return; var dx=e.clientX-sx; if(Math.abs(dx)>4)moved=true; track.scrollLeft=sl-dx; });
    function pUp(e){ if(!down)return; down=false; track.classList.remove("grabbing"); try{track.releasePointerCapture(e.pointerId);}catch(_){} }
    track.addEventListener("pointerup",pUp); track.addEventListener("pointercancel",pUp); track.addEventListener("pointerleave",pUp);
    track.addEventListener("click",function(e){ if(moved){ e.stopPropagation(); e.preventDefault(); } },true);

    /* 鍵盤左右鍵 */
    track.setAttribute("tabindex","0"); track.setAttribute("role","group"); track.setAttribute("aria-label","評價輪播，可拖曳或用箭頭切換");
    track.addEventListener("keydown",function(e){ if(e.key==="ArrowRight"){next.click();e.preventDefault();} else if(e.key==="ArrowLeft"){prev.click();e.preventDefault();} });
  }

  /* star ratings */
  $$(".stars[data-rating]").forEach(function(s){
    var r=parseFloat(s.getAttribute("data-rating"))||5;
    s.style.setProperty("--p",(r/5*100)+"%");
  });

  /* back to top + floating cta */
  var totop=$("#totop"), floatcta=$(".floatcta");
  if(totop||floatcta){
    window.addEventListener("scroll",function(){
      var past=window.scrollY>window.innerHeight*0.9;
      if(totop)totop.classList.toggle("show",past);
      if(floatcta)floatcta.classList.toggle("show",past);
    },{passive:true});
    if(totop)totop.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
  }

  /* toast */
  var toast=$("#toast"),tt;
  function showToast(msg){
    if(!toast)return;toast.textContent=msg;toast.classList.add("show");
    clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove("show");},2000);
  }

  /* ===================== 購物車 / 結帳（純前端示範） ===================== */
  var body=document.body;
  var CUR=body.getAttribute("data-currency")||"NT$";
  var SHIP_FREE=parseInt(body.getAttribute("data-ship-free")||"990",10);
  var SHIP_FEE=parseInt(body.getAttribute("data-ship-fee")||"150",10);
  var ADD_LABEL=body.getAttribute("data-add-label")||"已加入購物車";
  var CART_TITLE=body.getAttribute("data-cart-title")||"購物車";
  var cart=[]; // {name, price, qty}

  function money(n){ return CUR+" "+Number(n).toLocaleString("en-US"); }
  function totals(){
    var sub=cart.reduce(function(a,i){return a+i.price*i.qty;},0);
    var ship=cart.length?(sub>=SHIP_FREE?0:SHIP_FEE):0;
    return {sub:sub, ship:ship, total:sub+ship, count:cart.reduce(function(a,i){return a+i.qty;},0)};
  }

  // build cart UI
  var bagIcon='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var cartBtn=document.createElement("button");
  cartBtn.className="cartbtn"; cartBtn.id="cartBtn";
  cartBtn.setAttribute("aria-label","開啟購物車");
  cartBtn.innerHTML=bagIcon+'<span class="cartbtn__n" id="cartCount" aria-hidden="true">0</span>';
  var navIn=$(".nav__in");
  if(navIn){ var bg=$("#burger"); navIn.insertBefore(cartBtn, bg||null); }

  var wrap=document.createElement("div");
  wrap.className="cartmodal"; wrap.id="cartModal";
  wrap.innerHTML=
    '<div class="cartmodal__ov" id="cartOv"></div>'+
    '<aside class="cartdrawer" role="dialog" aria-modal="true" aria-label="'+CART_TITLE+'" id="cartDrawer">'+
      '<div class="cartdrawer__hd">'+
        '<h3 id="cartHdTitle">'+CART_TITLE+'</h3>'+
        '<button class="cartdrawer__x" id="cartClose" aria-label="關閉">'+
          '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'+
        '</button>'+
      '</div>'+
      '<div class="cartdrawer__bd" id="cartBody"></div>'+
    '</aside>';
  body.appendChild(wrap);

  var modal=$("#cartModal"), drawer=$("#cartDrawer"), cartBody=$("#cartBody"),
      cartCount=$("#cartCount"), hdTitle=$("#cartHdTitle");
  var view="cart"; var lastOrder=null;

  function openCart(){ modal.classList.add("open"); body.style.overflow="hidden"; render(); var f=drawer.querySelector("button,input,a"); if(f)f.focus(); }
  function closeCart(){ modal.classList.remove("open"); body.style.overflow=""; if(view==="done"){cart=[];view="cart";updateBadge();} cartBtn.focus(); }
  function updateBadge(){ var t=totals(); cartCount.textContent=t.count; cartBtn.classList.toggle("has",t.count>0); }

  function lineRow(it,idx){
    return '<div class="cline">'+
      '<div class="cline__main"><span class="cline__name">'+it.name+'</span><span class="cline__price">'+money(it.price)+'</span></div>'+
      '<div class="cline__ctl">'+
        '<div class="qty">'+
          '<button class="qty__b" data-act="dec" data-i="'+idx+'" aria-label="減少數量">−</button>'+
          '<span class="qty__n" aria-label="數量">'+it.qty+'</span>'+
          '<button class="qty__b" data-act="inc" data-i="'+idx+'" aria-label="增加數量">+</button>'+
        '</div>'+
        '<span class="cline__sum">'+money(it.price*it.qty)+'</span>'+
        '<button class="cline__rm" data-act="rm" data-i="'+idx+'" aria-label="移除">移除</button>'+
      '</div>'+
    '</div>';
  }

  function render(){
    var t=totals();
    if(view==="cart"){
      hdTitle.textContent=CART_TITLE;
      if(!cart.length){
        cartBody.innerHTML='<div class="cempty">'+
          '<p>購物車目前是空的</p>'+
          '<button class="btn btn--cta" id="goShop">去看商品</button>'+
        '</div>';
        $("#goShop").addEventListener("click",function(){closeCart();var m=$("#menu")||$("#products")||$("#cuts")||$("#sets");if(m)m.scrollIntoView({behavior:"smooth"});});
        return;
      }
      var html='<div class="clines">'+cart.map(lineRow).join("")+'</div>'+
        '<div class="csum">'+
          '<div class="csum__row"><span>小計</span><span>'+money(t.sub)+'</span></div>'+
          '<div class="csum__row"><span>運費'+(t.ship===0?'（已達免運）':'')+'</span><span>'+(t.ship===0?'免運':money(t.ship))+'</span></div>'+
          (t.ship!==0?'<p class="csum__hint">再買 '+money(SHIP_FREE-t.sub)+' 即可免運</p>':'')+
          '<div class="csum__row csum__total"><span>合計</span><span>'+money(t.total)+'</span></div>'+
        '</div>'+
        '<button class="btn btn--cta cbtn-full" id="toCheckout">前往結帳</button>'+
        '<p class="cnote">這是設計作品示範，不會真的收費或出貨。</p>';
      cartBody.innerHTML=html;
      $("#toCheckout").addEventListener("click",function(){view="checkout";render();});
    }
    else if(view==="checkout"){
      hdTitle.textContent="結帳";
      cartBody.innerHTML=
        '<form class="cform" id="coForm" novalidate>'+
          '<div class="cobanner">示範結帳：以下不會真的送出、收費或出貨。</div>'+
          '<label class="cfield"><span>收件人姓名</span><input type="text" name="name" autocomplete="off" placeholder="例：王小明" required></label>'+
          '<fieldset class="cfield"><legend>配送方式</legend>'+
            '<label class="copt"><input type="radio" name="ship" value="宅配到府" checked><span>宅配到府</span></label>'+
            '<label class="copt"><input type="radio" name="ship" value="門市自取"><span>門市自取</span></label>'+
          '</fieldset>'+
          '<fieldset class="cfield"><legend>付款方式</legend>'+
            '<label class="copt"><input type="radio" name="pay" value="貨到付款" checked><span>貨到付款</span></label>'+
            '<label class="copt"><input type="radio" name="pay" value="信用卡（示範）"><span>信用卡（示範，不收款）</span></label>'+
          '</fieldset>'+
          '<label class="cfield"><span>訂單備註（選填）</span><textarea name="note" rows="2" placeholder="想跟我們說的話"></textarea></label>'+
          '<div class="csum csum--mini">'+
            '<div class="csum__row"><span>商品（'+t.count+' 件）</span><span>'+money(t.sub)+'</span></div>'+
            '<div class="csum__row"><span>運費</span><span>'+(t.ship===0?'免運':money(t.ship))+'</span></div>'+
            '<div class="csum__row csum__total"><span>應付金額</span><span>'+money(t.total)+'</span></div>'+
          '</div>'+
          '<div class="cactions">'+
            '<button type="button" class="btn btn--ghost" id="backCart">返回購物車</button>'+
            '<button type="submit" class="btn btn--cta">送出訂單（示範）</button>'+
          '</div>'+
        '</form>';
      $("#backCart").addEventListener("click",function(){view="cart";render();});
      $("#coForm").addEventListener("submit",function(e){
        e.preventDefault();
        var f=e.target;
        if(!f.name.value.trim()){ f.name.focus(); f.name.classList.add("err"); return; }
        var no="ORD"+Date.now().toString().slice(-8);
        lastOrder={no:no, name:f.name.value.trim(), ship:f.ship.value, pay:f.pay.value, note:f.note.value.trim(), items:cart.slice(), t:totals()};
        view="done"; render();
      });
    }
    else if(view==="done"){
      hdTitle.textContent="訂單完成";
      var o=lastOrder;
      var rows=o.items.map(function(i){return '<div class="csum__row"><span>'+i.name+' ×'+i.qty+'</span><span>'+money(i.price*i.qty)+'</span></div>';}).join("");
      cartBody.innerHTML=
        '<div class="cdone">'+
          '<div class="cdone__ic"><svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 24l6 6 12-13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
          '<h4>訂單已成立</h4>'+
          '<p class="cdone__no">訂單編號　'+o.no+'</p>'+
          '<div class="cdone__card">'+
            '<div class="csum__row"><span>收件人</span><span>'+o.name+'</span></div>'+
            '<div class="csum__row"><span>配送方式</span><span>'+o.ship+'</span></div>'+
            '<div class="csum__row"><span>付款方式</span><span>'+o.pay+'</span></div>'+
            (o.note?'<div class="csum__row"><span>備註</span><span>'+o.note+'</span></div>':'')+
            '<hr class="cdone__hr">'+rows+
            '<div class="csum__row"><span>運費</span><span>'+(o.t.ship===0?'免運':money(o.t.ship))+'</span></div>'+
            '<div class="csum__row csum__total"><span>實付金額</span><span>'+money(o.t.total)+'</span></div>'+
          '</div>'+
          '<p class="cnote">這是設計作品示範，不會真的成立訂單、收費或出貨。</p>'+
          '<button class="btn btn--cta cbtn-full" id="doneClose">繼續逛逛</button>'+
        '</div>';
      $("#doneClose").addEventListener("click",closeCart);
    }
  }

  // delegated cart controls
  cartBody.addEventListener("click",function(e){
    var b=e.target.closest("[data-act]"); if(!b)return;
    var act=b.getAttribute("data-act"), i=parseInt(b.getAttribute("data-i"),10);
    if(act==="inc")cart[i].qty++;
    else if(act==="dec"){cart[i].qty--; if(cart[i].qty<=0)cart.splice(i,1);}
    else if(act==="rm")cart.splice(i,1);
    updateBadge(); render();
  });

  function addItem(name,price,qty){
    qty=qty||1;
    var ex=cart.filter(function(i){return i.name===name && i.price===price;})[0];
    if(ex)ex.qty+=qty; else cart.push({name:name,price:price,qty:qty});
    updateBadge();
  }
  function priceFrom(btn){
    var card=btn.closest("article")||btn.closest("section")||btn.parentElement;
    var el=card&&(card.querySelector(".plan__price")||card.querySelector(".price")||card.querySelector(".season__price b"));
    if(!el)return NaN;
    return parseInt(el.textContent.replace(/[^\d]/g,""),10);
  }
  function cardQty(btn){
    var card=btn.closest("article")||btn.closest("section")||btn.parentElement;
    var n=card&&card.querySelector(".qtypick__n");
    return n?Math.max(1,parseInt(n.textContent,10)||1):1;
  }

  // on-card quantity pickers
  document.addEventListener("click",function(e){
    var b=e.target.closest(".qtypick__b"); if(!b)return;
    var box=b.closest(".qtypick"), n=box.querySelector(".qtypick__n");
    var v=(parseInt(n.textContent,10)||1)+(b.getAttribute("data-d")==="inc"?1:-1);
    n.textContent=v<1?1:v;
  });

  $$(".add").forEach(function(btn){
    btn.addEventListener("click",function(e){
      e.preventDefault();
      var name=btn.getAttribute("data-name")||"商品";
      var price=priceFrom(btn);
      if(isNaN(price)){ view="cart"; openCart(); return; } // 無價格的 CTA → 直接開購物車
      addItem(name,price,cardQty(btn));
      showToast(ADD_LABEL+"："+name);
      view="cart"; openCart();
    });
  });

  cartBtn.addEventListener("click",function(){view="cart";openCart();});
  $("#cartClose").addEventListener("click",closeCart);
  $("#cartOv").addEventListener("click",closeCart);
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&modal.classList.contains("open"))closeCart(); });
  updateBadge();

  /* 聯絡表單（示範） */
  var cform=$("#contactForm");
  if(cform){
    cform.addEventListener("submit",function(e){
      e.preventDefault();
      var nm=cform.querySelector("[name=name]");
      if(nm&&!nm.value.trim()){nm.focus();nm.classList.add("err");return;}
      cform.innerHTML='<div class="cf-done"><svg viewBox="0 0 48 48" width="50" height="50" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 24l6 6 12-13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>已收到您的訊息</h3><p>這是設計作品示範，不會真的送出或留存資料。我們會盡快與您聯繫。</p></div>';
    });
  }

  /* scroll reveal */
  var targets=$$(".card, .sec-head, .hero__copy, .hero__media, .steps li, .stat, .imgblock, .shopcard");
  targets.forEach(function(t){t.classList.add("reveal");});
  if("IntersectionObserver" in window){
    var ro=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");ro.unobserve(e.target);}});
    },{threshold:.12});
    targets.forEach(function(t){ro.observe(t);});
  }else{targets.forEach(function(t){t.classList.add("in");});}
})();
