/* Atlas: movimento e gatilhos de ação. Tudo é aprimoramento: sem JS, o site continua legível. */
(function(){
  var d=document,root=d.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* Avisos com data de validade: somem sozinhos depois do prazo (evita urgência desatualizada) */
  d.querySelectorAll('[data-until]').forEach(function(el){var u=new Date(el.getAttribute('data-until')+'T23:59:59');if(Date.now()>u.getTime())el.hidden=true});

  d.querySelectorAll('[data-after]').forEach(function(el){var u=new Date(el.getAttribute('data-after')+'T23:59:59');if(Date.now()<=u.getTime())el.hidden=true});

  /* Menu: botão no celular, um grupo aberto por vez, fecha ao clicar fora ou com Esc */
  var nav=d.getElementById('siteNav'),tg=d.querySelector('.navToggle'),groups=d.querySelectorAll('.navGroup');
  var mq=matchMedia('(max-width: 850px)');
  function sync(){groups.forEach(function(g){if(mq.matches)g.setAttribute('open','');else g.removeAttribute('open')});if(!mq.matches&&nav)nav.classList.remove('open')}
  if(nav&&tg){tg.addEventListener('click',function(){var o=nav.classList.toggle('open');tg.setAttribute('aria-expanded',o);tg.textContent=o?'Fechar':'Menu'});sync();mq.addEventListener&&mq.addEventListener('change',sync)}
  groups.forEach(function(g){g.addEventListener('toggle',function(){if(g.open&&!mq.matches)groups.forEach(function(o){if(o!==g)o.removeAttribute('open')})})});
  d.addEventListener('click',function(e){if(!mq.matches&&!e.target.closest('.navGroup'))groups.forEach(function(g){g.removeAttribute('open')})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'){groups.forEach(function(g){if(!mq.matches)g.removeAttribute('open')});if(nav&&nav.classList.contains('open')){nav.classList.remove('open');tg.setAttribute('aria-expanded','false');tg.textContent='Menu';tg.focus()}}});

  /* Gradiente de meta: barra de leitura */
  var bar=d.createElement('div');bar.className='readBar';bar.setAttribute('aria-hidden','true');d.body.appendChild(bar);

  /* Gatilho de ação: atalho para o próximo passo, só depois de o leitor avançar */
  var next=d.body.getAttribute('data-next'),pill=null,dismissed=false;
  if(next){
    pill=d.createElement('div');pill.className='nextPill';pill.setAttribute('role','complementary');pill.setAttribute('aria-label','Atalho para o próximo passo');
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


  /* Linha de leitura, índice "Nesta página" e links "Veja também" */
  var main=d.getElementById('conteudo'),path=location.pathname.replace(/\/$/,'');if(path&&!/\.html$/.test(path))path+='.html';
  if(main){
    var wc=(main.innerText||'').trim().split(/\s+/).length,stamp=main.querySelector('.reviewStamp'),dm=stamp&&stamp.textContent.match(/\d{2}\/\d{2}\/\d{4}/);
    var meta=d.querySelector('.pageMeta');
    if(meta&&wc>250)meta.textContent='Leitura de cerca de '+Math.max(1,Math.round(wc/200))+' min'+(dm?' · Atualizado em '+dm[0]:'');
    var slug=function(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)};
    var hs=[].filter.call(main.querySelectorAll('h2'),function(h){return !h.closest('.ctaBlock,.related,.toc')&&h.textContent.trim()});
    var skip=/\/(index|assistente|sobre|noticias|404)\.html$/.test(path)||path===''||main.querySelector('.tabsBar');
    if(hs.length>=5&&!skip){
      var det=d.createElement('details');det.className='toc';var sm=d.createElement('summary');sm.textContent='Nesta página ('+hs.length+' seções)';det.appendChild(sm);
      var ol=d.createElement('ol'),used={},links=[];
      hs.forEach(function(h){var host=h.closest('section')||h,id=host.id;if(!id){id=slug(h.textContent)||'secao';var base=id,n=2;while(d.getElementById(id)||used[id])id=base+'-'+n++;host.id=id}used[id]=1;
        var li=d.createElement('li'),a=d.createElement('a');a.href='#'+id;a.textContent=h.textContent.trim();li.appendChild(a);ol.appendChild(li);links.push([a,host])});
      det.appendChild(ol);main.insertBefore(det,main.firstChild);
      if(!matchMedia('(max-width: 700px)').matches)det.setAttribute('open','');
      if('IntersectionObserver' in window){var spy=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l[0].classList.toggle('on',l[1]===e.target)})}})},{rootMargin:'-20% 0px -70% 0px'});links.forEach(function(l){spy.observe(l[1])})}
    }
    var T={'/empresa.html':['Débitos e regularização','Órgão, fase e opções'],'/execucao-fiscal.html':['Execução fiscal','Processo, CDAs e negociação'],'/inadimplencia.html':['Se a empresa não regulariza','O que acontece, fase a fase'],'/parr.html':['PARR','Quando a dívida chega ao sócio'],'/gestao.html':['Gestão fiscal','Prazos, responsáveis e provas'],'/regimes.html':['Regimes e rotina','MEI, Simples, Presumido e Real'],'/reforma.html':['Reforma Tributária','Por que existe e o que muda'],'/escala-6x1.html':['Fim da escala 6x1','EC 141/2026 e seus impactos'],'/trabalho-empresa.html':['CLT, PJ e responsabilidades','Carteira, prós e contras'],'/tributario.html':['Direito tributário','De onde vêm as regras'],'/previdenciario.html':['Direito previdenciário','Folha, custeio e benefícios'],'/administrativo.html':['Direito administrativo','Como o Estado age e se controla'],'/processos.html':['Processos e áreas','Material × formal'],'/biblioteca.html':['Legislação e jurisprudência','Textos oficiais e precedentes'],'/assistente.html':['Assistente educativo','Triagem e busca'],'/noticias.html':['Radar de novidades','Publicações oficiais'],'/fontes.html':['Fontes e livros','Onde confirmar'],'/areas.html':['Navegar por área','Pelo ramo do Direito'],'/mudancas.html':['O que mudou','Mudanças recentes, com fonte']};
    var R={'/empresa.html':['/execucao-fiscal.html','/inadimplencia.html','/parr.html'],'/execucao-fiscal.html':['/inadimplencia.html','/parr.html','/processos.html'],'/inadimplencia.html':['/execucao-fiscal.html','/parr.html','/regimes.html'],'/parr.html':['/inadimplencia.html','/execucao-fiscal.html','/tributario.html'],'/gestao.html':['/empresa.html','/trabalho-empresa.html','/previdenciario.html'],'/regimes.html':['/reforma.html','/escala-6x1.html','/trabalho-empresa.html'],'/reforma.html':['/regimes.html','/escala-6x1.html','/trabalho-empresa.html'],'/escala-6x1.html':['/trabalho-empresa.html','/regimes.html','/previdenciario.html'],'/trabalho-empresa.html':['/escala-6x1.html','/previdenciario.html','/reforma.html'],'/tributario.html':['/reforma.html','/administrativo.html','/execucao-fiscal.html'],'/previdenciario.html':['/trabalho-empresa.html','/gestao.html','/administrativo.html'],'/administrativo.html':['/processos.html','/tributario.html','/execucao-fiscal.html'],'/processos.html':['/administrativo.html','/execucao-fiscal.html','/biblioteca.html'],'/biblioteca.html':['/tributario.html','/trabalho-empresa.html','/assistente.html'],'/fontes.html':['/biblioteca.html','/noticias.html','/assistente.html'],'/noticias.html':['/mudancas.html','/reforma.html','/escala-6x1.html'],'/areas.html':['/assistente.html','/biblioteca.html','/fontes.html'],'/artigos.html':['/reforma.html','/empresa.html','/assistente.html'],'/mudancas.html':['/reforma.html','/regimes.html','/escala-6x1.html']};
    var rel=R[path]||(path.indexOf('/artigos/')===0?['/reforma.html','/empresa.html','/assistente.html']:null);
    if(rel){var asd=d.createElement('aside');asd.className='related';asd.setAttribute('aria-label','Veja também');var g='';rel.forEach(function(u){var t=T[u];if(t&&u!==path)g+='<a href="'+u+'"><b>'+t[0]+'</b><span>'+t[1]+'</span></a>'});
      if(g){asd.innerHTML='<h2>Veja também</h2><div class="relGrid">'+g+'</div>';main.insertBefore(asd,(stamp&&stamp.parentNode===main)?stamp:null)}}
  }

  /* Pop (cartões) e Ascensão (títulos), ao entrar na tela */
  if(!reduce&&'IntersectionObserver' in window){
    var pops=d.querySelectorAll('.card,.homeCard,.door,.sourceCard,.step,.newsItem,.deepDive,.story');
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
  d.addEventListener('click',function(e){last=e.target.closest&&e.target.closest('a.homeCard,a.card,a.linkbtn,.door li a')},true);
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
