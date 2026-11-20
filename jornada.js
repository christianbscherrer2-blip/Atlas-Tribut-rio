/* Calculadora do custo da jornada (EC 141/2026). Roda no navegador; nada é enviado. */
(function () {
  'use strict';
  if (!document.getElementById('calcJornada')) return;
  var $ = function (id) { return document.getElementById(id); };
  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function num(v) {
    v = String(v).trim().replace(/\s/g, '');
    if (v === '') return NaN;
    if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
    return Number(v);
  }
  function render() {
    var sal = num($('cjSal').value), cur = num($('cjCur').value), n = num($('cjN').value);
    var encRaw = $('cjEnc').value.trim(), enc = encRaw === '' ? 0 : num(encRaw);
    var err = $('cjErr'), out = $('cjOut'), m = [];
    if (!(sal > 0)) m.push('Informe o salário mensal, maior que zero.');
    if (!(cur >= 1 && cur <= 44)) m.push('A jornada atual deve estar entre 1 e 44 horas por semana.');
    if (!(n >= 1 && n <= 10000 && Math.floor(n) === n)) m.push('Informe o número de pessoas na escala (inteiro, de 1 a 10.000).');
    if (!(enc >= 0 && enc <= 200)) m.push('Encargos adicionais: informe um percentual entre 0 e 200.');
    if (m.length) { err.textContent = m[0]; out.innerHTML = ''; return; }
    err.textContent = '';
    var steps = [[42, '42 h (em até 60 dias)'], [40, '40 h (em até 14 meses)']].filter(function (s) { return s[0] < cur; });
    if (!steps.length) { out.innerHTML = '<p class="toolNote">Com jornada atual de ' + cur + ' h, a emenda não reduz mais as horas. Confira se a sua escala também muda para 5x2.</p>'; return; }
    var fator = 1 + enc / 100, horaAtual = sal / (cur * 5), folhaAtual = n * sal * fator;
    var rows = steps.map(function (s) {
      var h = s[0], horaNova = sal / (h * 5), pessoas = Math.ceil(n * cur / h - 1e-9), folhaNova = pessoas * sal * fator;
      return '<tr><td>' + s[1] + '</td><td>' + money.format(horaNova) + '</td><td>+' + pct.format((horaNova / horaAtual - 1) * 100) + '%</td><td>' + pessoas + '</td><td>' + money.format(folhaNova) + '</td><td>+' + money.format(folhaNova - folhaAtual) + ' (' + pct.format((folhaNova / folhaAtual - 1) * 100) + '%)</td></tr>';
    }).join('');
    out.innerHTML = '<table><thead><tr><th scope="col">Nova jornada</th><th scope="col">Valor da hora</th><th scope="col">Variação da hora</th><th scope="col">Pessoas para manter a cobertura</th><th scope="col">Folha mensal estimada</th><th scope="col">Diferença</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="toolNote">Hoje: hora de ' + money.format(horaAtual) + ' e folha de ' + money.format(folhaAtual) + ' para ' + n + ' pessoa(s) em ' + cur + ' h semanais.</p>';
  }
  ['cjSal', 'cjCur', 'cjN', 'cjEnc'].forEach(function (id) { $(id).addEventListener('input', render); });
  render();
})();
