/* Assistente Prumo: triagem guiada + busca local em todo o site + IA opcional.
   Por padrão nada do que você digita sai do navegador. */
(function () {
  'use strict';
  var API = 'https://atlas-tributario-assistente.onrender.com';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var CPF = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/, CNPJ = /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}\b/;
  var hasId = function (t) { return CPF.test(t) || CNPJ.test(t); };

  /* ---------- 1) Triagem por situação ---------- */
  var OFF = {
    ctn: ['CTN (Lei 5.172/1966)', 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm'],
    lef: ['Lei de Execução Fiscal (6.830/1980)', 'https://www.planalto.gov.br/ccivil_03/leis/l6830.htm'],
    reg: ['Portal REGULARIZE (PGFN)', 'https://www.regularize.pgfn.gov.br/'],
    sn:  ['Portal do Simples Nacional', 'https://www8.receita.fazenda.gov.br/SimplesNacional/'],
    ref: ['Reforma do consumo (Receita)', 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda'],
    per: ['PER/DCOMP Web', 'https://www.gov.br/receitafederal/pt-br/pt-br/assuntos/orientacao-tributaria/restituicao-ressarcimento-reembolso-e-compensacao/perdcomp/perdcomp-web/perdcomp-web'],
    comp:['Compensar tributos federais', 'https://www.gov.br/pt-br/servicos/compensar-tributos-federais']
  };
  var TRIAGE = [
    { id: 'notif', label: 'Recebi uma notificação ou carta', urgent: true,
      what: 'Pode ser aviso de pendência, intimação, malha ou auto de infração. Cada um tem prazo e defesa próprios, e o prazo vem escrito no próprio documento.',
      first: 'Identifique quem enviou (Receita, PGFN, estado ou município), o tipo de documento e a data em que você tomou ciência.',
      gather: 'O documento completo, declarações do período, comprovantes de pagamento e notas fiscais.',
      avoid: 'Pagar ou parcelar sem conferir o valor, e deixar o prazo correr.',
      pro: 'Se houver auto de infração, multa ou prazo de defesa em andamento, fale com contador ou advogado antes de responder.',
      atlas: [['/empresa.html#roteiro-operacional', 'Roteiro de débitos'], ['/artigos/primeiros-passos-pendencia.html', 'Primeiros passos diante de uma pendência'], ['/processos.html', 'Em que fase está a cobrança']], off: [] },
    { id: 'debito', label: 'Tenho um débito e quero regularizar',
      what: 'O caminho muda conforme o órgão (federal, estadual ou municipal) e a fase: em aberto, vencido ou já inscrito em dívida ativa. Parcelamento não é desconto automático.',
      first: 'Descubra onde o débito está registrado e em que fase. Dívida ativa da União costuma ser tratada na PGFN; débitos do Simples, no Portal do Simples.',
      gather: 'Extratos de débitos, comprovantes de pagamento e declarações do período.',
      avoid: 'Aceitar o valor sem conferir pagamentos já feitos, e confundir parcelar com quitar.',
      pro: 'Se o valor for alto ou houver ação judicial, peça orientação profissional antes de assinar qualquer acordo.',
      atlas: [['/empresa.html#roteiro-operacional', 'Roteiro de débitos'], ['/execucao-fiscal.html', 'Quando a dívida vai ao Judiciário']], off: ['reg', 'sn'] },
    { id: 'exec', label: 'Fui citado em execução fiscal, ou houve bloqueio/penhora', urgent: true,
      what: 'A cobrança já está no Judiciário. O juiz pode ter determinado citação, garantia ou bloqueio, e os prazos processuais são curtos.',
      first: 'Obtenha hoje a íntegra dos autos e a CDA, e leve a um advogado. Não espere o prazo apertar.',
      gather: 'Citação, petição inicial, CDA, processo administrativo de origem e comprovantes de pagamento.',
      avoid: 'Ignorar a citação ou presumir que um parcelamento já suspendeu tudo sem conferir nos autos.',
      pro: 'Este é um caso para advogado: os prazos correm da citação ou da intimação, conforme o caso. O Prumo explica conceitos, mas não calcula prazo.',
      atlas: [['/execucao-fiscal.html', 'Como funciona a execução fiscal'], ['/execucao-fiscal.html#negociar', 'Como negociar a dívida'], ['/inadimplencia.html', 'Se a empresa não regulariza']], off: ['lef', 'reg'] },
    { id: 'regime', label: 'Quero escolher ou mudar de regime (MEI, Simples, Presumido, Real)',
      what: 'A escolha depende de atividade, receita, margem, folha e custos. Não existe regime melhor em abstrato: só a comparação com números reais mostra a diferença.',
      first: 'Reúna faturamento, folha e custos dos últimos meses e compare os regimes possíveis para a sua atividade.',
      gather: 'Receita bruta dos últimos 12 meses, folha de pagamento, margem e principais custos.',
      avoid: 'Decidir só pela alíquota nominal ou pelo que outra empresa do ramo escolheu.',
      pro: 'Peça a um contador uma simulação com os seus números: a decisão costuma ter efeito por um ano inteiro.',
      atlas: [['/regimes.html', 'Regimes e rotina'], ['/reforma.html#prazos', 'Prazos de opção para 2027']], off: ['sn'] },
    { id: 'reforma', label: 'Reforma Tributária: o que preciso fazer agora?',
      what: '2026 é ano de teste: CBS 0,9% e IBS 0,1%, compensáveis. A substituição de PIS, Cofins, ICMS e ISS vai de 2027 a 2033. IRPJ, CSLL e contribuições da folha não mudam por isso.',
      first: 'Pergunte ao seu contador ou ao fornecedor do sistema se as notas já trazem os campos de IBS e CBS, e revise preços, contratos e fluxo de caixa para a transição.',
      gather: 'Regime atual, lista de sistemas fiscais e contratos de longo prazo com preço fixo.',
      avoid: 'Esperar 2027 para olhar contratos e preços, ou concluir qual regime é melhor sem números.',
      pro: 'Decisões de regime e de planejamento devem ter análise de contador ou advogado tributarista.',
      atlas: [['/reforma.html#porque', 'Por que a reforma existe'], ['/reforma.html#prazos', 'Prazos e decisões']], off: ['ref'], date: true },
    { id: 'clt', label: 'Vou contratar: CLT ou PJ?',
      what: 'O contrato é analisado pela realidade da relação: subordinação, habitualidade, pessoalidade e onerosidade podem caracterizar vínculo de emprego, mesmo que o rótulo seja PJ.',
      first: 'Descreva como o trabalho acontece na prática (horário, ordens, exclusividade) e compare com o contrato.',
      gather: 'Contrato, notas fiscais emitidas, comunicações sobre ordens e horários.',
      avoid: 'Usar PJ apenas para reduzir encargos quando a rotina é de empregado.',
      pro: 'O tema é debatido nos tribunais e muda: confirme a orientação atual com advogado trabalhista.',
      atlas: [['/trabalho-empresa.html', 'CLT, PJ e responsabilidades'], ['/previdenciario.html', 'Previdência e folha']], off: [] },
    { id: 'rest', label: 'Paguei em duplicidade ou quero restituição/compensação',
      what: 'Restituição é pedir a devolução do valor indevido. Compensação é usar um crédito elegível para quitar débito permitido. A origem do crédito e o regime definem o canal.',
      first: 'Concilie os comprovantes, a competência e o código de receita, e confira como o pagamento foi apropriado no sistema fiscal.',
      gather: 'Comprovantes, DARF/guia, competência, código de receita e extratos de apropriação.',
      avoid: 'Descontar por conta própria de uma guia futura.',
      pro: 'Se o valor for relevante ou envolver contribuições previdenciárias, confirme o caminho com um contador.',
      atlas: [['/artigos/restituicao-ou-compensacao.html', 'Restituição ou compensação?']], off: ['per', 'comp'] },
    { id: 'parr', label: 'Fui notificado como sócio (PARR) ou meu nome apareceu na dívida da empresa', urgent: true,
      what: 'O PARR é um procedimento da PGFN que apura se um sócio ou administrador responde por dívida ativa da empresa. Não é um tributo.',
      first: 'Abra o Regularize e confira os Correios: a notificação eletrônica vale 15 dias depois de disponibilizada, e a impugnação tem prazo de 15 dias corridos.',
      gather: 'Contrato social e alterações, período em que exerceu a gestão, data de saída e documentos que mostrem a ausência de responsabilidade.',
      avoid: 'Ignorar a notificação, ou presumir que sair da sociedade encerra a responsabilidade pelo período em que era gestor.',
      pro: 'Procure advogado: o caso mistura Direito Tributário, empresarial e processual, e os prazos são curtos.',
      atlas: [['/parr.html', 'PARR: o que é e como funciona'], ['/inadimplencia.html', 'Se a empresa não regulariza']], off: ['reg'] },
    { id: 'seis', label: 'Fim da escala 6x1: o que a empresa precisa fazer?',
      what: 'A EC 141/2026, promulgada em 16/10/2026, prevê escala 5x2 e jornada de 42 horas em até 60 dias, e de 40 horas em até 14 meses, sem redução de salário.',
      first: 'Mapeie escalas e convenções coletivas, calcule o custo por posto e planeje a nova escala para o prazo de 60 dias.',
      gather: 'Escalas atuais, convenção coletiva da categoria, controle de ponto, contratos de preço fixo e contratos públicos.',
      avoid: 'Esperar a regulamentação para começar: a primeira etapa vence em cerca de 60 dias.',
      pro: 'Ajustes de escala, banco de horas e custo pedem advogado trabalhista e contador.',
      atlas: [['/escala-6x1.html', 'Fim da escala 6x1: página completa'], ['/trabalho-empresa.html', 'CLT, PJ e responsabilidades']], off: [] }
  ];
  var tri = $('#triageButtons'), triOut = $('#triageOut');
  function dateNote(t) {
    if (!t.date) return '';
    return new Date() <= new Date('2026-10-30T23:59:59') ? '<p class="alert" style="margin:10px 0"><strong>Prazo curto:</strong> até 30/10/2026, empresas do Simples podem optar pelo regime regular de IBS e CBS (jan–jun/2027). Veja os detalhes na página da Reforma.</p>' : '';
  }
  function showTriage(t) {
    var links = t.atlas.map(function (a) { return '<a class="linkbtn" href="' + a[0] + '">' + esc(a[1]) + '</a>'; }).join('') +
      t.off.map(function (k) { return '<a class="linkbtn" href="' + OFF[k][1] + '" target="_blank" rel="noopener">' + esc(OFF[k][0]) + ' ↗</a>'; }).join('');
    triOut.innerHTML = '<article class="card triageCard"><span class="tag">' + (t.urgent ? 'Atenção a prazos' : 'Guia rápido') + '</span><h3>' + esc(t.label) + '</h3>' + dateNote(t) +
      '<p><strong>O que costuma ser:</strong> ' + esc(t.what) + '</p><p><strong>Primeiro passo:</strong> ' + esc(t.first) + '</p>' +
      '<p><strong>Reúna:</strong> ' + esc(t.gather) + '</p><p><strong>Evite:</strong> ' + esc(t.avoid) + '</p>' +
      '<p class="alert" style="margin:10px 0"><strong>Quando procurar um profissional:</strong> ' + esc(t.pro) + '</p>' +
      '<div class="pathlinks">' + links + '</div><p class="fine">Orientação geral e educativa; não analisa o seu caso concreto. Confirme sempre na fonte oficial.</p></article>';
    triOut.focus();
  }
  TRIAGE.forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'triBtn'; b.textContent = t.label; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { [].forEach.call(tri.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); showTriage(t); });
    tri.appendChild(b);
  });

  /* ---------- 2) Busca local (BM25) em todo o Prumo ---------- */
  var STOP = new Set('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sobre entre e ou que se ao aos como qual quais quando onde meu minha meus minhas seu sua isso esse essa este esta mais muito ja nao ser ter tem foi sao eu me nos voce'.split(' '));
  var SYN = { debito: ['divida', 'cobranca'], divida: ['debito'], penhora: ['bloqueio', 'garantia'], bloqueio: ['penhora'], cobranca: ['execucao', 'debito'], execucao: ['cobranca'], reforma: ['ibs', 'cbs'], ibs: ['reforma'], cbs: ['reforma'], imposto: ['tributo'], tributo: ['imposto'], mei: ['simei'], pj: ['pessoa', 'vinculo'], clt: ['emprego', 'vinculo'], restituicao: ['compensacao'], compensacao: ['restituicao'], aposentadoria: ['previdencia', 'beneficio'], inss: ['previdencia'], prazo: ['data'], parr: ['responsabilidade', 'socio'], socio: ['responsabilidade', 'parr'], escala: ['jornada'], jornada: ['escala'], '6x1': ['escala', 'jornada', '5x2'], pejotizacao: ['pj', 'vinculo'], cda: ['certidao', 'inscricao'], multa: ['penalidade'] };
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' '); };
  var stem = function (w) { if (w.length > 4) w = w.replace(/(coes|oes)$/, 'ao').replace(/(ais|eis|ois)$/, 'al'); if (w.length > 3) w = w.replace(/s$/, ''); return w; };
  var toks = function (s) { return norm(s).split(/\s+/).filter(function (w) { return w && !STOP.has(w); }).map(stem); };
  var docs = [], df = {}, avg = 1, ready = null;
  function load() {
    if (ready) return ready;
    ready = fetch('/assistente-index.json').then(function (r) { return r.json(); }).then(function (j) {
      docs = j.chunks.map(function (c) { var t = toks(c.title + ' ' + c.title + ' ' + c.page + ' ' + c.text); var tf = {}; t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; }); Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); return { c: c, tf: tf, len: t.length }; });
      avg = docs.reduce(function (a, d) { return a + d.len; }, 0) / docs.length;
    });
    return ready;
  }
  function search(q) {
    var base = toks(q), extra = [];
    base.forEach(function (w) { (SYN[w] || []).forEach(function (s) { extra.push(stem(s)); }); });
    var k1 = 1.4, b = .75, N = docs.length, scored = [];
    docs.forEach(function (d) {
      var s = 0, hit = 0;
      base.concat(extra).forEach(function (w, i) {
        var f = d.tf[w]; if (!f) return; if (i < base.length) hit++;
        var idf = Math.log(1 + (N - (df[w] || 0) + .5) / ((df[w] || 0) + .5));
        s += (i < base.length ? 1 : .55) * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg));
      });
      if (hit) scored.push({ d: d, s: s * (1 + .12 * hit) });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    var best = scored.length ? scored[0].s : 0;
    return { q: new Set(base.concat(extra)), hits: scored.filter(function (x) { return x.s >= best * .38; }).slice(0, 5) };
  }
  function snippet(text, qs) {
    var sents = text.split(/(?<=[.!?])\s+/), bi = 0, bs = -1;
    sents.forEach(function (s, i) { var n = toks(s).filter(function (w) { return qs.has(w); }).length; if (n > bs) { bs = n; bi = i; } });
    var out = (sents[bi] + ' ' + (sents[bi + 1] || '')).trim(); if (out.length > 320) out = out.slice(0, 317) + '…';
    return esc(out).replace(/[\p{L}\p{N}]+/gu, function (w) { return qs.has(stem(norm(w).trim())) ? '<mark>' + w + '</mark>' : w; });
  }
  var form = $('#searchForm'), input = $('#searchInput'), out = $('#searchOut'), lastHits = [];
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var q = input.value.trim(); if (q.length < 2) return;
    if (hasId(q)) { out.innerHTML = '<p class="alert"><strong>Não digite CPF ou CNPJ.</strong> A busca é local, mas evite colocar dados pessoais em qualquer campo. Reformule só com o assunto.</p>'; return; }
    out.innerHTML = '<p class="fine">Buscando…</p>';
    load().then(function () {
      var r = search(q); lastHits = r.hits.map(function (x) { return x.d.c; });
      if (!r.hits.length) { out.innerHTML = '<p class="alert">Não achei um trecho sobre isso. Tente outras palavras (por exemplo "penhora", "regime", "dívida ativa") ou escolha uma situação acima. Veja também as <a href="/fontes.html">fontes oficiais</a>.</p>'; return; }
      out.innerHTML = '<p class="fine">' + r.hits.length + ' trecho(s) do Prumo. São extratos das páginas, não uma resposta gerada.</p>' + r.hits.map(function (x) {
        var c = x.d.c; return '<article class="card searchHit"><span class="tag">' + esc(c.page) + '</span><h3><a href="' + c.url + '">' + esc(c.title) + '</a></h3><p>' + snippet(c.text, r.q) + '</p><a class="linkbtn" href="' + c.url + '">Abrir a seção →</a></article>'; }).join('');
      updateAi();
    }).catch(function () { out.innerHTML = '<p class="alert">Não consegui carregar a busca agora. Use as situações acima ou as <a href="/fontes.html">fontes oficiais</a>.</p>'; });
  });

  /* ---------- 3) IA opcional (só aparece se o backend estiver ligado) ---------- */
  var ai = $('#aiPanel'), aiForm = $('#aiForm'), aiQ = $('#aiQuestion'), aiOut = $('#aiOut'), aiBtn = $('#aiBtn'), aiConsent = $('#aiConsent');
  function updateAi() { /* reservado para estado */ }
  var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 9000);
  fetch(API + '/health', { signal: ctl.signal }).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(to); if (j && j.enabled) ai.hidden = false; }).catch(function () {});
  aiForm.addEventListener('submit', function (e) {
    e.preventDefault(); var q = aiQ.value.trim();
    if (q.length < 3) return;
    if (!aiConsent.checked) { aiOut.textContent = 'Marque a caixa de ciência para enviar a pergunta à IA.'; return; }
    if (hasId(q)) { aiOut.textContent = 'Por segurança, não envie CPF ou CNPJ. Reformule a pergunta sem dados identificáveis.'; return; }
    aiBtn.disabled = true; aiOut.textContent = 'Consultando… (na primeira vez o serviço pode levar alguns segundos para acordar)';
    load().then(function () {
      var r = search(q), ctx = r.hits.slice(0, 3).map(function (x) { return { title: x.d.c.page + ': ' + x.d.c.title, text: x.d.c.text.slice(0, 900) }; });
      return fetch(API + '/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, context: ctx }), signal: AbortSignal.timeout(40000) })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j, ctx: r.hits.slice(0, 3) }; }); });
    }).then(function (x) {
      if (!x.ok) { aiOut.textContent = (x.j && x.j.error) || 'Não consegui responder agora.'; return; }
      aiOut.textContent = x.j.answer;
      if (x.ctx.length) { var p = document.createElement('p'); p.className = 'fine'; p.innerHTML = 'Trechos do Prumo consultados: ' + x.ctx.map(function (h) { return '<a href="' + h.d.c.url + '">' + esc(h.d.c.title) + '</a>'; }).join(' · '); aiOut.appendChild(p); }
    }).catch(function () { aiOut.textContent = 'O assistente de IA está indisponível agora. Use a triagem e a busca acima.'; }).then(function () { aiBtn.disabled = false; });
  });
})();
