# Prumo (repositório do site)

Site estático (Render, serviço `atlas-tributario`) + backend opcional do assistente (serviço `atlas-tributario-assistente`).

## Fundamentos
Cada decisão de interface tem a evidência e a verificação registradas em `docs/fundamentos-de-design.md` (psicologia cognitiva, percepção, Gestalt, WCAG, avaliação heurística, métricas e roteiro de teste com usuários). Mudanças novas devem citar o princípio que as justifica ou dizer que são escolha de marca.

## Conteúdo de apoio
- `scripts/resumos.json`: texto do bloco "Em 30 segundos" das páginas longas (aplicado pelo `build_pages.py`).
- Glossário (26 termos): lista `GLOSSARIO` em `site.js`; a primeira ocorrência de cada termo no texto vira um botão com a explicação.
- Busca em toda página: botão "Buscar" do cabeçalho e atalho "/", que levam à busca do assistente (`/assistente.html?q=...#busca`).

## Sistema de design
- **Identidade do Prumo (preservar):** fundo papel, azul-marinho e dourado, títulos em Georgia, faixas pretas nos sobretítulos, barra dourada sob os títulos de seção, contorno escuro com sombra dourada deslocada em cartões e botões, etiquetas douradas inclinadas e a máquina de escrever da página inicial. Melhorias devem evoluir o que existe, não trocar essa identidade (seção 13 de `site.css`).
- `site.css` é uma camada única organizada por tokens (cores com função, tipografia, espaçamento de 4 px, raios). Para mudar a aparência, mude os tokens no topo do arquivo; os componentes só usam variáveis.
- Tema claro e escuro: segue o aparelho até a pessoa escolher no botão do cabeçalho; a escolha fica só no navegador dela.
- Contraste mínimo 4,5:1 (WCAG AA) nos dois temas; alvos de toque de pelo menos 24 px (44 px nos botões).
- Movimento mínimo: nada fica escondido esperando rolagem; tudo respeita "reduzir movimento".

## Layout comum (menu e rodapé em um lugar só)
O menu e o rodapé ficam em `scripts/templates/header.html` e `footer.html`. Depois de editar um modelo ou criar uma página, rode `python3 scripts/build_pages.py`. Ele aplica o modelo às páginas, marca o item de menu da página atual, coloca o script de tema, grava a data de revisão (do selo "Última atualização") no JSON-LD e põe a impressão digital no endereço de `site.css`/`site.js`, para o navegador baixar a versão nova. O site continua estático.

## Antes de publicar (rotina)
1. Edite as páginas. A página inicial deve ser linkada como `/` (nunca `/index.html`). Atualize a data do selo "Última atualização" quando revisar o conteúdo.
2. `python3 scripts/build_pages.py`: aplica o layout comum.
3. `python3 scripts/build_index.py`: atualiza o índice de busca do assistente.
4. `python3 scripts/update_sitemap.py`: corrige as datas do sitemap a partir do git.
5. `python3 scripts/site_check.py`: links, âncoras, JSON-LD, títulos, canonical, sitemap (estático).
6. `python3 scripts/browser_check.py`: erros de JS, rolagem lateral, alvos de toque, acessibilidade (axe) e qualidade da busca. Requer `pip install playwright && playwright install chromium` e `npm i axe-core` (veja `AXE_PATH`).

A verificação automática (`.github/workflows/site-check.yml`) roda os passos 2 (em modo `--check`), 5 e 6 a cada envio ao GitHub.

## Qualidade da busca do assistente
`python3 scripts/eval_assistant.py` mede acerto na 1ª posição (hit@1) e entre as 3 primeiras (hit@3) com `tests/queries.json` (ajuste) e `tests/queries_validacao.json` (validação, não use para ajustar). Meta: hit@3 ≥ 85%. Ao mudar a busca, meça antes e depois.

## Ferramentas
- `acrescimos.html` + `acrescimos.js`: calculadora de multa de mora e juros Selic de tributo federal pago em atraso (Lei 9.430/1996, art. 61). Usa `selic.json`.
- `selic.json`: Selic acumulada por mês (Banco Central, série SGS 4390), só meses encerrados. Atualizado por `scripts/update_selic.py` no mesmo robô do radar; reserva em `/api/selic` do servidor do assistente.
- `documentos.html`: "Que documento é este?", com os documentos fiscais mais comuns, como reconhecer, o que significam, primeiro passo e prazo legal.
- Triagem do assistente: termina num plano de ação numerado, com copiar e imprimir.
- `agenda.html`: obrigações recorrentes por regime, com regra de prazo e base legal; links para a Agenda Tributária oficial do mês corrente e do seguinte (gerados em `site.js`).
- Perfil do regime: seletor em regimes, Reforma, débitos e agenda; guarda a escolha em `localStorage` (`prumo-regime`), destaca o cartão do regime, pré-seleciona os painéis e filtra a agenda. Itens marcados com `data-regime="mei simples presumido real"`.
- `jornada.js`: calculadora do custo da jornada (página do 6x1). Roda no navegador.
- `mudancas.js`: filtros de "O que mudou"; guarda a escolha em localStorage.

## Assistente (3 camadas)
1. Triagem por situação e 2. busca local: rodam no navegador; nada é enviado.
3. IA opcional: só aparece se `GET /health` do backend retornar `enabled: true` (exige `OPENAI_API_KEY`). CPF/CNPJ são bloqueados no navegador e no servidor.

## Variáveis do backend
`OPENAI_API_KEY`, `OPENAI_MODEL` (opcional), `OPENAI_MAX_DIARIO` (opcional, teto diário total de perguntas à IA; padrão 200), `SITE_ORIGINS` (opcional, lista separada por vírgula).

## Domínio
`python3 scripts/set_domain.py https://www.seudominio.com.br`; no serviço do assistente, defina `SITE_ORIGINS`.
