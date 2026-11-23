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

  /* Busca em toda página: o botão "Buscar" abre um campo; a pesquisa roda na busca do assistente.
     Sem JavaScript, o botão é só um link para /assistente.html#busca. Atalho: tecla "/". */
  var searchBtn = d.getElementById('searchToggle'), searchDlg = null;
  function openSearch() {
    if (!searchDlg) {
      searchDlg = d.createElement('dialog'); searchDlg.className = 'searchDialog'; searchDlg.setAttribute('aria-label', 'Buscar no Prumo');
      searchDlg.innerHTML = '<form method="get" action="/assistente.html#busca" role="search">' +
        '<label for="buscaGlobal">Buscar no Prumo</label>' +
        '<div class="searchBar"><input id="buscaGlobal" name="q" type="search" minlength="2" maxlength="120" required autocomplete="off" placeholder="Ex.: penhora, CDA, regime do MEI, IBS">' +
        '<button type="submit">Pesquisar</button></div>' +
        '<p class="fine">A busca roda no seu navegador, sobre o conteúdo do Prumo. Não digite CPF, CNPJ ou dados pessoais.</p>' +
        '<button type="button" class="searchClose" aria-label="Fechar a busca">×</button></form>';
      d.body.appendChild(searchDlg);
      searchDlg.querySelector('.searchClose').addEventListener('click', function () { searchDlg.close(); });
      searchDlg.addEventListener('click', function (e) { if (e.target === searchDlg) searchDlg.close(); });
      searchDlg.addEventListener('close', function () { if (searchBtn) searchBtn.focus(); });
    }
    if (typeof searchDlg.showModal === 'function') { searchDlg.showModal(); searchDlg.querySelector('input').focus(); }
    else location.href = '/assistente.html#busca';
  }
  if (searchBtn && !/\/assistente\.html$/.test(location.pathname)) {
    searchBtn.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    e.preventDefault();
    if (/\/assistente\.html$/.test(location.pathname)) { var si = d.getElementById('searchInput'); if (si) { si.focus(); si.scrollIntoView({ block: 'center' }); } }
    else openSearch();
  });

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

    var T = {'/documentos.html':['Que documento é este?','Identifique a carta que chegou'],'/acrescimos.html':['Calculadora de multa e juros','Tributo federal pago em atraso'],'/empresa.html':['Débitos e regularização','Órgão, fase e opções'],'/execucao-fiscal.html':['Execução fiscal','Processo, CDAs e negociação'],'/inadimplencia.html':['Se a empresa não regulariza','O que acontece, fase a fase'],'/parr.html':['PARR','Quando a dívida chega ao sócio'],'/gestao.html':['Gestão fiscal','Prazos, responsáveis e provas'],'/regimes.html':['Regimes e rotina','MEI, Simples, Presumido e Real'],'/reforma.html':['Reforma Tributária','Por que existe e o que muda'],'/escala-6x1.html':['Fim da escala 6x1','EC 141/2026 e seus impactos'],'/trabalho-empresa.html':['CLT, PJ e responsabilidades','Carteira, prós e contras'],'/tributario.html':['Direito tributário','De onde vêm as regras'],'/previdenciario.html':['Direito previdenciário','Folha, custeio e benefícios'],'/administrativo.html':['Direito administrativo','Como o Estado age e se controla'],'/processos.html':['Processos e áreas','Material × formal'],'/biblioteca.html':['Legislação e jurisprudência','Textos oficiais e precedentes'],'/assistente.html':['Assistente educativo','Triagem e busca'],'/noticias.html':['Radar de novidades','Publicações oficiais'],'/fontes.html':['Fontes e livros','Onde confirmar'],'/areas.html':['Navegar por área','Pelo ramo do Direito'],'/mudancas.html':['O que mudou','Mudanças recentes, com fonte']};
    var R = {'/documentos.html':['/empresa.html','/acrescimos.html','/execucao-fiscal.html'],'/acrescimos.html':['/empresa.html','/documentos.html','/inadimplencia.html'],'/empresa.html':['/documentos.html','/acrescimos.html','/execucao-fiscal.html'],'/execucao-fiscal.html':['/inadimplencia.html','/parr.html','/processos.html'],'/inadimplencia.html':['/acrescimos.html','/execucao-fiscal.html','/parr.html'],'/parr.html':['/inadimplencia.html','/execucao-fiscal.html','/tributario.html'],'/gestao.html':['/empresa.html','/trabalho-empresa.html','/previdenciario.html'],'/regimes.html':['/reforma.html','/escala-6x1.html','/trabalho-empresa.html'],'/reforma.html':['/regimes.html','/escala-6x1.html','/trabalho-empresa.html'],'/escala-6x1.html':['/trabalho-empresa.html','/regimes.html','/previdenciario.html'],'/trabalho-empresa.html':['/escala-6x1.html','/previdenciario.html','/reforma.html'],'/tributario.html':['/reforma.html','/administrativo.html','/execucao-fiscal.html'],'/previdenciario.html':['/trabalho-empresa.html','/gestao.html','/administrativo.html'],'/administrativo.html':['/processos.html','/tributario.html','/execucao-fiscal.html'],'/processos.html':['/administrativo.html','/execucao-fiscal.html','/biblioteca.html'],'/biblioteca.html':['/tributario.html','/trabalho-empresa.html','/assistente.html'],'/fontes.html':['/biblioteca.html','/noticias.html','/assistente.html'],'/noticias.html':['/mudancas.html','/reforma.html','/escala-6x1.html'],'/areas.html':['/assistente.html','/biblioteca.html','/fontes.html'],'/artigos.html':['/reforma.html','/empresa.html','/assistente.html'],'/mudancas.html':['/reforma.html','/regimes.html','/escala-6x1.html']};
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

  /* Glossário: a primeira ocorrência de cada termo no texto vira um botão discreto;
     tocar ou passar o mouse mostra a explicação. Nunca em títulos, links, botões ou menu. */
  var GLOSSARIO = [
    ['CDA', 'Certidão de Dívida Ativa', 'Documento que formaliza a dívida inscrita em dívida ativa. É a base da execução fiscal e tem presunção de certeza e liquidez, que pode ser contestada com prova.', '/execucao-fiscal.html'],
    ['dívida ativa', 'Dívida ativa', 'Crédito público vencido e não pago que, depois de um controle de legalidade, é inscrito em registro próprio pela procuradoria. Na União, quem inscreve e cobra é a PGFN.', '/empresa.html'],
    ['PGFN', 'Procuradoria-Geral da Fazenda Nacional', 'Órgão que inscreve e cobra a dívida ativa da União e representa a União nas causas fiscais. O canal de negociação é o portal Regularize.', '/execucao-fiscal.html'],
    ['PARR', 'PARR', 'Procedimento Administrativo de Reconhecimento de Responsabilidade: procedimento da PGFN que apura se um sócio ou administrador responde por dívida ativa da empresa.', '/parr.html'],
    ['execução fiscal', 'Execução fiscal', 'Ação judicial em que o poder público cobra a dívida ativa, regida pela Lei 6.830/1980 (LEF). Pode levar a penhora de bens.', '/execucao-fiscal.html'],
    ['penhora', 'Penhora', 'Ato judicial que separa bens ou valores do devedor para garantir o pagamento da dívida cobrada no processo.', '/execucao-fiscal.html'],
    ['transação tributária', 'Transação tributária', 'Acordo com o fisco para regularizar dívida ou encerrar disputa, com condições e eventuais descontos definidos em lei e em editais (Lei 13.988/2020). Desconto não é automático.', '/execucao-fiscal.html#negociar'],
    ['LEF', 'Lei de Execução Fiscal', 'Lei 6.830/1980, que regula a cobrança judicial da dívida ativa.', '/execucao-fiscal.html'],
    ['CTN', 'Código Tributário Nacional', 'Lei 5.172/1966, com as normas gerais de direito tributário: obrigação, lançamento, prazos, suspensão e extinção do crédito.', '/tributario.html'],
    ['CND', 'Certidão Negativa de Débitos', 'Atesta que não há pendências no órgão que a emite.', '/empresa.html'],
    ['CPEN', 'Certidão Positiva com Efeitos de Negativa', 'Emitida quando existem débitos, mas com a cobrança suspensa (por exemplo, parcelamento em dia) ou garantida. Tem os mesmos efeitos da negativa.', '/empresa.html'],
    ['DCTFWeb', 'DCTFWeb', 'Declaração mensal das contribuições previdenciárias e de terceiros, gerada a partir do eSocial e da EFD-Reinf. Dela sai o DARF para pagamento.', '/previdenciario.html'],
    ['eSocial', 'eSocial', 'Sistema em que o empregador informa eventos trabalhistas, previdenciários e do FGTS, como admissões, folha e afastamentos.', '/previdenciario.html'],
    ['EFD-Reinf', 'EFD-Reinf', 'Escrituração digital de retenções e outras informações fiscais que complementa o eSocial, como as retenções sobre serviços tomados.', '/previdenciario.html'],
    ['PER/DCOMP', 'PER/DCOMP', 'Sistema da Receita Federal para pedir restituição, ressarcimento ou reembolso e declarar a compensação de créditos federais.', '/artigos/restituicao-ou-compensacao.html'],
    ['DAS', 'Documento de Arrecadação do Simples Nacional', 'Guia mensal que reúne, num só pagamento, os tributos do Simples Nacional e do MEI.', '/regimes.html'],
    ['PGDAS-D', 'PGDAS-D', 'Programa em que a empresa do Simples Nacional informa a receita do mês e calcula o DAS.', '/regimes.html'],
    ['SIMEI', 'SIMEI', 'Sistema de recolhimento em valores fixos mensais do microempreendedor individual (MEI), dentro do Simples Nacional.', '/regimes.html'],
    ['CPP', 'Contribuição Patronal Previdenciária', 'Contribuição da empresa sobre a folha de pagamento. No Simples, entra no DAS em parte dos anexos e é paga à parte no Anexo IV.', '/regimes.html'],
    ['CBS', 'Contribuição sobre Bens e Serviços', 'Tributo federal criado pela Reforma Tributária do consumo para substituir PIS e Cofins.', '/reforma.html'],
    ['IBS', 'Imposto sobre Bens e Serviços', 'Tributo de estados e municípios criado pela Reforma Tributária para substituir, aos poucos, o ICMS e o ISS.', '/reforma.html'],
    ['Imposto Seletivo', 'Imposto Seletivo', 'Tributo federal da Reforma que incide sobre bens e serviços prejudiciais à saúde ou ao meio ambiente.', '/reforma.html'],
    ['Selic', 'Selic', 'Taxa básica de juros da economia. Entre outros usos, corrige débitos e créditos tributários federais.', '/inadimplencia.html'],
    ['e-CAC', 'e-CAC', 'Centro Virtual de Atendimento da Receita Federal, acessado com conta gov.br ou certificado digital.', '/empresa.html'],
    ['FGTS', 'FGTS', 'Fundo de Garantia do Tempo de Serviço: depósito mensal do empregador numa conta do trabalhador. É obrigação trabalhista, não tributo.', '/trabalho-empresa.html'],
    ['RAT', 'RAT', 'Contribuição da empresa para custear benefícios por acidente de trabalho, de 1% a 3% da folha conforme o risco da atividade. O FAP pode reduzi-la ou aumentá-la.', '/previdenciario.html']
  ];
  var conteudo = d.getElementById('conteudo');
  if (conteudo && !/\/assistente\.html$/.test(location.pathname)) {
    var SKIP_TAGS = /^(A|BUTTON|SUMMARY|H1|H2|H3|H4|SCRIPT|STYLE|CODE|LABEL|SELECT|OPTION|TEXTAREA|INPUT|B)$/;
    var reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); };
    var usados = {}, tip = null, aberto = null;
    var walker = d.createTreeWalker(conteudo, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (var p = n.parentNode; p && p !== conteudo; p = p.parentNode) {
          if (SKIP_TAGS.test(p.tagName) || (p.classList && (p.classList.contains('tag') || p.classList.contains('eyeline') || p.classList.contains('toc') || p.classList.contains('related') || p.classList.contains('term') || p.classList.contains('ctaTag') || p.classList.contains('reviewStamp')))) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      GLOSSARIO.forEach(function (g, gi) {
        if (usados[gi] || !node.parentNode) return;
        var acr = /[A-Z]/.test(g[0]); /* siglas e nomes próprios: só com a grafia exata (DAS ≠ "das") */
        var re = new RegExp('(^|[^\\p{L}\\p{N}])(' + reEsc(g[0]) + ')(?![\\p{L}\\p{N}])', acr ? 'u' : 'iu');
        var m = re.exec(node.nodeValue); if (!m) return;
        var start = m.index + m[1].length, palavra = m[2];
        var depois = node.splitText(start); depois.nodeValue = depois.nodeValue.slice(palavra.length);
        var b = d.createElement('button'); b.type = 'button'; b.className = 'term'; b.textContent = palavra;
        b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', palavra + ': ver explicação'); b.dataset.g = gi;
        node.parentNode.insertBefore(b, depois); usados[gi] = 1;
        node = depois;
      });
    });
    function fecharTip() { porClique = false; if (tip) { tip.remove(); tip = null; } if (aberto) { aberto.setAttribute('aria-expanded', 'false'); aberto.removeAttribute('aria-describedby'); aberto = null; } }
    function abrirTip(b) {
      if (aberto === b) return;
      fecharTip();
      var g = GLOSSARIO[+b.dataset.g];
      tip = d.createElement('div'); tip.className = 'termTip'; tip.setAttribute('role', 'tooltip'); tip.id = 'termTip';
      tip.innerHTML = '<b></b><span></span>' + (g[3] && location.pathname !== g[3].split('#')[0] ? ' <a></a>' : '');
      tip.querySelector('b').textContent = g[1]; tip.querySelector('span').textContent = g[2];
      var link = tip.querySelector('a'); if (link) { link.href = g[3]; link.textContent = 'Saiba mais →'; }
      d.body.appendChild(tip);
      var r = b.getBoundingClientRect(), w = tip.offsetWidth;
      tip.style.left = Math.max(16, Math.min(scrollX + r.left, scrollX + innerWidth - w - 16)) + 'px';
      tip.style.top = (scrollY + r.bottom + 8) + 'px';
      b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-describedby', 'termTip'); aberto = b;
    }
    var porClique = false; /* aberto pelo mouse (passar por cima) ou fixado por clique/toque */
    conteudo.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.term');
      if (!b) return;
      e.preventDefault();
      if (aberto === b && porClique) { fecharTip(); porClique = false; }
      else { abrirTip(b); porClique = true; }
    });
    d.addEventListener('click', function (e) { if (tip && !e.target.closest('.term,.termTip')) fecharTip(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aberto) { var b = aberto; fecharTip(); b.focus(); } });
    if (matchMedia('(hover: hover)').matches) {
      var timer = null;
      var agendarFechar = function () { if (porClique) return; clearTimeout(timer); timer = setTimeout(fecharTip, 300); };
      d.addEventListener('mouseover', function (e) {
        var b = e.target.closest && e.target.closest('.term');
        if (b && conteudo.contains(b)) { clearTimeout(timer); if (aberto !== b) { porClique = false; abrirTip(b); } }
        else if (e.target.closest && e.target.closest('.termTip')) clearTimeout(timer);
      });
      d.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest('.term,.termTip')) agendarFechar();
      });
    }
    addEventListener('resize', fecharTip);
  }

  /* Máquina de escrever do topo da página inicial (frases separadas por |).
     Com "reduzir movimento" ativado no aparelho, mostra só a primeira frase, parada. */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.querySelectorAll('.typeCue').forEach(function (el) {
    var phrases = (el.getAttribute('data-phrases') || el.textContent).split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!phrases.length) return;
    if (reduce) { el.textContent = phrases[0]; return; }
    /* Digita cada frase uma vez e para na primeira: movimento contínuo na periferia do olhar
       captura a atenção de forma involuntária (Abrams e Christ, 2003) e compete com a leitura. */
    el.classList.add('live'); el.textContent = '';
    var pi = 0, ci = 0, del = false, ultima = false;
    (function tick() {
      var p = phrases[pi], wait = del ? 18 : 38;
      if (!del) {
        ci++; el.textContent = p.slice(0, ci);
        if (ci === p.length) {
          if (ultima || phrases.length === 1) { el.classList.remove('live'); return; }
          del = true; wait = 1900;
        }
      } else {
        ci--; el.textContent = p.slice(0, ci);
        if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; if (pi === 0) ultima = true; wait = 350; }
      }
      setTimeout(tick, wait);
    })();
  });
})();
