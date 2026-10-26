/* Atlas: movimento e gatilhos de ação. Tudo é aprimoramento: sem JS, o site continua legível. */
(function(){
  var d=document,root=d.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* Avisos com data de validade: somem sozinhos depois do prazo (evita urgência desatualizada) */
  d.querySelectorAll('[data-until]').forEach(function(el){var u=new Date(el.getAttribute('data-until')+'T23:59:59');if(Date.now()>u.getTime())el.hidden=true});

  /* Gradiente de meta: barra de leitura */
  var bar=d.createElement('div');bar.className='readBar';bar.setAttribute('aria-hidden','true');d.body.appendChild(bar);

  /* Gatilho de ação: atalho para o próximo passo, só depois de o leitor avançar */
  var next=d.body.getAttribute('data-next'),pill=null,dismissed=false;
  if(next){
    pill=d.createElement('div');pill.className='nextPill';
    var a=d.createElement('a');a.href=next;a.textContent=(d.body.getAttribute('data-next-label')||'Próximo passo')+' →';
    var x=d.createElement('button');x.type='button';x.setAttribute('aria-label','Dispensar atalho');x.textContent='×';
    x.onclick=function(){dismissed=true;pill.classList.remove('on')};
    pill.appendChild(a);pill.appendChild(x);d.body.appendChild(pill);
  }
  function onScroll(){
    var h=root.scrollHeight-innerHeight,p=h>0?Math.min(1,scrollY/h):0;
    bar.style.transform='scaleX('+p+')';
    if(pill&&!dismissed)pill.classList.toggle('on',p>.3&&p<.93);
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* Pop (cartões) e Ascensão (títulos), ao entrar na tela */
  if(!reduce&&'IntersectionObserver' in window){
    var pops=d.querySelectorAll('.card,.homeCard,.sourceCard,.step,.newsItem,.deepDive,.story');
    pops.forEach(function(el,i){
      el.classList.add('pop');
      var sib=Array.prototype.indexOf.call(el.parentNode.children,el);
      el.style.setProperty('--d',Math.min(sib,6)*70+'ms');
    });
    d.querySelectorAll('.pageWrap h2').forEach(function(h){
      if(h.children.length||!h.textContent.trim())return;
      var words=h.textContent.trim().split(/\s+/);h.textContent='';h.classList.add('asc');
      words.forEach(function(w,i){
        var s=d.createElement('span');s.className='w';s.style.setProperty('--i',i);
        var t=d.createElement('i');t.textContent=w;s.appendChild(t);h.appendChild(s);
        if(i<words.length-1)h.appendChild(d.createTextNode(' '));
      });
    });
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    d.querySelectorAll('.pop,h2.asc').forEach(function(el){io.observe(el)});
    setTimeout(function(){d.querySelectorAll('.pop,h2.asc').forEach(function(el){el.classList.add('in')})},6000);
  }

  /* Máquina de escrever: frases alternadas (separadas por |) ou texto único */
  d.querySelectorAll('.typeCue').forEach(function(el){
    var raw=el.getAttribute('data-phrases')||el.textContent;
    var phrases=raw.split('|').map(function(s){return s.trim()}).filter(Boolean);
    if(!phrases.length)return;
    if(reduce){el.textContent=phrases[0];return}
    el.classList.add('live');el.textContent='';
    var pi=0,ci=0,del=false;
    (function tick(){
      var p=phrases[pi],wait=del?18:38;
      if(!del){ci++;el.textContent=p.slice(0,ci);if(ci===p.length){if(phrases.length===1)return;del=true;wait=1900}}
      else{ci--;el.textContent=p.slice(0,ci);if(ci===0){del=false;pi=(pi+1)%phrases.length;wait=350}}
      setTimeout(tick,wait);
    })();
  });

  /* Combinar e mover: o título do cartão clicado vira o título da página seguinte */
  var last=null;
  d.addEventListener('click',function(e){last=e.target.closest&&e.target.closest('a.homeCard,a.card,a.linkbtn')},true);
  addEventListener('pageswap',function(e){
    if(!e.viewTransition||!last)return;
    var t=last.querySelector('h2,h3')||last;t.style.viewTransitionName='matchmove';
  });
  addEventListener('pagereveal',function(e){
    if(!e.viewTransition)return;
    var h=d.querySelector('.pageHero h1');if(!h)return;
    h.style.viewTransitionName='matchmove';
    e.viewTransition.finished.then(function(){h.style.viewTransitionName=''},function(){h.style.viewTransitionName=''});
  });
})();
