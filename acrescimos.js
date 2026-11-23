/* Calculadora de acréscimos moratórios de tributo federal (Lei 9.430/1996, art. 61).
   Multa de mora: 0,33% por dia de atraso, contada do dia seguinte ao vencimento até o dia do
   pagamento, limitada a 20%. Juros: soma da Selic mensal do mês seguinte ao vencimento até o mês
   anterior ao pagamento, mais 1% no mês do pagamento; pagamento no mesmo mês do vencimento não tem juros.
   A Selic vem de /selic.json (Banco Central, série 4390), atualizado pelo robô do repositório.
   Tudo roda no navegador; nada é enviado. */
(function () {
  'use strict';
  var form = document.getElementById('acrForm');
  if (!form) return;
  var $valor = document.getElementById('acrValor'), $venc = document.getElementById('acrVenc'), $pag = document.getElementById('acrPag');
  var $erro = document.getElementById('acrErro'), $saida = document.getElementById('acrSaida'), $fonte = document.getElementById('acrFonte');
  var SELIC = null, ULTIMO = null;
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var pct = function (n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var rotulo = function (chave) { var p = chave.split('-'); return MESES[+p[1] - 1] + '/' + p[0]; };
  var chaveMes = function (a, m) { return a + '-' + (m < 10 ? '0' : '') + m; };

  /* Datas de exemplo para a ferramenta abrir já mostrando um resultado: vencimento há uns 3 meses, pagamento hoje */
  var hoje = new Date(), iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  if (!$pag.value) $pag.value = iso(hoje);
  if (!$venc.value) { var v = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 20); $venc.value = iso(v); }

  function lerValor(txt) {
    var t = String(txt).trim().replace(/[R$\s]/g, '');
    if (!t) return NaN;
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');          /* 1.250,00 */
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');               /* 1.250 */
    return Number(t);
  }
  function lerData(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; var p = s.split('-').map(Number); var d = new Date(p[0], p[1] - 1, p[2]); return d.getMonth() === p[1] - 1 ? d : null; }

  function calcular() {
    $erro.textContent = '';
    var valor = lerValor($valor.value), venc = lerData($venc.value), pag = lerData($pag.value);
    [$valor, $venc, $pag].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    var falha = function (el, msg) { el.setAttribute('aria-invalid', 'true'); $erro.textContent = msg; $saida.innerHTML = ''; };
    if (!(valor > 0)) return falha($valor, 'Informe o valor do tributo em reais, por exemplo 1.250,00.');
    if (valor > 1e12) return falha($valor, 'O valor parece alto demais. Confira os pontos e a vírgula.');
    if (!venc) return falha($venc, 'Informe a data de vencimento que consta na guia.');
    if (!pag) return falha($pag, 'Informe a data do pagamento.');
    if (venc.getFullYear() < 2010) return falha($venc, 'A calculadora cobre vencimentos a partir de 2010.');

    var dias = Math.round((pag - venc) / 86400000);
    if (dias <= 0) {
      $saida.innerHTML = '<p class="callout"><strong>Sem atraso.</strong> O pagamento está na data do vencimento ou antes dela, então não há multa nem juros de mora. Total: <strong>' + brl.format(valor) + '</strong>.</p>';
      return;
    }
    var multaPct = Math.min(20, 0.33 * dias);
    var multa = Math.round(valor * multaPct) / 100;

    /* Juros: meses do seguinte ao vencimento até o anterior ao pagamento + 1% no mês do pagamento */
    var mesmoMes = venc.getFullYear() === pag.getFullYear() && venc.getMonth() === pag.getMonth();
    var detalhes = [], jurosPct = 0, estimados = [];
    if (!mesmoMes) {
      var a = venc.getFullYear(), m = venc.getMonth() + 2; /* mês seguinte, 1 a 12 */
      if (m > 12) { m = 1; a++; }
      var fimA = pag.getFullYear(), fimM = pag.getMonth() + 1;
      while (a < fimA || (a === fimA && m < fimM)) {
        var k = chaveMes(a, m), taxa = SELIC ? SELIC[k] : undefined;
        if (taxa === undefined) { taxa = SELIC && ULTIMO ? SELIC[ULTIMO] : 0; estimados.push(rotulo(k)); }
        jurosPct += taxa; detalhes.push([rotulo(k), taxa, taxa === undefined]);
        m++; if (m > 12) { m = 1; a++; }
      }
      jurosPct += 1; detalhes.push([rotulo(chaveMes(fimA, fimM)) + ' (mês do pagamento)', 1]);
    }
    jurosPct = Math.round(jurosPct * 100) / 100;
    var juros = Math.round(valor * jurosPct) / 100;
    var total = Math.round((valor + multa + juros) * 100) / 100;

    var linhaJuros = mesmoMes ? 'Pagamento no mesmo mês do vencimento: sem juros' :
      'Selic de ' + detalhes[0][0] + (detalhes.length > 2 ? ' a ' + detalhes[detalhes.length - 2][0] : '') + ' + 1% do mês do pagamento';
    if (!mesmoMes && detalhes.length === 1) linhaJuros = 'Pagamento no mês seguinte ao vencimento: só o 1% do mês do pagamento';

    var html = '<table><caption class="fine" style="text-align:left;caption-side:top;margin-bottom:6px">Resultado para ' + dias + ' dia' + (dias > 1 ? 's' : '') + ' de atraso</caption>' +
      '<thead><tr><th scope="col">Parcela</th><th scope="col">Como foi calculada</th><th scope="col">Percentual</th><th scope="col">Valor</th></tr></thead><tbody>' +
      '<tr><td>Valor original</td><td>Informado</td><td></td><td>' + brl.format(valor) + '</td></tr>' +
      '<tr><td>Multa de mora</td><td>' + dias + ' × 0,33%' + (0.33 * dias > 20 ? ', limitada a 20%' : '') + '</td><td>' + pct(multaPct) + '</td><td>' + brl.format(multa) + '</td></tr>' +
      '<tr><td>Juros (Selic)</td><td>' + esc(linhaJuros) + '</td><td>' + pct(jurosPct) + '</td><td>' + brl.format(juros) + '</td></tr>' +
      '</tbody><tfoot><tr><th scope="row" colspan="3" style="text-align:left">Total estimado a pagar</th><th>' + brl.format(total) + '</th></tr></tfoot></table>';
    if (estimados.length && ULTIMO) {
      html += '<p class="alert" style="margin-top:12px"><strong>Parte estimada.</strong> A Selic de ' + esc(estimados.join(', ')) + ' ainda não foi fechada pelo Banco Central. Usei a do último mês disponível (' + esc(rotulo(ULTIMO)) + '). O valor final pode mudar um pouco.</p>';
    } else if (estimados.length) {
      html += '<p class="alert" style="margin-top:12px"><strong>Juros incompletos.</strong> Sem a Selic oficial, os juros acima contam só o 1% do mês do pagamento. Confira o valor no Sicalc da Receita.</p>';
    }
    if (detalhes.length > 1) {
      html += '<details class="deepDive" style="margin-top:12px"><summary>Ver a Selic mês a mês</summary><div class="deepContent"><table><thead><tr><th scope="col">Mês</th><th scope="col">Taxa</th></tr></thead><tbody>' +
        detalhes.map(function (d) { return '<tr><td>' + esc(d[0]) + '</td><td>' + pct(d[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    }
    $saida.innerHTML = html;
  }

  /* Conta um cálculo por visita, só quando a pessoa mexe nos campos e o resultado é válido (o exemplo inicial não conta) */
  var medido = false;
  function calcularPelaPessoa() {
    calcular();
    if (!medido && !$erro.textContent && $saida.innerHTML) { medido = true; if (window.prumoMedir) window.prumoMedir('calculo_acrescimos'); }
  }
  ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, calcularPelaPessoa); });
  form.addEventListener('submit', function (e) { e.preventDefault(); calcularPelaPessoa(); });

  fetch('/selic.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }).then(function (j) {
    SELIC = j.meses || {}; ULTIMO = j.ultimo_mes || Object.keys(SELIC).sort().pop();
    $fonte.textContent = 'Selic do Banco Central (série 4390) disponível até ' + rotulo(ULTIMO) + '.';
    calcular();
  }).catch(function () {
    $fonte.textContent = '';
    $erro.textContent = 'Não consegui carregar a Selic oficial agora. A multa está correta, mas os juros ficam sem cálculo. Use o Sicalc da Receita.';
    calcular();
  });
})();
