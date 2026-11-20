#!/usr/bin/env python3
"""Mede a qualidade da busca do assistente: hit@1 e hit@3 sobre tests/queries.json.
Uso: python3 scripts/eval_assistant.py   (sobe um servidor local e usa o Playwright)"""
import json, subprocess, sys, time, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
def main(verbose=True, port=8261, qfile='tests/queries.json'):
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2); qs = json.loads((ROOT/qfile).read_text(encoding='utf-8')); h1 = h3 = 0; misses = []
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); pg = b.new_page()
            pg.route('**/atlas-tributario-assistente.onrender.com/**', lambda r: r.abort())
            pg.goto(f'http://localhost:{port}/assistente.html'); pg.wait_for_timeout(800)
            for t in qs:
                pg.fill('#searchInput', t['q']); pg.press('#searchInput', 'Enter'); pg.wait_for_timeout(350)
                urls = pg.evaluate("[...document.querySelectorAll('.searchHit h3 a')].map(a=>a.getAttribute('href').split('#')[0])")
                ok = set(t['ok'])
                if urls and urls[0] in ok: h1 += 1
                if any(u in ok for u in urls[:3]): h3 += 1
                else: misses.append((t['q'], urls[:3]))
    finally: srv.terminate()
    n = len(qs)
    if verbose:
        print(f'hit@1 = {h1}/{n} ({100*h1//n}%) | hit@3 = {h3}/{n} ({100*h3//n}%)')
        for q, u in misses: print('  ERROU:', q, '->', u)
    return h1, h3, n, misses
if __name__ == '__main__':
    qf = sys.argv[1] if len(sys.argv) > 1 else 'tests/queries.json'
    h1, h3, n, m = main(qfile=qf); sys.exit(0 if h3/n >= 0.85 else 1)
