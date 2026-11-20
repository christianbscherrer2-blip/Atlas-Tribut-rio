#!/usr/bin/env python3
"""Atualiza o <lastmod> do sitemap.xml com a data real da última alteração de cada página (git)."""
import re, subprocess, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
O = 'https://atlas-tributario.onrender.com'
sm = (ROOT/'sitemap.xml').read_text(encoding='utf-8')
def last(path):
    r = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return r or None
def fix(m):
    url = m.group(1); p = url.replace(O, '').lstrip('/') or 'index.html'
    d = last(p) if (ROOT/p).exists() else None
    return f'<url><loc>{url}</loc><lastmod>{d or m.group(2)}</lastmod></url>'
new = re.sub(r'<url><loc>([^<]*)</loc><lastmod>([^<]*)</lastmod></url>', fix, sm)
if new != sm: (ROOT/'sitemap.xml').write_text(new, encoding='utf-8'); print('sitemap atualizado')
else: print('sitemap já estava correto')
