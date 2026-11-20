/* Filtro por tema em "O que mudou". Guarda a escolha só neste navegador (localStorage). */
(function () {
  'use strict';
  var bar = document.querySelector('.filterBar'); if (!bar) return;
  var cards = [].slice.call(document.querySelectorAll('.feed .card')), st = document.getElementById('fStatus'), KEY = 'prumo-filtro';
  function apply(f, save) {
    var shown = 0;
    cards.forEach(function (c) { var ok = f === 'todos' || (c.getAttribute('data-areas') || '').split(' ').indexOf(f) > -1; c.hidden = !ok; if (ok) shown++; });
    [].forEach.call(bar.querySelectorAll('.chip'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === f)); });
    st.textContent = f === 'todos' ? '' : 'Mostrando ' + shown + ' de ' + cards.length + ' mudanças.';
    if (save) { try { localStorage.setItem(KEY, f); } catch (e) {} }
  }
  bar.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) apply(b.getAttribute('data-f'), true); });
  var saved = 'todos'; try { saved = localStorage.getItem(KEY) || 'todos'; } catch (e) {}
  if (saved !== 'todos' && bar.querySelector('[data-f="' + saved + '"]')) apply(saved, false);
})();
