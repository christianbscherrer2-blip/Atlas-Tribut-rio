#!/usr/bin/env python3
"""Troca o domínio do site inteiro (canonical, og:url, sitemap, robots, JSON-LD).
Uso: python3 scripts/set_domain.py https://www.seudominio.com.br
Depois: no Render, adicione o domínio ao serviço do site e, no serviço do assistente,
defina a variável SITE_ORIGINS com o novo endereço (separe vários por vírgula).
"""
import sys, glob
OLD = 'https://atlas-tributario.onrender.com'
if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
    sys.exit(__doc__)
new = sys.argv[1].rstrip('/')
n = 0
for f in glob.glob('**/*', recursive=True):
    if f.endswith(('.html', '.xml', '.txt', '.json', '.js', '.md')) and 'node_modules' not in f:
        try: s = open(f, encoding='utf-8').read()
        except Exception: continue
        if OLD in s and f != 'assistant-server.js':
            open(f, 'w', encoding='utf-8', newline='').write(s.replace(OLD, new)); n += 1
print(f'{n} arquivos atualizados para {new}')
