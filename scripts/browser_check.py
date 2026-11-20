#!/usr/bin/env python3
"""Verificações no navegador: erros de JS, rolagem lateral no celular, alvos de toque, axe-core e busca do assistente.
Requer: pip install playwright && playwright install chromium; npm i axe-core (opcional: AXE_PATH)."""
import glob, os, subprocess, sys, time, pathlib, json
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; os.chdir(ROOT)
AXE = os.environ.get('AXE_PATH', '/tmp/axe/node_modules/axe-core/axe.min.js')
files = sorted(f for f in glob.glob('*.html') + glob.glob('artigos/*.html') if not f.startswith('google'))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8271'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
err = []
TAP = """()=>{const bad=[];document.querySelectorAll('button,input,select,summary,a').forEach(e=>{const b=e.getBoundingClientRect();if(!b.width||!b.height||getComputedStyle(e).visibility==='hidden')return;
 if(e.tagName==='A'&&e.closest('p,li,td,small,.fine,.toolNote,.alert,.callout'))return; if(e.closest('.skip'))return;
 if(Math.min(b.width,b.height)<24)bad.push((e.textContent||e.tagName).trim().slice(0,24)+':'+Math.round(Math.min(b.width,b.height)))});return bad.slice(0,3)}"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for vw in (390, 1200):
            pg = b.new_page(viewport={'width': vw, 'height': 800}); js = []
            pg.on('pageerror', lambda e: js.append(str(e)[:80]))
            for f in files:
                js.clear(); pg.goto(f'http://localhost:8271/{f}'); pg.wait_for_timeout(250)
                if js: err.append(f'{f} ({vw}px): erro de JS {js[0]}')
                if pg.evaluate('document.documentElement.scrollWidth') > vw + 2: err.append(f'{f} ({vw}px): rolagem lateral')
                if vw == 390 and f in ('index.html', 'escala-6x1.html', 'mudancas.html', 'execucao-fiscal.html', 'assistente.html'):
                    bad = pg.evaluate(TAP)
                    if bad: err.append(f'{f}: alvos de toque < 24px {bad}')
        pg = b.new_page(viewport={'width': 1200, 'height': 900}); n = 0
        if os.path.exists(AXE):
            for f in ('index.html', 'escala-6x1.html', 'mudancas.html', 'assistente.html', 'execucao-fiscal.html', 'areas.html'):
                pg.goto(f'http://localhost:8271/{f}'); pg.wait_for_timeout(500)
                pg.add_style_tag(content='*,*::before,*::after{transition:none!important;animation:none!important}.js .pop,.w>i{opacity:1!important;transform:none!important}')
                pg.evaluate("document.querySelectorAll('.pop,h2.asc').forEach(e=>e.classList.add('in'))"); pg.wait_for_timeout(200)
                pg.add_script_tag(path=AXE)
                for v in pg.evaluate("axe.run({runOnly:['wcag2a','wcag2aa','best-practice']}).then(r=>r.violations.map(v=>v.id+' x'+v.nodes.length))"): err.append(f'{f}: axe {v}')
                n += 1
        else: print('AVISO: axe-core não encontrado; pulando acessibilidade')
finally: srv.terminate()
sys.path.insert(0, str(ROOT/'scripts')); import eval_assistant
h1, h3, total, _ = eval_assistant.main(verbose=False, port=8272)
if h3 / total < 0.85: err.append(f'busca do assistente: hit@3 = {h3}/{total} (< 85%)')
print(f'assistente hit@1 {h1}/{total} · hit@3 {h3}/{total}')
for e in err: print('ERRO:', e)
print(f'{len(files)} páginas, {n} com axe | {len(err)} erro(s)'); sys.exit(1 if err else 0)
