#!/usr/bin/env python3
"""Gera assistente-index.json: trechos pesquisáveis de todas as páginas de conteúdo do Atlas.
Rode depois de editar qualquer página:  python3 scripts/build_index.py
"""
import glob, json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'googleb49ad066d7bdc0dd.html', 'index.html', 'assistente.html', 'noticias.html', 'guia-tributos-previdencia.html', '404.html', 'sobre.html'}
MAXLEN = 900

def clean(t): return re.sub(r'\s+', ' ', t).strip()

def page_chunks(path):
    soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
    main = soup.find('main')
    if not main: return []
    for t in main.select('script,style,.ctaBlock,.nextPill,.readBar,.reviewStamp,nav,.newsList,.newsStatus'): t.decompose()
    page = clean((soup.find('h1') or soup.title).get_text())
    url = '/' + path.relative_to(ROOT).as_posix()
    out, cur = [], None
    def flush():
        nonlocal cur
        if cur and len(cur['text']) > 60:
            out.append(cur)
        cur = None
    def start(title, anchor):
        nonlocal cur
        flush(); cur = {'page': page, 'url': url + (('#' + anchor) if anchor else ''), 'title': title, 'text': ''}
    anchor = ''
    for el in main.descendants:
        if getattr(el, 'name', None) is None: continue
        if el.name in ('section', 'span', 'div') and el.get('id'): anchor = el['id']
        if el.name in ('h2', 'h3') :
            title = clean(el.get_text())
            if title: start(title, anchor)
        elif el.name in ('p', 'li', 'td', 'summary', 'strong') and el.name != 'strong':
            txt = clean(el.get_text())
            if not txt or cur is None: continue
            if txt in cur['text']: continue
            if len(cur['text']) + len(txt) > MAXLEN:
                t0 = cur['title']; flush(); start(t0, anchor)
            cur['text'] = (cur['text'] + ' ' + txt).strip()
    flush()
    return out

def main():
    chunks = []
    for p in sorted(list(ROOT.glob('*.html')) + list(ROOT.glob('artigos/*.html'))):
        if p.name in SKIP: continue
        chunks += page_chunks(p)
    for i, c in enumerate(chunks): c['id'] = i
    (ROOT / 'assistente-index.json').write_text(json.dumps({'built': '2026-10-27', 'chunks': chunks}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    pages = sorted({c['url'].split('#')[0] for c in chunks})
    print(f'{len(chunks)} trechos de {len(pages)} páginas; {(ROOT/"assistente-index.json").stat().st_size/1024:.0f} KB')

if __name__ == '__main__': main()
