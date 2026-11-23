/* Prumo · comportamento comum a todas as páginas.
   Tudo é aprimoramento: sem JavaScript o site continua legível e navegável. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  /* Avisos com data de validade: somem sozinhos depois do prazo (evita urgência desatualizada) */
  d.querySelectorAll('[data-until]').forEach(function (el) {
    if (Date.now() > new Date(el.getAttribute('data-until') + 'T23:59:59').getTime()) el.hidden = true;
  });
  d.querySelectorAll('[data-after]').forEach(function (el) {
    if (Date.now() <= new Date(el.getAttribute('data-after') + 'T23:59:59').getTime()) el.hidden = true;
  });

  /* Tema claro/escuro: segue o aparelho até a pessoa escolher; a escolha fica só neste navegador */
  var themeBtn = d.getElementById('themeToggle');
  function currentTheme() {
    return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function paintThemeButton() {
    if (!themeBtn) return;
    var dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeBtn.setAttribute('aria-label', dark ? 'Usar tema claro' : 'Usar tema escuro');
    themeBtn.title = dark ? 'Usar tema claro' : 'Usar tema escuro';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('prumo-tema', next); } catch (e) {}
      paintThemeButton();
    });
    paintThemeButton();
  }

  /* Menu: botão no celular, um grupo aberto por vez, fecha ao clicar fora ou com Esc */
  var nav = d.getElementById('siteNav'), tg = d.querySelector('.navToggle'), groups = d.querySelectorAll('.navGroup');
  var mq = matchMedia('(max-width: 900px)');
  function sync() {
    groups.forEach(function (g) { if (mq.matches) g.setAttribute('open', ''); else g.removeAttribute('open'); });
    if (!mq.matches && nav) { nav.classList.remove('open'); if (tg) { tg.setAttribute('aria-expanded', 'false'); tg.textContent = 'Menu'; } }
  }
  if (nav && tg) {
    tg.addEventListener('click', function () {
      var o = nav.classList.toggle('open');
      tg.setAttribute('aria-expanded', o ? 'true' : 'false');
      tg.textContent = o ? 'Fechar' : 'Menu';
    });
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
  }
  groups.forEach(function (g) {
    g.addEventListener('toggle', function () {
      if (g.open && !mq.matches) groups.forEach(function (o) { if (o !== g) o.removeAttribute('open'); });
    });
  });
  d.addEventListener('click', function (e) {
    if (!mq.matches && !e.target.closest('.navGroup')) groups.forEach(function (g) { g.removeAttribute('open'); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openGroup = null;
    groups.forEach(function (g) { if (!mq.matches && g.open) { openGroup = g; g.removeAttribute('open'); } });
    if (openGroup) { openGroup.querySelector('summary').focus(); return; }
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.textContent = 'Menu'; tg.focus();
    }
  });

  /* Barra de leitura discreta */
  var bar = d.createElement('div'); bar.className = 'readBar'; bar.setAttribute('aria-hidden', 'true'); d.body.appendChild(bar);

  /* Atalho para o próximo passo, só depois de o leitor avançar e antes do fim */
  var next = d.body.getAttribute('data-next'), pill = null, dismissed = false;
  if (next) {
    pill = d.createElement('div'); pill.className = 'nextPill'; pill.setAttribute('role', 'complementary'); pill.setAttribute('aria-label', 'Atalho para o próximo passo');
    var a = d.createElement('a'); a.href = next; a.textContent = (d.body.getAttribute('data-next-label') || 'Próximo passo') + ' →';
    var x = d.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Dispensar atalho'); x.textContent = '×';
    x.onclick = function () { dismissed = true; pill.classList.remove('on'); };
    pill.appendChild(a); pill.appendChild(x); d.body.appendChild(pill);
  }
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = root.scrollHeight - innerHeight, p = h > 0 ? Math.min(1, scrollY / h) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
    if (pill && !dismissed) pill.classList.toggle('on', p > .3 && p < .93);
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Tempo de leitura, índice "Nesta página" e links "Veja também" */
  var main = d.getElementById('conteudo'), path = location.pathname.replace(/\/$/, '');
  if (path && !/\.html$/.test(path)) path += '.html';
  if (main) {
    var wc = (main.innerText || '').trim().split(/\s+/).length, stamp = main.querySelector('.reviewStamp'),
        dm = stamp && stamp.textContent.match(/\d{2}\/\d{2}\/\d{4}/), meta = d.querySelector('.pageMeta');
    if (meta && wc > 250) meta.textContent = 'Leitura de cerca de ' + Math.max(1, Math.round(wc / 200)) + ' min' + (dm ? ' · Revisado em ' + dm[0] : '');
    else if (meta && dm) meta.textContent = 'Revisado em ' + dm[0];

    var slug = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42); };
    var hs = [].filter.call(main.querySelectorAll('h2'), function (h) { return !h.closest('.ctaBlock,.related,.toc,.whyBox') && h.textContent.trim(); });
    var skip = /\/(index|assistente|sobre|noticias|404)\.html$/.test(path) || path === '' || main.querySelector('.tabsBar');
    if (hs.length >= 4 && !skip) {
      var det = d.createElement('details'); det.className = 'toc';
      var sm = d.createElement('summary'); sm.textContent = 'Nesta página · ' + hs.length + ' seções'; det.appendChild(sm);
      var ol = d.createElement('ol'), used = {}, links = [];
      hs.forEach(function (h) {
        var host = h.closest('section') || h, id = host.id;
        if (!id) { id = slug(h.textContent) || 'secao'; var base = id, n = 2; while (d.getElementById(id) || used[id]) id = base + '-' + n++; host.id = id; }
        used[id] = 1;
        var li = d.createElement('li'), l = d.createElement('a'); l.href = '#' + id; l.textContent = h.textContent.trim();
        li.appendChild(l); ol.appendChild(li); links.push([l, host]);
      });
      det.appendChild(ol);
      var firstSection = main.querySelector(':scope > .section, :scope > section');
      main.insertBefore(det, firstSection || main.firstChild);
      if (!matchMedia('(max-width: 700px)').matches) det.setAttribute('open', '');
      if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (l) { l[0].classList.toggle('on', l[1] === e.target); if (l[1] === e.target) l[0].setAttribute('aria-current', 'location'); else l[0].removeAttribute('aria-current'); }); });
        }, { rootMargin: '-20% 0px -70% 0px' });
        links.forEach(function (l) { spy.observe(l[1]); });
      }
    }

    var T = {'/empresa.html':['Débitos e regularização','Órgão, fase e opções'],'/execucao-fiscal.html':['Execução fiscal','Processo, CDAs e negociação'],'/inadimplencia.html':['Se a empresa não regulariza','O que acontece, fase a fase'],'/parr.html':['PARR','Quando a dívida chega ao sócio'],'/gestao.html':['Gestão fiscal','Prazos, responsáveis e provas'],'/regimes.html':['Regimes e rotina','MEI, Simples, Presumido e Real'],'/reforma.html':['Reforma Tributária','Por que existe e o que muda'],'/escala-6x1.html':['Fim da escala 6x1','EC 141/2026 e seus impactos'],'/trabalho-empresa.html':['CLT, PJ e responsabilidades','Carteira, prós e contras'],'/tributario.html':['Direito tributário','De onde vêm as regras'],'/previdenciario.html':['Direito previdenciário','Folha, custeio e benefícios'],'/administrativo.html':['Direito administrativo','Como o Estado age e se controla'],'/processos.html':['Processos e áreas','Material × formal'],'/biblioteca.html':['Legislação e jurisprudência','Textos oficiais e precedentes'],'/assistente.html':['Assistente educativo','Triagem e busca'],'/noticias.html':['Radar de novidades','Publicações oficiais'],'/fontes.html':['Fontes e livros','Onde confirmar'],'/areas.html':['Navegar por área','Pelo ramo do Direito'],'/mudancas.html':['O que mudou','Mudanças recentes, com fonte']};
    var R = {'/empresa.html':['/execucao-fiscal.html','/inadimplencia.html','/parr.html'],'/execucao-fiscal.html':['/inadimplencia.html','/parr.html','/processos.html'],'/inadimplencia.html':['/execucao-fiscal.html','/parr.html','/regimes.html'],'/parr.html':['/inadimplencia.html','/execucao-fiscal.html','/tributario.html'],'/gestao.html':['/empresa.html','/trabalho-empresa.html','/previdenciario.html'],'/regimes.html':['/reforma.html','/escala-6x1.html','/trabalho-empresa.html'],'/reforma.html':['/regimes.html','/escala-6x1.html','/trabalho-empresa.html'],'/escala-6x1.html':['/trabalho-empresa.html','/regimes.html','/previdenciario.html'],'/trabalho-empresa.html':['/escala-6x1.html','/previdenciario.html','/reforma.html'],'/tributario.html':['/reforma.html','/administrativo.html','/execucao-fiscal.html'],'/previdenciario.html':['/trabalho-empresa.html','/gestao.html','/administrativo.html'],'/administrativo.html':['/processos.html','/tributario.html','/execucao-fiscal.html'],'/processos.html':['/administrativo.html','/execucao-fiscal.html','/biblioteca.html'],'/biblioteca.html':['/tributario.html','/trabalho-empresa.html','/assistente.html'],'/fontes.html':['/biblioteca.html','/noticias.html','/assistente.html'],'/noticias.html':['/mudancas.html','/reforma.html','/escala-6x1.html'],'/areas.html':['/assistente.html','/biblioteca.html','/fontes.html'],'/artigos.html':['/reforma.html','/empresa.html','/assistente.html'],'/mudancas.html':['/reforma.html','/regimes.html','/escala-6x1.html']};
    var rel = R[path] || (path.indexOf('/artigos/') === 0 ? ['/reforma.html', '/empresa.html', '/assistente.html'] : null);
    if (rel) {
      var g = '';
      rel.forEach(function (u) { var t = T[u]; if (t && u !== path) g += '<a href="' + u + '"><b>' + t[0] + '</b><span>' + t[1] + '</span></a>'; });
      if (g) {
        var asd = d.createElement('aside'); asd.className = 'related'; asd.setAttribute('aria-label', 'Veja também');
        asd.innerHTML = '<h2>Veja também</h2><div class="relGrid">' + g + '</div>';
        main.insertBefore(asd, (stamp && stamp.parentNode === main) ? stamp : null);
      }
    }
  }

  /* Frase de apoio do topo da página inicial: mostra a primeira, sem animação de digitação */
  d.querySelectorAll('.typeCue').forEach(function (el) {
    var first = (el.getAttribute('data-phrases') || '').split('|')[0].trim();
    if (first) el.textContent = first;
  });
})();
