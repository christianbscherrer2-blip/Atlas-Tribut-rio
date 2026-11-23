/* Prumo · organizador de CDAs. Guarda a carteira só neste navegador (localStorage), sem enviar nada.
   Exporta para planilha (CSV com ponto e vírgula, que o Excel em português abre direto) e imprime. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var form = $('cdaForm'); if (!form) return;
  var CHAVE = 'prumo-cdas';
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SITUACOES = { inscrita: 'Inscrita, sem ação', ajuizada: 'Em execução fiscal', garantida: 'Garantida (penhora, depósito, seguro ou fiança)', negociada: 'Parcelada ou em transação', suspensa: 'Suspensa por decisão', extinta: 'Paga ou extinta' };
  var CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;
  function lerValor(t) { t = String(t || '').replace(/[R$\s]/g, ''); if (!t) return NaN; if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); return Number(t); }
  function carregar() { try { var a = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function salvar(lista) { try { localStorage.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; } }
  var lista = carregar(), editando = null;
  var sel = $('cdaSituacao'); sel.innerHTML = Object.keys(SITUACOES).map(function (k) { return '<option value="' + k + '">' + SITUACOES[k] + '</option>'; }).join('');
  var dataBR = function (iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : ''; };

  function desenhar() {
    var tbody = $('cdaLinhas'), vazio = $('cdaVazio'), resumo = $('cdaResumo');
    vazio.hidden = lista.length > 0; $('cdaTabelaWrap').hidden = !lista.length; $('cdaAcoes').hidden = !lista.length;
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    tbody.innerHTML = lista.map(function (c, i) {
      var prazo = c.prazo ? new Date(c.prazo + 'T00:00:00') : null, dias = prazo ? Math.round((prazo - hoje) / 864e5) : null;
      var aviso = dias === null ? '' : dias < 0 ? ' <span class="selo seloRegula">vencido</span>' : dias <= 7 ? ' <span class="selo seloRegula">em ' + dias + ' dia(s)</span>' : '';
      return '<tr><td>' + esc(c.numero) + (c.tributo ? '<br><small>' + esc(c.tributo) + '</small>' : '') + '</td><td>' + brl.format(c.valor || 0) + '</td><td>' + esc(SITUACOES[c.situacao] || c.situacao) + '</td><td>' + esc(c.processo || '—') + '</td><td>' + (dataBR(c.prazo) || '—') + aviso + (c.prazoDesc ? '<br><small>' + esc(c.prazoDesc) + '</small>' : '') + '</td>' +
        '<td class="cdaBotoes"><button type="button" class="linkbtn" data-editar="' + i + '" aria-label="Editar a CDA ' + esc(c.numero) + '">Editar</button><button type="button" class="linkbtn" data-remover="' + i + '" aria-label="Remover a CDA ' + esc(c.numero) + '">Remover</button></td></tr>';
    }).join('');
    var porSit = {}, total = 0, ativo = 0;
    lista.forEach(function (c) { porSit[c.situacao] = (porSit[c.situacao] || 0) + (c.valor || 0); total += c.valor || 0; if (c.situacao !== 'extinta') ativo += c.valor || 0; });
    resumo.innerHTML = lista.length ? '<div class="painelResumo"><div class="painelNumero"><b>' + lista.length + '</b><span>CDA(s) na carteira</span></div><div class="painelNumero"><b>' + brl.format(ativo) + '</b><span>em aberto (sem as extintas)</span></div></div>' +
      '<p class="fine">' + Object.keys(SITUACOES).filter(function (k) { return porSit[k]; }).map(function (k) { return esc(SITUACOES[k]) + ': ' + brl.format(porSit[k]); }).join(' · ') + '</p>' : '';
  }
  function limparForm() { form.reset(); editando = null; $('cdaSalvar').textContent = 'Adicionar CDA'; $('cdaCancelar').hidden = true; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var erro = $('cdaErro'); erro.textContent = '';
    var c = { numero: $('cdaNumero').value.trim(), tributo: $('cdaTributo').value.trim(), valor: lerValor($('cdaValor').value), situacao: sel.value, processo: $('cdaProcesso').value.trim(), prazo: $('cdaPrazo').value, prazoDesc: $('cdaPrazoDesc').value.trim(), obs: $('cdaObs').value.trim() };
    if (!c.numero) { erro.textContent = 'Informe o número da CDA ou da inscrição.'; $('cdaNumero').focus(); return; }
    if (!(c.valor >= 0)) { erro.textContent = 'Informe o valor consolidado, por exemplo 15.000,00.'; $('cdaValor').focus(); return; }
    if ([c.tributo, c.processo, c.prazoDesc, c.obs].some(function (t) { return CPF.test(t) || CNPJ.test(t); })) { erro.textContent = 'Por segurança, não guarde CPF ou CNPJ aqui. Use só o número da CDA e do processo.'; return; }
    if (editando !== null) lista[editando] = c; else lista.push(c);
    if (!salvar(lista)) erro.textContent = 'O navegador não permitiu guardar. Exporte a planilha para não perder os dados.';
    limparForm(); desenhar(); $('cdaStatus').textContent = 'CDA salva neste navegador.';
    if (window.prumoMedir) window.prumoMedir('cda_organizada');
  });
  $('cdaCancelar').addEventListener('click', limparForm);
  $('cdaLinhas').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.remover) {
      var i = +b.dataset.remover;
      if (!confirm('Remover a CDA ' + lista[i].numero + ' da carteira deste navegador?')) return;
      lista.splice(i, 1); salvar(lista); desenhar(); $('cdaStatus').textContent = 'CDA removida.';
    } else if (b.dataset.editar) {
      var c = lista[editando = +b.dataset.editar];
      $('cdaNumero').value = c.numero; $('cdaTributo').value = c.tributo || ''; $('cdaValor').value = (c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      sel.value = c.situacao; $('cdaProcesso').value = c.processo || ''; $('cdaPrazo').value = c.prazo || ''; $('cdaPrazoDesc').value = c.prazoDesc || ''; $('cdaObs').value = c.obs || '';
      $('cdaSalvar').textContent = 'Salvar alterações'; $('cdaCancelar').hidden = false; $('cdaNumero').focus();
    }
  });
  $('cdaExportar').addEventListener('click', function () {
    var q = function (t) { return '"' + String(t == null ? '' : t).replace(/"/g, '""') + '"'; };
    var linhas = [['CDA ou inscrição', 'Tributo', 'Valor consolidado', 'Situação', 'Processo', 'Próximo prazo', 'O que vence', 'Observações']].concat(lista.map(function (c) {
      return [c.numero, c.tributo, (c.valor || 0).toFixed(2).replace('.', ','), SITUACOES[c.situacao] || c.situacao, c.processo, dataBR(c.prazo), c.prazoDesc, c.obs];
    }));
    var csv = '﻿' + linhas.map(function (l) { return l.map(q).join(';'); }).join('\r\n');
    var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'carteira-cdas-prumo.csv';
    d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  $('cdaImprimir').addEventListener('click', function () { d.body.classList.add('imprimindoCdas'); window.print(); setTimeout(function () { d.body.classList.remove('imprimindoCdas'); }, 500); });
  $('cdaApagar').addEventListener('click', function () {
    if (!confirm('Apagar toda a carteira deste navegador? Exporte a planilha antes, se quiser guardar.')) return;
    lista = []; salvar(lista); desenhar(); $('cdaStatus').textContent = 'Carteira apagada deste navegador.';
  });
  desenhar();
})();
