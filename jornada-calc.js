/* Prumo · calculadoras da jornada (trabalhador, empresa e comparador de escalas).
   Tudo roda no navegador. Cada resultado traz o selo da regra: em vigor, aguardando
   regulamentação ou simulação. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var n1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  var n2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function lerNum(s) {
    var t = String(s || '').replace(/[R$\s%]/g, '');
    if (!t) return NaN;
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return Number(t);
  }
  var SELOS = { vigente: ['seloVigente', 'Em vigor'], regula: ['seloRegula', 'Aguardando regulamentação'], simula: ['seloSimula', 'Simulação'] };
  var selo = function (k) { return '<span class="selo ' + SELOS[k][0] + '">' + SELOS[k][1] + '</span>'; };
  var medido = false;
  var medir = function () { if (!medido) { medido = true; if (window.prumoMedir) window.prumoMedir('calculo_jornada'); } };

  /* Feriados nacionais: Lei 662/1949, Lei 6.802/1980 (12/10), Lei 14.759/2023 (20/11) e Sexta-feira
     Santa. Carnaval e Corpus Christi são ponto facultativo, não feriado nacional. */
  function pascoa(a) {
    var b = a % 19, c = Math.floor(a / 100), e = a % 100, f = Math.floor(c / 4), g = c % 4, h = Math.floor((c + 8) / 25),
      i = Math.floor((c - h + 1) / 3), j = (19 * b + c - f - i + 15) % 30, k = Math.floor(e / 4), l = e % 4,
      m = (32 + 2 * g + 2 * k - j - l) % 7, n = Math.floor((b + 11 * j + 22 * m) / 451), mes = Math.floor((j + m - 7 * n + 114) / 31),
      dia = ((j + m - 7 * n + 114) % 31) + 1;
    return new Date(a, mes - 1, dia);
  }
  function feriados(ano) {
    var p = pascoa(ano), sexta = new Date(p); sexta.setDate(p.getDate() - 2);
    var lista = [['01-01', 'Confraternização Universal'], ['04-21', 'Tiradentes'], ['05-01', 'Dia do Trabalho'], ['09-07', 'Independência'],
      ['10-12', 'Nossa Senhora Aparecida'], ['11-02', 'Finados'], ['11-15', 'Proclamação da República'], ['11-20', 'Dia da Consciência Negra'], ['12-25', 'Natal']];
    var mapa = {};
    lista.forEach(function (f) { mapa[ano + '-' + f[0]] = f[1]; });
    mapa[ano + '-' + String(sexta.getMonth() + 1).padStart(2, '0') + '-' + String(sexta.getDate()).padStart(2, '0')] = 'Sexta-feira Santa';
    return mapa;
  }
  var chave = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };

  /* ---------- Escalas ---------- */
  var ESCALAS = {
    '5x2-42': { nome: '5x2 · 42 h por semana', dias: 5, horas: 42, padrao: [1, 2, 3, 4, 5], selo: 'vigente', dica: 'Regra da EC 141/2026, em até 60 dias da promulgação (meados de dezembro de 2026).' },
    '5x2-40': { nome: '5x2 · 40 h por semana', dias: 5, horas: 40, padrao: [1, 2, 3, 4, 5], selo: 'vigente', dica: 'Regra da EC 141/2026 a partir de cerca de dezembro de 2027. Já pode ser adotada antes.' },
    '5x2-44': { nome: '5x2 · 44 h por semana (regra anterior)', dias: 5, horas: 44, padrao: [1, 2, 3, 4, 5], selo: 'vigente', dica: 'Limite anterior. Vale até a fase de 42 h, em meados de dezembro de 2026.' },
    '6x1-44': { nome: '6x1 · 44 h por semana (regra anterior)', dias: 6, horas: 44, padrao: [1, 2, 3, 4, 5, 6], selo: 'vigente', dica: 'Regra anterior. Depois da EC 141/2026, a 6x1 só por convenção ou acordo coletivo, com compensação no mesmo mês.' },
    '12x36': { nome: '12x36 (média de 42 h por semana)', dias: 3.5, horas: 42, padrao: 'alterna', selo: 'regula', dica: 'CLT, art. 59-A. Com o limite de 40 h (dez/2027), a média de 42 h depende de negociação coletiva e de regulamentação.' },
    '4x3-40': { nome: '4x3 · 40 h por semana (10 h por dia)', dias: 4, horas: 40, padrao: [1, 2, 3, 4], selo: 'simula', dica: 'Não está na EC 141/2026. Exige acordo de compensação de jornada (CLT, art. 59, § 2º).' },
    'pers': { nome: 'Personalizada', selo: 'simula', dica: 'Monte a sua escala. Até 40 h por semana e 2 folgas, em média, é o alvo da EC 141/2026.' }
  };
  var selEsc = $('jtEscala');
  selEsc.innerHTML = Object.keys(ESCALAS).map(function (k) { return '<option value="' + k + '">' + esc(ESCALAS[k].nome) + '</option>'; }).join('');
  var hoje = new Date(); $('jtMes').value = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');

  function custoPessoa(sal, regime, rat, terc) {
    var patronal = regime === 'normal' ? 20 + rat + terc : regime === 'anexo4' ? 20 + rat : 0;
    var encargos = 8 + patronal; /* FGTS + contribuição patronal */
    var provisoes = 1 + 1 / 12 + (1 / 12) * (4 / 3); /* 13º e férias com 1/3 */
    return { total: sal * provisoes * (1 + encargos / 100), provisoes: provisoes, encargos: encargos, patronal: patronal };
  }

  /* ---------- Trabalhador ---------- */
  function trabalhador() {
    var e = ESCALAS[selEsc.value], erro = $('jtErro'), out = $('jtSaida');
    d.querySelectorAll('.jtPers').forEach(function (el) { el.hidden = selEsc.value !== 'pers'; });
    $('jtEscalaDica').innerHTML = selo(e.selo) + ' ' + esc(e.dica);
    erro.textContent = ''; [].forEach.call(d.querySelectorAll('#jtForm input'), function (i) { i.removeAttribute('aria-invalid'); });
    var falha = function (id, msg) { $(id).setAttribute('aria-invalid', 'true'); erro.textContent = msg; out.innerHTML = ''; };
    var dias = e.dias, horasSem = e.horas, padrao = e.padrao;
    if (selEsc.value === 'pers') {
      dias = lerNum($('jtDias').value); var hd = lerNum($('jtHoras').value);
      if (!(dias >= 1 && dias <= 7 && Math.round(dias) === dias)) return falha('jtDias', 'Informe de 1 a 7 dias de trabalho por semana.');
      if (!(hd > 0 && hd <= 12)) return falha('jtHoras', 'Informe as horas por dia, de 1 a 12.');
      horasSem = dias * hd; padrao = [1, 2, 3, 4, 5, 6, 0].slice(0, dias);
    }
    var sal = lerNum($('jtSal').value), he = lerNum($('jtHE').value || '0'), adic = lerNum($('jtAdic').value);
    if (!(sal > 0 && sal < 1e7)) return falha('jtSal', 'Informe o salário bruto mensal, por exemplo 2.500,00.');
    if (!(he >= 0 && he <= 200)) return falha('jtHE', 'Informe as horas extras do mês, de 0 a 200.');
    if (!(adic >= 50 && adic <= 300)) return falha('jtAdic', 'O adicional de hora extra vai de 50% (mínimo da Constituição) a 300%.');
    var mes = /^(\d{4})-(\d{2})$/.exec($('jtMes').value);
    if (!mes) return falha('jtMes', 'Escolha o mês de referência.');
    var ano = +mes[1], m = +mes[2] - 1, fer = feriados(ano);
    var trab = 0, folgas = 0, uteis = 0, domFer = 0, ferMes = [];
    for (var dt = new Date(ano, m, 1), idx = 0; dt.getMonth() === m; dt.setDate(dt.getDate() + 1), idx++) {
      var w = dt.getDay(), nomeFer = fer[chave(dt)];
      if (nomeFer) ferMes.push(String(dt.getDate()).padStart(2, '0') + '/' + String(m + 1).padStart(2, '0') + ' ' + nomeFer);
      if (w === 0 || nomeFer) domFer++; else uteis++;
      var trabalha = padrao === 'alterna' ? idx % 2 === 0 : padrao.indexOf(w) >= 0;
      if (trabalha && nomeFer && padrao !== 'alterna') trabalha = false; /* feriado em dia de trabalho vira folga; na 12x36 o feriado é compensado (art. 59-A, parágrafo único) */
      if (trabalha) trab++; else if (!nomeFer) folgas++;
    }
    var divisor = horasSem * 5, hora = sal / divisor;
    var valorHE = hora * (1 + adic / 100) * he, dsr = uteis ? valorHE / uteis * domFer : 0;
    var linhas = [
      ['Escala', selo(e.selo) + ' ' + esc(selEsc.value === 'pers' ? dias + ' dias × ' + n1.format(horasSem / dias) + ' h' : e.nome)],
      ['Horas por semana', n1.format(horasSem) + ' h'],
      ['Horas por mês (divisor)', n1.format(divisor) + ' h'],
      ['Valor da sua hora', brl.format(hora)],
      ['Dias de trabalho no mês', String(trab)],
      ['Folgas no mês', folgas + (ferMes.length ? ' + ' + ferMes.length + ' feriado(s)' : '')]
    ];
    if (he > 0) {
      linhas.push(['Horas extras (' + n1.format(he) + ' h com ' + n1.format(adic) + '%)', brl.format(valorHE)]);
      linhas.push(['Reflexo no DSR (' + domFer + ' domingos e feriados ÷ ' + uteis + ' dias úteis)', brl.format(dsr)]);
    }
    linhas.push(['<strong>Remuneração bruta estimada</strong>', '<strong>' + brl.format(sal + valorHE + dsr) + '</strong>']);
    var html = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Resultado para ' + esc(new Date(ano, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })) + ', valores brutos, antes de INSS e IR</caption><tbody>' +
      linhas.map(function (l) { return '<tr><th scope="row" style="text-align:left">' + l[0] + '</th><td>' + l[1] + '</td></tr>'; }).join('') + '</tbody></table>';
    if (ferMes.length) html += '<p class="fine">Feriados nacionais no mês: ' + esc(ferMes.join(' · ')) + '. Feriados estaduais e municipais não entram na conta.</p>';
    /* Mesmo salário, jornada menor: a hora fica mais cara */
    var fases = [[44, 'vigente', 'Regra anterior'], [42, 'vigente', 'Meados de dez/2026'], [40, 'vigente', 'Cerca de dez/2027']].filter(function (f) { return f[0] <= horasSem; });
    if (fases.length > 1) html += '<table style="margin-top:12px"><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Com o mesmo salário, quanto vale a sua hora em cada jornada (a EC 141/2026 proíbe reduzir o salário)</caption><thead><tr><th scope="col">Jornada</th><th scope="col">Quando</th><th scope="col">Divisor</th><th scope="col">Valor da hora</th><th scope="col">Diferença</th></tr></thead><tbody>' +
      fases.map(function (f) { var h = sal / (f[0] * 5); return '<tr><td>' + f[0] + ' h ' + selo(f[1]) + '</td><td>' + f[2] + '</td><td>' + f[0] * 5 + '</td><td>' + brl.format(h) + '</td><td>' + (h === hora ? '—' : (h > hora ? '+' : '') + n1.format((h / hora - 1) * 100) + '%') + '</td></tr>'; }).join('') + '</tbody></table>';
    out.innerHTML = html;
  }

  /* ---------- Empresa ---------- */
  function empresa() {
    var erro = $('jeErro'), out = $('jeSaida'); erro.textContent = '';
    [].forEach.call(d.querySelectorAll('#jeForm input'), function (i) { i.removeAttribute('aria-invalid'); });
    var falha = function (id, msg) { $(id).setAttribute('aria-invalid', 'true'); erro.textContent = msg; out.innerHTML = ''; };
    var regime = $('jeRegime').value;
    d.querySelector('.jeNormal').hidden = regime === 'simples'; d.querySelector('.jeTerc').hidden = regime !== 'normal';
    var n = lerNum($('jeN').value), sal = lerNum($('jeSal').value), atual = +$('jeJorn').value, rat = lerNum($('jeRat').value), terc = lerNum($('jeTerc').value);
    if (!(n >= 1 && n <= 10000 && Math.round(n) === n)) return falha('jeN', 'Informe quantas pessoas há na equipe (número inteiro).');
    if (!(sal > 0 && sal < 1e7)) return falha('jeSal', 'Informe o salário médio, por exemplo 2.200,00.');
    if (regime !== 'simples' && !(rat >= 0.5 && rat <= 6)) return falha('jeRat', 'O RAT ajustado vai de 0,5% a 6%.');
    if (regime === 'normal' && !(terc >= 0 && terc <= 10)) return falha('jeTerc', 'Informe o percentual de terceiros, de 0% a 10%.');
    var c = custoPessoa(sal, regime, regime === 'simples' ? 0 : rat, regime === 'normal' ? terc : 0);
    var fases = [[atual, 'Hoje', 'vigente']];
    if (atual > 42) fases.push([42, 'Meados de dez/2026', 'vigente']);
    fases.push([40, 'Cerca de dez/2027', 'vigente']);
    var custoEquipe = n * c.total;
    var col = function (f) {
      var nova = f[0], falta = n * (atual - nova), hora = sal / (nova * 5);
      var heCusto = falta * 5 * hora * 1.5 * (1 + 1 / 6) * c.provisoes * (1 + c.encargos / 100);
      var novas = falta > 0 ? Math.ceil(falta / nova) : 0;
      return { nova: nova, falta: falta, hora: hora, he: heCusto, novas: novas, contratar: novas * c.total, cobertura: falta > 0 ? nova / atual * 100 : 100, hePessoaDia: falta > 0 ? (atual - nova) / 5 : 0 };
    };
    var cols = fases.map(col);
    var linha = function (rotulo, fn) { return '<tr><th scope="row" style="text-align:left">' + rotulo + '</th>' + cols.map(function (x) { return '<td>' + fn(x) + '</td>'; }).join('') + '</tr>'; };
    var html = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Custo mensal estimado da equipe de ' + n + ' pessoa(s) e formas de repor as horas</caption><thead><tr><th scope="col">Por mês</th>' +
      fases.map(function (f) { return '<th scope="col">' + f[0] + ' h · ' + f[1] + ' ' + selo(f[2]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      linha('Valor da hora', function (x) { return brl.format(x.hora); }) +
      linha('Custo da equipe, sem repor horas', function () { return brl.format(custoEquipe); }) +
      linha('Horas que faltam por semana', function (x) { return x.falta ? n1.format(x.falta) + ' h' : '—'; }) +
      linha('A · Repor com horas extras (custo a mais)', function (x) { return x.falta ? '+' + brl.format(x.he) + '<br><small>' + n1.format(x.hePessoaDia * 60 / 60) + ' h extra por pessoa por dia</small>' : '—'; }) +
      linha('B · Contratar (custo a mais)', function (x) { return x.falta ? '+' + brl.format(x.contratar) + '<br><small>' + x.novas + ' pessoa(s)</small>' : '—'; }) +
      linha('C · Reorganizar sem repor', function (x) { return x.falta ? 'Sem custo direto<br><small>cobertura de ' + n1.format(x.cobertura) + '%</small>' : '—'; }) +
      '</tbody></table>';
    html += '<details class="deepDive" style="margin-top:12px"><summary>Custo de uma pessoa, parcela por parcela</summary><div class="deepContent"><table><tbody>' +
      '<tr><th scope="row" style="text-align:left">Salário</th><td>' + brl.format(sal) + '</td></tr>' +
      '<tr><th scope="row" style="text-align:left">13º salário (1/12)</th><td>' + brl.format(sal / 12) + '</td></tr>' +
      '<tr><th scope="row" style="text-align:left">Férias com 1/3 (1/12 × 4/3)</th><td>' + brl.format(sal / 12 * 4 / 3) + '</td></tr>' +
      '<tr><th scope="row" style="text-align:left">FGTS (8%)</th><td>' + brl.format(sal * c.provisoes * 0.08) + '</td></tr>' +
      '<tr><th scope="row" style="text-align:left">Contribuição patronal (' + n2.format(c.patronal) + '%)</th><td>' + (c.patronal ? brl.format(sal * c.provisoes * c.patronal / 100) : 'No DAS') + '</td></tr>' +
      '<tr><th scope="row" style="text-align:left"><strong>Total por mês</strong></th><td><strong>' + brl.format(c.total) + '</strong></td></tr></tbody></table></div></details>';
    if (cols.some(function (x) { return x.hePessoaDia > 2; })) html += '<p class="alert" style="margin-top:12px">A opção A passa do limite de 2 horas extras por dia da CLT (art. 59). Nesse caso, ela não é viável sozinha.</p>';
    out.innerHTML = html;
  }

  /* ---------- Comparador ---------- */
  var MODELOS = [
    { nome: '5x2 · 40 h', horas: 40, folgas: 2, selo: 'vigente', nota: 'Limite a partir de cerca de dez/2027. Pode ser adotada antes.' },
    { nome: '5x2 · 42 h', horas: 42, folgas: 2, selo: 'vigente', nota: 'Regra a partir de meados de dez/2026.' },
    { nome: '6x1 · 42 h', horas: 42, folgas: 1, selo: 'vigente', nota: 'Depois da EC 141/2026, só com convenção ou acordo coletivo e compensação no mês.' },
    { nome: '12x36 · média de 42 h', horas: 42, folgas: 3.5, selo: 'regula', nota: 'CLT, art. 59-A. Com o limite de 40 h, depende de negociação e regulamentação.' },
    { nome: '4x3 · 40 h (10 h por dia)', horas: 40, folgas: 3, selo: 'simula', nota: 'Não está na emenda. Exige acordo de compensação.' },
    { nome: '5x2 · 44 h (regra anterior)', horas: 44, folgas: 2, selo: 'vigente', nota: 'Só até meados de dez/2026. Mostrada para comparar com hoje.' }
  ];
  function comparar() {
    var erro = $('jcErro'), out = $('jcSaida'); erro.textContent = '';
    [].forEach.call(d.querySelectorAll('#jcForm input'), function (i) { i.removeAttribute('aria-invalid'); });
    var falha = function (id, msg) { $(id).setAttribute('aria-invalid', 'true'); erro.textContent = msg; out.innerHTML = ''; };
    var h = lerNum($('jcHoras').value), p = lerNum($('jcPostos').value), sal = lerNum($('jcSal').value), regime = $('jcRegime').value;
    if (!(h > 0 && h <= 168)) return falha('jcHoras', 'Informe as horas de funcionamento por semana, de 1 a 168.');
    if (!(p >= 1 && p <= 1000 && Math.round(p) === p)) return falha('jcPostos', 'Informe quantas pessoas trabalham ao mesmo tempo (número inteiro).');
    if (!(sal > 0 && sal < 1e7)) return falha('jcSal', 'Informe o salário médio, por exemplo 2.200,00.');
    var c = custoPessoa(sal, regime, regime === 'simples' ? 0 : 2, regime === 'normal' ? 5.8 : 0);
    var linhas = MODELOS.map(function (mo) { var pessoas = Math.ceil(h * p / mo.horas); return { mo: mo, pessoas: pessoas, custo: pessoas * c.total }; });
    var novas = linhas.filter(function (l) { return l.mo.horas <= 42; }), menor = Math.min.apply(null, novas.map(function (l) { return l.custo; }));
    var unico = novas.filter(function (l) { return l.custo === menor; }).length === 1;
    out.innerHTML = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Para cobrir ' + n1.format(h) + ' h por semana com ' + p + ' pessoa(s) ao mesmo tempo (' + n1.format(h * p) + ' horas de trabalho por semana)</caption><thead><tr><th scope="col">Escala</th><th scope="col">Situação</th><th scope="col">Folgas por semana</th><th scope="col">Pessoas (mínimo)</th><th scope="col">Sobra de horas por semana</th><th scope="col">Custo mensal</th></tr></thead><tbody>' +
      linhas.map(function (l) { return '<tr><td>' + esc(l.mo.nome) + '<br><small>' + esc(l.mo.nota) + '</small></td><td>' + selo(l.mo.selo) + '</td><td>' + n1.format(l.mo.folgas) + '</td><td>' + l.pessoas + '</td><td>' + n1.format(l.pessoas * l.mo.horas - h * p) + ' h</td><td>' + brl.format(l.custo) + (unico && l.custo === menor && l.mo.horas <= 42 ? '<br><small>menor custo entre as escalas novas</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
  }

  /* Recalcula enquanto a pessoa digita; conta um uso por visita, só quando ela mexe nos campos */
  [['jtForm', trabalhador], ['jeForm', empresa], ['jcForm', comparar]].forEach(function (par) {
    var f = $(par[0]);
    ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function () { par[1](); medir(); }); });
    f.addEventListener('submit', function (e) { e.preventDefault(); par[1](); });
    par[1]();
  });

  /* Interesse no plano Pro: só um clique contado, sem dados pessoais */
  var pro = $('proBotao'), proSt = $('proStatus');
  var jaPro = false; try { jaPro = localStorage.getItem('prumo-pro-interesse') === '1'; } catch (e) {}
  if (jaPro) { pro.disabled = true; proSt.textContent = 'Seu interesse já foi contado. Obrigado!'; }
  pro.addEventListener('click', function () {
    if (window.prumoMedir) window.prumoMedir('interesse_pro');
    try { localStorage.setItem('prumo-pro-interesse', '1'); } catch (e) {}
    pro.disabled = true; proSt.textContent = 'Obrigado! Seu interesse foi contado.';
  });
})();
