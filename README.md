# Prumo (repositório do site)

Site estático (Render, serviço `atlas-tributario`) + backend opcional do assistente (serviço `atlas-tributario-assistente`).

## Antes de publicar (rotina)
1. Edite as páginas. A página inicial deve ser linkada como `/` (nunca `/index.html`).
2. `python3 scripts/build_index.py`: atualiza o índice de busca do assistente.
3. `python3 scripts/update_sitemap.py`: corrige as datas do sitemap a partir do git.
4. `python3 scripts/site_check.py`: links, âncoras, JSON-LD, títulos, canonical, sitemap (estático).
5. `python3 scripts/browser_check.py`: erros de JS, rolagem lateral, alvos de toque, acessibilidade (axe) e qualidade da busca. Requer `pip install playwright && playwright install chromium` e `npm i axe-core` (veja `AXE_PATH`).
6. Para ativar a verificação automática no GitHub, copie `scripts/site-check.workflow.yml` para `.github/workflows/`.

## Qualidade da busca do assistente
`python3 scripts/eval_assistant.py` mede acerto na 1ª posição (hit@1) e entre as 3 primeiras (hit@3) com `tests/queries.json` (ajuste) e `tests/queries_validacao.json` (validação, não use para ajustar). Meta: hit@3 ≥ 85%. Ao mudar a busca, meça antes e depois.

## Ferramentas
- `jornada.js`: calculadora do custo da jornada (página do 6x1). Roda no navegador.
- `mudancas.js`: filtros de "O que mudou"; guarda a escolha em localStorage.

## Assistente (3 camadas)
1. Triagem por situação e 2. busca local: rodam no navegador; nada é enviado.
3. IA opcional: só aparece se `GET /health` do backend retornar `enabled: true` (exige `OPENAI_API_KEY`). CPF/CNPJ são bloqueados no navegador e no servidor.

## Variáveis do backend
`OPENAI_API_KEY`, `OPENAI_MODEL` (opcional), `SITE_ORIGINS` (opcional, lista separada por vírgula).

## Domínio
`python3 scripts/set_domain.py https://www.seudominio.com.br`; no serviço do assistente, defina `SITE_ORIGINS`.
