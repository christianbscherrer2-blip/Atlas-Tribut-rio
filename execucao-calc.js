/* Prumo · ferramentas de execução fiscal: atualização de débito inscrito em dívida ativa da União,
   simulador de cenários (à vista, parcelamento ordinário e transação) e linha do tempo de prazos.
   Regras conferidas no texto oficial em 23/11/2026:
   - Multa de mora 0,33% ao dia até 20% e juros Selic + 1% no mês do pagamento: Lei 9.430/1996, art. 61.
   - Encargo legal de 20% (DL 1.025/1969, art. 1º), reduzido a 10% se pago antes da remessa da certidão
     para ajuizamento (DL 1.569/1977, art. 3º), sobre o débito com multa, juros e atualização.
   - Parcelamento ordinário: até 60 parcelas, cada uma com Selic do mês seguinte à consolidação até o
     anterior ao pagamento + 1% (Lei 10.522/2002, arts. 10 e 13). Parcela mínima R$ 200 (PF) e R$ 500 (PJ)
     pela Portaria PGFN 448/2019 (conferir a portaria vigente).
   - Transação: desconto só sobre multa, juros e encargo; teto de 65% do total e 120 meses, ou 70% e
     145 meses para PF, ME e EPP (Lei 13.988/2020, art. 11, § 2º, I a III, e § 3º).
   - LEF (Lei 6.830/1980): 5 dias para pagar ou garantir (art. 8º), 30 dias para embargos (art. 16),
     suspensão de 1 ano e arquivamento (art. 40); prescrição intercorrente de 5 anos (CTN, art. 174; STJ, Tema 566).
   - Prazos processuais em dias úteis (CPC, art. 219) e suspensos de 20/12 a 20/01 (CPC, art. 220); a
     aplicação aos prazos da LEF é discutida, então a ferramenta mostra as duas contagens. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  if (!$('efForm')) return;
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var pct = function (n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SELOS = { vigente: ['seloVigente', 'Em vigor'], depende: ['seloRegula', 'Depende do edital ou do juízo'], simula: ['seloSimula', 'Simulação'] };
  var selo = function (k) { return '<span class="selo ' + SELOS[k][0] + '">' + SELOS[k][1] + '</span>'; };
  function lerValor(t) { t = String(t || '').trim().replace(/[R$\s%]/g, ''); if (!t) return NaN; if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t); }
  function lerData(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; var p = s.split('-').map(Number), dt = new Date(p[0], p[1] - 1, p[2]); return dt.getMonth() === p[1] - 1 ? dt : null; }
  var iso = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  var br = function (dt) { return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); };
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var chaveMes = function (a, m) { return a + '-' + (m < 10 ? '0' : '') + m; };
  var rotulo = function (k) { var p = k.split('-'); return MESES[+p[1] - 1] + '/' + p[0]; };
  var SELIC = null, ULTIMO = null, MEDIA = 1;
  var medido = false, medir = function () { if (!medido) { medido = true; if (window.prumoMedir) window.prumoMedir('calculo_execucao'); } };

  /* ---------- 1) Atualização do débito inscrito ---------- */
  var ENCARGOS = { 20: '20%: débito já remetido para ajuizamento ou em execução', 10: '10%: pago antes da remessa para ajuizamento', 0: 'Sem encargo legal (débito ainda não inscrito)' };
  $('efEncargo').innerHTML = Object.keys(ENCARGOS).sort(function (a, b) { return b - a; }).map(function (k) { return '<option value="' + k + '">' + ENCARGOS[k] + '</option>'; }).join('');
  var hoje = new Date(); $('efData').value = iso(hoje); $('efVenc').value = iso(new Date(hoje.getFullYear() - 2, hoje.getMonth(), 20));
  var ultimoCalc = null;
  function juros(venc, pag) {
    var mesmo = venc.getFullYear() === pag.getFullYear() && venc.getMonth() === pag.getMonth();
    if (mesmo) return { pct: 0, estimados: [], meses: 0 };
    var a = venc.getFullYear(), m = venc.getMonth() + 2, total = 0, est = [], n = 0; if (m > 12) { m = 1; a++; }
    var fa = pag.getFullYear(), fm = pag.getMonth() + 1;
    while (a < fa || (a === fa && m < fm)) {
      var k = chaveMes(a, m), t = SELIC ? SELIC[k] : undefined;
      if (t === undefined) { t = SELIC && ULTIMO ? SELIC[ULTIMO] : 0; est.push(rotulo(k)); }
      total += t; n++; m++; if (m > 12) { m = 1; a++; }
    }
    return { pct: Math.round((total + 1) * 100) / 100, estimados: est, meses: n };
  }
  function atualizar() {
    var erro = $('efErro'), out = $('efSaida'); erro.textContent = '';
    [].forEach.call(d.querySelectorAll('#efForm input'), function (i) { i.removeAttribute('aria-invalid'); });
    var falha = function (id, msg) { $(id).setAttribute('aria-invalid', 'true'); erro.textContent = msg; out.innerHTML = ''; ultimoCalc = null; };
    var tipo = $('efMultaTipo').value; $('efMultaPctWrap').hidden = tipo !== 'outra';
    var enc = +$('efEncargo').value;
    $('efEncargoDica').innerHTML = enc === 10 ? selo('depende') + ' Confirme no Regularize se o débito ainda não foi remetido.' : enc === 20 ? selo('vigente') + ' DL 1.025/1969, art. 1º.' : 'Use para tributo vencido, ainda não inscrito.';
    var P = lerValor($('efPrincipal').value), venc = lerData($('efVenc').value), pag = lerData($('efData').value);
    if (!(P > 0 && P < 1e12)) return falha('efPrincipal', 'Informe o valor principal, por exemplo 10.000,00.');
    if (!venc) return falha('efVenc', 'Informe a data de vencimento do tributo.');
    if (!pag) return falha('efData', 'Informe a data do cálculo ou do pagamento.');
    if (pag <= venc) return falha('efData', 'A data do cálculo precisa ser depois do vencimento.');
    if (venc.getFullYear() < 2010) return falha('efVenc', 'A ferramenta cobre vencimentos a partir de 2010.');
    var dias = Math.round((pag - venc) / 864e5), multaPct, multaDesc;
    if (tipo === 'mora') { multaPct = Math.min(20, 0.33 * dias); multaDesc = dias + ' dia(s) × 0,33%' + (0.33 * dias > 20 ? ', limitada a 20%' : '') + ' (Lei 9.430/1996, art. 61)'; }
    else { multaPct = lerValor($('efMultaPct').value); if (!(multaPct >= 0 && multaPct <= 225)) return falha('efMultaPct', 'Informe o percentual da multa que consta na CDA, de 0% a 225%.'); multaDesc = 'Percentual informado, conforme a CDA'; }
    var J = juros(venc, pag), multa = Math.round(P * multaPct) / 100;
    /* Juros sobre o principal; com multa de ofício, também sobre a multa (Súmula CARF 108) */
    var baseJuros = tipo === 'outra' ? P + multa : P, jur = Math.round(baseJuros * J.pct) / 100;
    var subtotal = P + multa + jur, encargo = Math.round(subtotal * enc) / 100, total = Math.round((subtotal + encargo) * 100) / 100;
    ultimoCalc = { P: P, A: Math.round((multa + jur + encargo) * 100) / 100 };
    var html = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Débito atualizado até ' + pag.toLocaleDateString('pt-BR') + '</caption><thead><tr><th scope="col">Parcela</th><th scope="col">Como foi calculada</th><th scope="col">Percentual</th><th scope="col">Valor</th></tr></thead><tbody>' +
      '<tr><td>Principal</td><td>Informado</td><td></td><td>' + brl.format(P) + '</td></tr>' +
      '<tr><td>Multa ' + selo('vigente') + '</td><td>' + esc(multaDesc) + '</td><td>' + pct(multaPct) + '</td><td>' + brl.format(multa) + '</td></tr>' +
      '<tr><td>Juros (Selic) ' + selo('vigente') + '</td><td>' + (J.meses ? 'Selic de ' + J.meses + ' mês(es) + 1% do mês do pagamento' : '1% do mês do pagamento') + (tipo === 'outra' ? ', sobre principal e multa' : ', sobre o principal') + '</td><td>' + pct(J.pct) + '</td><td>' + brl.format(jur) + '</td></tr>' +
      '<tr><td>Encargo legal ' + (enc ? selo(enc === 10 ? 'depende' : 'vigente') : '') + '</td><td>' + (enc ? enc + '% sobre principal, multa e juros (DL 1.025/1969 e DL 1.569/1977, art. 3º)' : 'Não aplicado') + '</td><td>' + pct(enc) + '</td><td>' + brl.format(encargo) + '</td></tr>' +
      '</tbody><tfoot><tr><th scope="row" colspan="3" style="text-align:left">Total estimado</th><th>' + brl.format(total) + '</th></tr></tfoot></table>';
    if (J.estimados.length) html += '<p class="alert" style="margin-top:12px"><strong>Parte estimada.</strong> A Selic de ' + esc(J.estimados.join(', ')) + ' ainda não foi fechada pelo Banco Central. Usei a do último mês disponível' + (ULTIMO ? ' (' + esc(rotulo(ULTIMO)) + ')' : '') + '.</p>';
    html += '<p><button type="button" class="linkbtn" id="efLevar">Levar estes valores para o simulador ↓</button></p>';
    out.innerHTML = html;
    $('efLevar').addEventListener('click', function () {
      $('scPrincipal').value = ultimoCalc.P.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      $('scAcessorios').value = ultimoCalc.A.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      cenarios(); $('cenarios').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      $('scPrincipal').focus({ preventScroll: true });
    });
  }

  /* ---------- 3) Cenários ---------- */
  var PERFIS = { pf: { nome: 'Pessoa física', min: 200, teto: 70, prazo: 145 }, me: { nome: 'Microempresa ou empresa de pequeno porte', min: 500, teto: 70, prazo: 145 }, pj: { nome: 'Empresa (demais)', min: 500, teto: 65, prazo: 120 } };
  $('scPerfil').innerHTML = Object.keys(PERFIS).map(function (k) { return '<option value="' + k + '"' + (k === 'pj' ? ' selected' : '') + '>' + PERFIS[k].nome + '</option>'; }).join('');
  /* Valor projetado das parcelas: cada parcela (a partir da 2ª) recebe a Selic acumulada desde o mês
     seguinte à consolidação + 1%; projeção com a média mensal dos últimos 12 meses */
  function projetar(base, n) { var tot = 0; for (var k = 1; k <= n; k++) tot += k === 1 ? base : base * (1 + (MEDIA * (k - 2) + 1) / 100); return tot; }
  function cenarios() {
    var erro = $('scErro'), out = $('scSaida'); erro.textContent = '';
    [].forEach.call(d.querySelectorAll('#scForm input'), function (i) { i.removeAttribute('aria-invalid'); });
    var falha = function (id, msg) { $(id).setAttribute('aria-invalid', 'true'); erro.textContent = msg; out.innerHTML = ''; };
    var pf = PERFIS[$('scPerfil').value];
    $('scDescontoDica').innerHTML = selo('depende') + ' Teto legal: ' + pf.teto + '% do total, só sobre multa, juros e encargo. O edital define o desconto real.';
    $('scPrazoDica').innerHTML = 'Máximo legal: ' + pf.prazo + ' parcelas (Lei 13.988/2020, art. 11).';
    var P = lerValor($('scPrincipal').value), A = lerValor($('scAcessorios').value), n = lerValor($('scParcelas').value), desc = lerValor($('scDesconto').value), nt = lerValor($('scPrazoTr').value), ent = lerValor($('scEntrada').value);
    if (!(P > 0)) return falha('scPrincipal', 'Informe o principal. Dica: calcule acima e use "Levar estes valores para o simulador".');
    if (!(A >= 0)) return falha('scAcessorios', 'Informe a soma de multa, juros e encargo (pode ser 0).');
    if (!(n >= 1 && n <= 60 && Math.round(n) === n)) return falha('scParcelas', 'O parcelamento ordinário vai de 1 a 60 parcelas (Lei 10.522/2002, art. 10).');
    if (!(desc >= 0 && desc <= 100)) return falha('scDesconto', 'Informe o desconto em %, de 0 a 100.');
    if (!(nt >= 1 && nt <= pf.prazo && Math.round(nt) === nt)) return falha('scPrazoTr', 'Para este perfil, a transação vai de 1 a ' + pf.prazo + ' parcelas.');
    if (!(ent >= 0 && ent < 100)) return falha('scEntrada', 'Informe a entrada em %, de 0 a 99.');
    var total = P + A;
    /* Parcelamento ordinário */
    var nOk = n, aviso = '';
    if (total / n < pf.min) { nOk = Math.max(1, Math.floor(total / pf.min)); aviso = 'Com parcela mínima de ' + brl.format(pf.min) + ', o máximo para este valor é ' + nOk + ' parcela(s).'; }
    var baseOrd = total / nOk, totOrd = projetar(baseOrd, nOk);
    /* Transação: desconto só nos acessórios, limitado ao teto sobre o total */
    var descValor = Math.min(A * desc / 100, total * pf.teto / 100), limitado = A * desc / 100 > total * pf.teto / 100;
    var totTr = total - descValor, entrada = totTr * ent / 100, saldo = totTr - entrada, baseTr = saldo / nt, totTrProj = entrada + projetar(baseTr, nt);
    var col = function (v) { return '<td>' + v + '</td>'; };
    var html = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Débito de ' + brl.format(total) + ' (principal ' + brl.format(P) + ' + acessórios ' + brl.format(A) + ')</caption><thead><tr><th scope="col"></th><th scope="col">À vista</th><th scope="col">Parcelamento ordinário ' + selo('vigente') + '</th><th scope="col">Transação ' + selo('simula') + '</th></tr></thead><tbody>' +
      '<tr><th scope="row" style="text-align:left">Desconto</th>' + col('—') + col('—') + col(brl.format(descValor) + (limitado ? '<br><small>limitado ao teto de ' + pf.teto + '%</small>' : '')) + '</tr>' +
      '<tr><th scope="row" style="text-align:left">Valor a pagar, sem correção</th>' + col(brl.format(total)) + col(brl.format(total)) + col(brl.format(totTr)) + '</tr>' +
      '<tr><th scope="row" style="text-align:left">Entrada</th>' + col('—') + col('1ª parcela') + col(ent ? brl.format(entrada) : '—') + '</tr>' +
      '<tr><th scope="row" style="text-align:left">Parcelas</th>' + col('1') + col(nOk + ' × ' + brl.format(baseOrd) + '<br><small>+ Selic e 1% a cada mês</small>') + col(nt + ' × ' + brl.format(baseTr) + '<br><small>+ Selic e 1% a cada mês</small>') + '</tr>' +
      '<tr><th scope="row" style="text-align:left"><strong>Total estimado com a Selic projetada</strong></th>' + col('<strong>' + brl.format(total) + '</strong>') + col('<strong>' + brl.format(totOrd) + '</strong>') + col('<strong>' + brl.format(totTrProj) + '</strong>') + '</tr>' +
      '</tbody></table>';
    if (aviso) html += '<p class="alert" style="margin-top:12px">' + selo('depende') + ' ' + esc(aviso) + ' Parcela mínima pela Portaria PGFN 448/2019; confira a portaria vigente.</p>';
    html += '<p class="fine">Projeção com Selic média de ' + pct(MEDIA) + ' ao mês (últimos 12 meses publicados). A Selic real de cada mês muda o valor final. A transação depende de edital aberto, de o débito se enquadrar nele e da capacidade de pagamento calculada pela PGFN.</p>';
    out.innerHTML = html;
  }

  /* ---------- 4) Prazos ---------- */
  function pascoa(a) { var b = a % 19, c = Math.floor(a / 100), e = a % 100, f = Math.floor(c / 4), g = c % 4, h = Math.floor((c + 8) / 25), i = Math.floor((c - h + 1) / 3), j = (19 * b + c - f - i + 15) % 30, k = Math.floor(e / 4), l = e % 4, m = (32 + 2 * g + 2 * k - j - l) % 7, n = Math.floor((b + 11 * j + 22 * m) / 451), mes = Math.floor((j + m - 7 * n + 114) / 31), dia = ((j + m - 7 * n + 114) % 31) + 1; return new Date(a, mes - 1, dia); }
  var cacheFer = {};
  /* Feriados nacionais e da Justiça Federal (Lei 5.010/1966, art. 62): Semana Santa (quarta a domingo),
     segunda e terça de Carnaval, 11/08, 01 e 02/11 e 08/12. Feriados locais não entram. */
  function naoUtil(dt) {
    var a = dt.getFullYear();
    if (!cacheFer[a]) {
      var s = {}, add = function (x) { s[iso(x)] = 1; }, p = pascoa(a), soma = function (n) { var x = new Date(p); x.setDate(p.getDate() + n); return x; };
      ['01-01', '04-21', '05-01', '08-11', '09-07', '10-12', '11-01', '11-02', '11-15', '11-20', '12-08', '12-25'].forEach(function (k) { s[a + '-' + k] = 1; });
      [-48, -47, -4, -3, -2, -1].forEach(function (n) { add(soma(n)); });
      cacheFer[a] = s;
    }
    var w = dt.getDay(), m = dt.getMonth(), dia = dt.getDate();
    if ((m === 11 && dia >= 20) || (m === 0 && dia <= 6)) return true; /* art. 62, I */
    return w === 0 || w === 6 || !!cacheFer[a][iso(dt)];
  }
  var suspenso = function (dt) { var m = dt.getMonth(), dia = dt.getDate(); return (m === 11 && dia >= 20) || (m === 0 && dia <= 20); };
  function proximoUtil(dt, comRecesso) { var x = new Date(dt); while (naoUtil(x) || (comRecesso && suspenso(x))) x.setDate(x.getDate() + 1); return x; }
  /* Exclui o dia do começo e inclui o do vencimento (CPC, art. 224); começa no 1º dia útil seguinte */
  function contarUteis(inicio, n) { var x = new Date(inicio), c = 0; while (c < n) { x.setDate(x.getDate() + 1); if (!naoUtil(x) && !suspenso(x)) c++; } return x; }
  function contarCorridos(inicio, n) { var x = new Date(inicio); x.setDate(x.getDate() + n); return proximoUtil(x, false); }
  var eventos = [];
  function prazos() {
    var erro = $('ptErro'), out = $('ptSaida'); erro.textContent = ''; eventos = [];
    var cit = $('ptCitacao').value ? lerData($('ptCitacao').value) : null, gar = $('ptGarantia').value ? lerData($('ptGarantia').value) : null, sus = $('ptSuspensao').value ? lerData($('ptSuspensao').value) : null;
    if (($('ptCitacao').value && !cit) || ($('ptGarantia').value && !gar) || ($('ptSuspensao').value && !sus)) { erro.textContent = 'Confira as datas informadas.'; out.innerHTML = ''; return; }
    var linhas = [];
    if (cit) {
      var a = contarCorridos(cit, 5), b = contarUteis(cit, 5);
      linhas.push(['Pagar ou garantir a execução', 'LEF, art. 8º: 5 dias da citação', a, b]);
      eventos.push(['Prazo para pagar ou garantir a execução (LEF, art. 8º)', a < b ? a : b]);
    }
    if (gar) {
      var c = contarCorridos(gar, 30), e = contarUteis(gar, 30);
      linhas.push(['Embargos à execução', 'LEF, art. 16: 30 dias da garantia', c, e]);
      eventos.push(['Prazo para embargos à execução fiscal (LEF, art. 16)', c < e ? c : e]);
    }
    var html = '';
    if (linhas.length) {
      html += '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Datas estimadas. Use a mais cedo como alvo.</caption><thead><tr><th scope="col">Prazo</th><th scope="col">Regra ' + selo('vigente') + '</th><th scope="col">Dias corridos</th><th scope="col">Dias úteis ' + selo('depende') + '</th></tr></thead><tbody>' +
        linhas.map(function (l) { return '<tr><td>' + l[0] + '</td><td>' + l[1] + '</td><td><strong>' + br(l[2]) + '</strong></td><td>' + br(l[3]) + '</td></tr>'; }).join('') + '</tbody></table>';
    }
    if (sus) {
      var arq = new Date(sus); arq.setFullYear(arq.getFullYear() + 1);
      var presc = new Date(arq); presc.setFullYear(presc.getFullYear() + 5);
      html += '<table style="margin-top:12px"><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Suspensão por não se acharem o devedor ou bens (LEF, art. 40)</caption><thead><tr><th scope="col">Marco</th><th scope="col">Regra</th><th scope="col">Data estimada</th></tr></thead><tbody>' +
        '<tr><td>Fim da suspensão e arquivamento ' + selo('vigente') + '</td><td>1 ano da suspensão (art. 40, § 2º)</td><td>' + br(arq) + '</td></tr>' +
        '<tr><td>Prescrição intercorrente possível ' + selo('depende') + '</td><td>5 anos após o arquivamento (art. 40, § 4º; CTN, art. 174; STJ, Tema 566)</td><td>' + br(presc) + '</td></tr></tbody></table>';
      eventos.push(['Fim da suspensão do art. 40 da LEF: arquivamento', arq], ['Prescrição intercorrente possível (LEF, art. 40, § 4º)', presc]);
    }
    if (!html) html = '<p class="fine">Preencha ao menos uma data para ver os prazos.</p>';
    out.innerHTML = html; $('ptAgenda').hidden = !eventos.length;
  }
  $('ptAgenda').addEventListener('click', function () {
    var f = function (dt) { return iso(dt).replace(/-/g, ''); }, agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prumo//Prazos de execucao fiscal//PT-BR', 'CALSCALE:GREGORIAN'];
    eventos.forEach(function (ev, i) {
      var fim = new Date(ev[1]); fim.setDate(fim.getDate() + 1);
      ics.push('BEGIN:VEVENT', 'UID:prumo-' + f(ev[1]) + '-' + i + '@prumo-empresas.onrender.com', 'DTSTAMP:' + agora, 'DTSTART;VALUE=DATE:' + f(ev[1]), 'DTEND;VALUE=DATE:' + f(fim),
        'SUMMARY:' + ev[0], 'DESCRIPTION:Data estimada pelo Prumo. Confirme com o advogado nos autos.', 'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:' + ev[0], 'END:VALARM', 'END:VEVENT');
    });
    ics.push('END:VCALENDAR');
    var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' })); a.download = 'prazos-execucao-fiscal.ics';
    d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  /* Notas fixas com a regra de cada ferramenta */
  $('efNota').innerHTML = 'Multa e juros: Lei 9.430/1996, art. 61. Juros pela Selic do mês seguinte ao vencimento até o mês anterior ao do cálculo, mais 1%. Com multa de ofício, os juros também incidem sobre a multa (Súmula CARF 108). O valor oficial é o do Regularize, que considera pagamentos, compensações e decisões. <span id="efFonte">Carregando a Selic oficial…</span>';
  $('scNota').innerHTML = 'Parcelamento ordinário: até 60 parcelas, corrigidas pela Selic + 1% (Lei 10.522/2002, arts. 10 e 13). Transação: desconto só sobre multa, juros e encargo, nunca sobre o principal, até 65% do total e 120 meses, ou 70% e 145 meses para pessoa física, microempresa e empresa de pequeno porte (Lei 13.988/2020, art. 11).';
  $('ptNota').innerHTML = '<strong>Por que duas colunas:</strong> o CPC manda contar prazos processuais em dias úteis e suspende os prazos de 20/12 a 20/01 (arts. 219 e 220), mas a aplicação aos prazos da LEF é discutida nos tribunais. Por segurança, trate a data em dias corridos como limite. Com seguro garantia, o STJ entendeu que o prazo de embargos corre da intimação do aceite da garantia (REsp 2.185.262/RJ, 2024). Na conta entram fins de semana, feriados nacionais e os feriados da Justiça Federal: 20/12 a 06/01, Semana Santa de quarta a domingo, segunda e terça de Carnaval, 11/08, 01 e 02/11 e 08/12 (Lei 5.010/1966, art. 62). Feriados estaduais e municipais e a Justiça estadual não entram.';

  [['efForm', atualizar], ['scForm', cenarios], ['ptForm', prazos]].forEach(function (par) {
    var f = $(par[0]);
    ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function (e) { if (e.target && e.target.id === 'ptAgenda') return; par[1](); medir(); }); });
    f.addEventListener('submit', function (e) { e.preventDefault(); par[1](); });
  });

  fetch('/selic.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) {
    SELIC = j.meses || {}; ULTIMO = j.ultimo_mes || Object.keys(SELIC).sort().pop();
    var ult = Object.keys(SELIC).sort().slice(-12); MEDIA = ult.reduce(function (s, k) { return s + SELIC[k]; }, 0) / (ult.length || 1);
    $('efFonte').textContent = 'Selic do Banco Central (série 4390) disponível até ' + rotulo(ULTIMO) + '.';
  }).catch(function () { $('efFonte').textContent = 'Não consegui carregar a Selic oficial agora; os juros ficam incompletos.'; })
    .then(function () { atualizar(); if (ultimoCalc) { $('scPrincipal').value = ultimoCalc.P.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); $('scAcessorios').value = ultimoCalc.A.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); } cenarios(); prazos(); });

  /* Interesse no plano Pro */
  var pro = $('proBotao'), proSt = $('proStatus'), ja = false; try { ja = localStorage.getItem('prumo-pro-interesse') === '1'; } catch (e) {}
  if (ja) { pro.disabled = true; proSt.textContent = 'Seu interesse já foi contado. Obrigado!'; }
  pro.addEventListener('click', function () { if (window.prumoMedir) window.prumoMedir('interesse_pro'); try { localStorage.setItem('prumo-pro-interesse', '1'); } catch (e) {} pro.disabled = true; proSt.textContent = 'Obrigado! Seu interesse foi contado.'; });
})();
