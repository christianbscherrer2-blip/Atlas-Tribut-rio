/* Painel de uso do Prumo: lê as contagens agregadas do mês no servidor do assistente e mostra
   o que mais precisa de atenção. Só números; nenhum dado identifica quem visitou. */
(function () {
  'use strict';
  var API = 'https://atlas-tributario-assistente.onrender.com/api/metricas';
  var INICIO = '2026-11'; /* primeiro mês medido */
  var d = document, $ = function (s) { return d.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = new Intl.NumberFormat('pt-BR');
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var EVENTOS = {
    plano_acao: 'Plano de ação montado na triagem', plano_copiado: 'Plano de ação copiado', plano_impresso: 'Plano de ação impresso',
    busca: 'Buscas no assistente', busca_vazia: 'Buscas sem resultado', ia_pergunta: 'Perguntas à IA',
    calculo_acrescimos: 'Cálculos de multa e juros', glossario: 'Termos do glossário abertos',
    regime_escolhido: 'Regime da empresa escolhido', tema_trocado: 'Troca de tema claro/escuro',
    calculo_jornada: 'Cálculos da jornada (6x1)', interesse_pro: 'Interesse no plano Pro',
    calculo_execucao: 'Cálculos da execução fiscal', cda_organizada: 'CDAs registradas no organizador'
  };
  var ORIGENS = { direta: 'Acesso direto ou link salvo', buscador: 'Buscadores (Google, Bing etc.)', outro_site: 'Links em outros sites', interna: 'Navegação dentro do Prumo' };
  var MOTIVOS = { faltou_informacao: 'Faltou informação', dificil_entender: 'Difícil de entender', desatualizado: 'Parece desatualizado', nao_era_isso: 'Não era o que buscava' };
  var MIN_RESPOSTAS = 10; /* abaixo disso, o percentual oscila demais para orientar decisão */
  var nomes = {};

  /* Chave pessoal: chega no link (#chave=...), que não é enviado ao servidor pelo navegador.
     Fica guardada só neste navegador e sai da barra de endereço. */
  var CHAVE_LS = 'prumo-painel-chave', chave = '';
  try {
    var mHash = location.hash.match(/chave=([A-Za-z0-9_-]{16,100})/);
    if (mHash) { localStorage.setItem(CHAVE_LS, mHash[1]); history.replaceState(null, '', location.pathname); }
    chave = localStorage.getItem(CHAVE_LS) || '';
  } catch (e) {}
  var secoes = [].slice.call(d.querySelectorAll('#conteudo > section'));
  function mostrarBloqueio(bloq) {
    secoes.forEach(function (s) { s.hidden = bloq ? s.id !== 'bloqueio' : s.id === 'bloqueio'; });
    var alerta = d.querySelector('#conteudo > .alert'); if (alerta) alerta.hidden = bloq;
  }

  var rotuloMes = function (m) { var p = m.split('-'); return MESES[+p[1] - 1] + ' de ' + p[0]; };
  var pct = function (a, b) { return b ? Math.round(100 * a / b) + '%' : '—'; };
  var nomePagina = function (p) { return nomes[p] || p; };
  var link = function (p) { return '<a href="' + esc(p) + '">' + esc(nomePagina(p)) + '</a>'; };
  var tabela = function (legenda, cab, linhas, vazio) {
    if (!linhas.length) return '<p class="fine">' + esc(vazio) + '</p>';
    /* Tabela larga rola dentro da própria caixa no celular; o foco pelo teclado permite rolar sem mouse */
    return '<div class="painelTabela" tabindex="0" role="region" aria-label="' + esc(legenda) + '"><table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">' + esc(legenda) + '</caption><thead><tr>' +
      cab.map(function (c, i) { return '<th scope="col"' + (i ? ' class="num"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linhas.map(function (l) { return '<tr>' + l.map(function (c, i) { return i ? '<td class="num">' + c + '</td>' : '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>';
  };

  /* Seletor de mês: do primeiro mês medido até o atual */
  var sel = $('#painelMes'), hoje = new Date(), atual = hoje.toISOString().slice(0, 7), opcoes = [];
  for (var a = hoje.getUTCFullYear(), m = hoje.getUTCMonth() + 1; (a + '-' + String(m).padStart(2, '0')) >= INICIO;) {
    opcoes.push(a + '-' + String(m).padStart(2, '0'));
    m--; if (m < 1) { m = 12; a--; }
  }
  sel.innerHTML = opcoes.map(function (o) { return '<option value="' + o + '">' + rotuloMes(o) + (o === atual ? ' (mês atual)' : '') + '</option>'; }).join('');

  function mostrar(dados) {
    var paginas = Object.keys(dados.paginas || {}).map(function (p) { var x = dados.paginas[p]; return { p: p, v: x.visitas || 0, s: x.sim || 0, n: x.nao || 0, mot: x.motivos || {} }; });
    var ev = dados.eventos || {}, org = dados.origens || {};
    var visitas = paginas.reduce(function (t, x) { return t + x.v; }, 0);
    var sim = paginas.reduce(function (t, x) { return t + x.s; }, 0), nao = paginas.reduce(function (t, x) { return t + x.n; }, 0);
    var buscas = ev.busca || 0, vazias = ev.busca_vazia || 0;

    $('#painelResumo').innerHTML = [
      [num.format(visitas), 'visitas às páginas'],
      [pct(sim, sim + nao), 'acharam a página útil (' + num.format(sim + nao) + ' respostas)'],
      [pct(vazias, buscas), 'das ' + num.format(buscas) + ' buscas sem resultado'],
      [num.format((ev.plano_acao || 0) + (ev.calculo_acrescimos || 0)), 'planos de ação e cálculos feitos']
    ].map(function (c) { return '<div class="painelNumero"><b>' + c[0] + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('');

    /* Atenção: páginas com respostas "não", da pior proporção para a melhor */
    var atencao = paginas.filter(function (x) { return x.n > 0; }).sort(function (a, b) { return (b.n / (b.s + b.n)) - (a.n / (a.s + a.n)) || b.n - a.n; }).slice(0, 15);
    $('#painelAtencao').innerHTML = tabela('Páginas com respostas "não", da menor para a maior proporção de "sim"', ['Página', 'Respostas', 'Sim', 'Não', 'Útil', 'Motivo mais citado'],
      atencao.map(function (x) {
        var t = x.s + x.n, top = Object.keys(x.mot).sort(function (a, b) { return x.mot[b] - x.mot[a]; })[0];
        return [link(x.p), num.format(t), num.format(x.s), num.format(x.n), t < MIN_RESPOSTAS ? pct(x.s, t) + ' <span class="fine">(poucas respostas)</span>' : pct(x.s, t), top ? esc(MOTIVOS[top] || top) + ' (' + x.mot[top] + ')' : '—'];
      }), 'Nenhuma resposta "não" neste mês.');

    var maisVistas = paginas.slice().sort(function (a, b) { return b.v - a.v; }).filter(function (x) { return x.v > 0; }).slice(0, 15);
    $('#painelPaginas').innerHTML = tabela('As 15 páginas mais visitadas', ['Página', 'Visitas', 'Parte do total', 'Útil'],
      maisVistas.map(function (x) { return [link(x.p), num.format(x.v), pct(x.v, visitas), pct(x.s, x.s + x.n)]; }), 'Nenhuma visita registrada neste mês.');

    $('#painelFerramentas').innerHTML = tabela('Quantas vezes cada recurso foi usado', ['Recurso', 'Vezes'],
      Object.keys(EVENTOS).filter(function (k) { return ev[k]; }).sort(function (a, b) { return ev[b] - ev[a]; }).map(function (k) { return [esc(EVENTOS[k]), num.format(ev[k])]; }), 'Nenhum uso registrado neste mês.');

    var totalOrg = Object.keys(org).reduce(function (t, k) { return t + org[k]; }, 0);
    $('#painelOrigens').innerHTML = tabela('Como as visitas chegaram ao Prumo', ['Origem', 'Visitas', 'Parte'],
      Object.keys(ORIGENS).filter(function (k) { return org[k]; }).sort(function (a, b) { return org[b] - org[a]; }).map(function (k) { return [esc(ORIGENS[k]), num.format(org[k]), pct(org[k], totalOrg)]; }), 'Sem dados de origem neste mês.');

    var camps = dados.campanhas || {};
    $('#painelCampanhas').innerHTML = tabela('Visitas que chegaram por links marcados com ?origem=', ['Campanha', 'Visitas'],
      Object.keys(camps).sort(function (a, b) { return camps[b] - camps[a]; }).map(function (k) { return [esc(k), num.format(camps[k])]; }), 'Nenhum link marcado foi usado neste mês. Veja o kit de divulgação para marcar os links que você compartilha.');

    var termos = dados.buscas_vazias || {};
    $('#painelBuscas').innerHTML = tabela('Termos buscados que não encontraram nenhum trecho', ['Termo buscado', 'Vezes'],
      Object.keys(termos).sort(function (a, b) { return termos[b] - termos[a]; }).slice(0, 20).map(function (t) { return [esc(t), num.format(termos[t])]; }), 'Nenhuma busca sem resultado registrada neste mês.');
  }

  function mostrarAgora(dados, mes) {
    var ag = dados.agora || {}, sec = $('#agora');
    sec.hidden = mes !== atual;
    $('#agoraResumo').innerHTML = [
      [num.format(ag.ultimos_5min || 0), 'visitas nos últimos 5 minutos'],
      [num.format(ag.ultimos_30min || 0), 'visitas nos últimos 30 minutos'],
      [num.format(ag.hoje || 0), 'visitas hoje (horário de Brasília)']
    ].map(function (c) { return '<div class="painelNumero"><b>' + c[0] + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('');
    var pg = ag.paginas_30min || {};
    $('#agoraPaginas').innerHTML = tabela('Páginas vistas na última meia hora', ['Página', 'Visitas'],
      Object.keys(pg).sort(function (a, b) { return pg[b] - pg[a]; }).slice(0, 10).map(function (p) { return [link(p), num.format(pg[p])]; }), 'Ninguém abriu páginas na última meia hora.');
    var dias = dados.dias || {};
    $('#porDia').innerHTML = tabela('Visitas por dia em ' + rotuloMes(mes), ['Dia', 'Visitas'],
      Object.keys(dias).sort().reverse().map(function (k) { var p = k.split('-'); return [p[2] + '/' + p[1], num.format(dias[k])]; }), 'Ainda sem visitas registradas por dia neste mês.');
    $('#agoraStatus').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR') + '. Atualiza sozinho a cada 30 segundos enquanto esta aba estiver aberta.' +
      (ag.servidor_desde ? ' Os números de 5 e 30 minutos contam desde que o servidor ligou (' + new Date(ag.servidor_desde).toLocaleString('pt-BR') + ').' : '');
  }

  var status = $('#painelStatus');
  function carregar() {
    var mes = sel.value;
    status.textContent = 'Carregando ' + rotuloMes(mes) + '… (na primeira vez o servidor pode levar alguns segundos para acordar)';
    if (!chave) { mostrarBloqueio(true); return; }
    fetch(API + '?mes=' + mes, { headers: { Authorization: 'Bearer ' + chave }, signal: AbortSignal.timeout(40000) }).then(function (r) {
      if (r.status === 401) { mostrarBloqueio(true); throw new Error('privado'); }
      if (!r.ok) throw new Error(); return r.json();
    }).then(function (j) {
      mostrarBloqueio(false);
      mostrar(j); mostrarAgora(j, mes);
      status.textContent = 'Números de ' + rotuloMes(mes) + (j.persistente ? (j.ultima_gravacao ? '. Última gravação em ' + new Date(j.ultima_gravacao).toLocaleString('pt-BR') + '.' : '.') :
        '. Atenção: o armazenamento permanente ainda não foi configurado no servidor, então estes números são só desde que ele ligou pela última vez.');
    }).catch(function (e) {
      if (e && e.message === 'privado') return;
      status.textContent = 'Não consegui ler os números agora. O servidor pode estar acordando; tente de novo em um minuto.';
    });
  }
  fetch('/assistente-index.json').then(function (r) { return r.json(); }).then(function (j) {
    (j.chunks || []).forEach(function (c) { var p = String(c.url || '').split('#')[0]; if (p && !nomes[p]) nomes[p] = c.page; });
    nomes['/'] = 'Página inicial';
  }).catch(function () {}).then(carregar);
  sel.addEventListener('change', carregar);
  $('#painelSair').addEventListener('click', function () { try { localStorage.removeItem(CHAVE_LS); } catch (e) {} chave = ''; mostrarBloqueio(true); });
  /* Atualiza sozinho a cada 30 segundos enquanto a aba está visível e o mês escolhido é o atual */
  setInterval(function () { if (chave && !d.hidden && sel.value === atual) carregar(); }, 30000);
  d.addEventListener('visibilitychange', function () { if (!d.hidden && chave && sel.value === atual) carregar(); });
  $('#painelAtualizar').addEventListener('click', carregar);
  window.prumoPainel = { mostrar: mostrar, mostrarAgora: mostrarAgora }; /* usado nos testes do painel */
})();
