# Atlas Tributário & Previdenciário

Site estático (Render, `atlas-tributario`) + backend opcional do assistente (Render, `atlas-tributario-assistente`).

## Rotinas
- Depois de editar qualquer página de conteúdo: `python3 scripts/build_index.py` (atualiza `assistente-index.json`, usado pela busca do assistente).
- Trocar de domínio: `python3 scripts/set_domain.py https://www.seudominio.com.br`; no serviço do assistente, defina `SITE_ORIGINS` com o novo endereço.
- Radar de notícias: `scripts/update_news.py` (rodado pelo GitHub Actions).

## Assistente (3 camadas)
1. Triagem por situação e 2. busca local: rodam no navegador; nada é enviado.
3. IA opcional: só aparece se `GET /health` do backend retornar `enabled: true` (exige `OPENAI_API_KEY` no Render). A pergunta é enviada ao provedor; o usuário precisa marcar ciência. CPF/CNPJ são bloqueados no navegador e no servidor.

## Variáveis do backend
`OPENAI_API_KEY`, `OPENAI_MODEL` (opcional), `SITE_ORIGINS` (opcional, lista separada por vírgula).
