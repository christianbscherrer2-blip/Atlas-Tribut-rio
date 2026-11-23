#!/usr/bin/env python3
"""Verificações estáticas do site (sem navegador). Sai com código 1 se houver ERRO.
Uso: python3 scripts/site_check.py"""
import re, glob, json, os, subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent; os.chdir(ROOT)
O = 'https://prumo.onrender.com'
files = sorted(f.replace(os.sep, '/') for f in glob.glob('*.html') + glob.glob('artigos/*.html') if not f.startswith('google'))
sm = open('sitemap.xml', encoding='utf-8').read(); locs = re.findall(r'<loc>([^<]*)</loc>', sm)
err, warn = [], []
for f in files:
    h = open(f, encoding='utf-8').read(); noindex = 'noindex' in h
    t = re.search(r'<title>(.*?)</title>', h, re.S); d = re.search(r'name="description" content="([^"]*)"', h)
    if not t: err.append(f'{f}: sem <title>'); continue
    if len(t.group(1).strip()) > 60: warn.append(f'{f}: título com {len(t.group(1).strip())} caracteres (>60)')
    if not noindex:
        if not d: err.append(f'{f}: sem meta description')
        elif not 70 <= len(d.group(1)) <= 160: warn.append(f'{f}: descrição com {len(d.group(1))} caracteres (ideal 70-160)')
        c = re.search(r'rel="canonical" href="([^"]*)"', h)
        if not c: err.append(f'{f}: sem canonical')
        elif c.group(1) not in locs: err.append(f'{f}: canonical {c.group(1)} fora do sitemap')
    if not f.startswith('guia') and h.count('<h1') != 1: err.append(f'{f}: {h.count("<h1")} elementos <h1> (deve ser 1)')
    for j in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: json.loads(j)
        except Exception: err.append(f'{f}: JSON-LD inválido')
    ids = re.findall(r' id="([^"]+)"', h); dup = {i for i in ids if ids.count(i) > 1}
    if dup: err.append(f'{f}: ids duplicados {sorted(dup)}')
    for m in set(re.findall(r'href="(/[^"#?]*)', h)):
        if m != '/' and not os.path.exists(m.lstrip('/')): err.append(f'{f}: link quebrado {m}')
    for p, a in re.findall(r'href="(/[^"?#]*)#([^"]+)"', h):
        pp = 'index.html' if p == '/' else p.lstrip('/')
        if pp.endswith('.html') and os.path.exists(pp) and f' id="{a}"' not in open(pp, encoding='utf-8').read(): err.append(f'{f}: âncora ausente {p}#{a}')
    if 'href="/index.html' in h and not f.startswith('guia'): err.append(f'{f}: link para /index.html (use "/")')
indexable = [f for f in files if 'noindex' not in open(f, encoding='utf-8').read()]
for f in indexable:
    u = O + '/' + ('' if f == 'index.html' else f)
    if u not in locs: err.append(f'sitemap sem {u}')
for u, lm in re.findall(r'<loc>([^<]*)</loc><lastmod>([^<]*)</lastmod>', sm):
    p = u.replace(O, '').lstrip('/') or 'index.html'
    d = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', p], capture_output=True, text=True).stdout.strip()
    if d and d != lm: warn.append(f'sitemap: lastmod de {p} é {lm}, git diz {d} (rode scripts/update_sitemap.py)')
for w in warn: print('AVISO:', w)
for e in err: print('ERRO: ', e)
print(f'{len(files)} páginas | {len(err)} erro(s) | {len(warn)} aviso(s)'); sys.exit(1 if err else 0)
