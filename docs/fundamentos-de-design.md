# Fundamentos de design do Prumo

Este documento registra **por que** cada escolha de interface do Prumo foi feita, qual evidência a sustenta e como ela é verificada. Ele vale para qualquer mudança futura: uma alteração visual ou de organização deve citar o princípio que a justifica, ou dizer com clareza que é uma escolha de marca.

Regras de leitura deste documento:

- **Evidência forte:** resultado replicado ou norma técnica consolidada (por exemplo, WCAG).
- **Evidência moderada:** estudos consistentes, mas com limites de contexto.
- **Escolha de marca:** decisão de identidade, sem pretensão científica. Só é mantida se a verificação mostrar que não prejudica a leitura ou o uso.

Identidade preservada (regra do projeto): fundo papel, azul-marinho e dourado, títulos em Georgia, faixas pretas nos sobretítulos, barra dourada sob os títulos de seção, contorno escuro com sombra dourada deslocada, etiquetas douradas inclinadas e a máquina de escrever da página inicial.

---

## 1. Carga cognitiva e organização do conteúdo

| Decisão no Prumo | Princípio | Evidência |
|---|---|---|
| Bloco **"Em 30 segundos"** no topo das páginas longas (texto em `scripts/resumos.json`) | Antecipar os conceitos-chave reduz a carga durante a leitura do detalhe (princípio do pré-treino) e funciona como organizador prévio | Mayer, Mathias e Wetzell (2002), *Journal of Experimental Psychology: Applied*; Ausubel (1960), organizadores prévios. Moderada |
| Índice **"Nesta página"** e seções recolhíveis | Sinalizar a estrutura e revelar o detalhe aos poucos | Mayer (2009), princípios de sinalização e segmentação; Nielsen (2006), *progressive disclosure*. Moderada |
| **Glossário no próprio texto** (toque ou passe o mouse no termo sublinhado) | Evitar que o leitor divida a atenção entre o texto e uma página de definições | Chandler e Sweller (1991), efeito da atenção dividida, *Cognition and Instruction*. Moderada |
| Parágrafos curtos, conclusão no começo, listas para passos | A memória de trabalho guarda poucos blocos (cerca de quatro) | Cowan (2001), *Behavioral and Brain Sciences*; Sweller (1988), teoria da carga cognitiva. Forte |
| Títulos que respondem perguntas ("Como uma cobrança chega ao juiz") | Leitura em varredura: o começo dos títulos e parágrafos recebe mais fixações | Nielsen (2006) e Pernice (2017), Nielsen Norman Group, rastreamento ocular. Moderada |
| Linguagem simples | Texto fácil de processar é compreendido mais rápido e percebido como mais confiável | ISO 24495-1:2023 (linguagem simples); Reber, Schwarz e Winkielman (2004), fluência de processamento. Forte |

## 2. Navegação e arquitetura da informação

| Decisão | Princípio | Evidência |
|---|---|---|
| Menu em **quatro grupos por tarefa** (Resolver, Decidir, Aprender, Consultar) | Agrupar reduz o custo de escolher entre muitas opções | Hick (1952) e Hyman (1953); Miller (1956), agrupamento. Forte para a lei; moderada para menus |
| Cabeçalho, rodapé e componentes **idênticos em todas as páginas** (gerados de `scripts/templates`) | Consistência permite aprender o padrão uma vez e reaproveitar | Nielsen (1994), heurística 4; Norman (1988). Forte |
| Indicação de **onde estou**: item atual no menu, trilha (breadcrumbs), seção ativa no índice | Visibilidade do estado do sistema | Nielsen (1994), heurística 1. Forte |
| **Busca em toda página** e atalho de teclado "/" | Reconhecer é mais fácil que lembrar; atalhos atendem usuários frequentes sem atrapalhar iniciantes | Nielsen (1994), heurísticas 6 e 7. Forte |
| Triagem do assistente parte do **documento que a pessoa tem na mão** | Reconhecimento em vez de evocação | Anderson, memória de reconhecimento versus evocação; Nielsen (1994), heurística 6. Forte |

## 3. Percepção visual e Gestalt

| Decisão | Princípio | Evidência |
|---|---|---|
| Espaçamento em escala fixa de 4 px | Proximidade: o que está perto é lido como grupo | Wertheimer (1923). Forte |
| Cartões delimitados por contorno | Região comum: elementos dentro de uma mesma borda são agrupados mais fortemente que por proximidade | Palmer (1992), *Cognitive Psychology*. Forte |
| Mesmo componente, mesma aparência e mesma função | Semelhança | Wertheimer (1923). Forte |
| **Dourado reservado para ação e destaque** (botão principal, sobretítulo, item ativo) | Um atributo único salta à vista sem busca serial; um item isolado é mais lembrado | Treisman e Gelade (1980), integração de características; von Restorff (1933). Forte |
| Sombra dourada deslocada e etiquetas inclinadas | **Escolha de marca.** A sombra também reforça a região comum e indica que o cartão é clicável | Verificado: não reduz contraste; a inclinação de 1,5° não afeta a leitura de rótulos curtos |

## 4. Cor, contraste e conforto visual

| Decisão | Princípio | Evidência |
|---|---|---|
| **Tema claro como padrão** (texto escuro em fundo claro) | Polaridade positiva melhora a leitura e a detecção de detalhes | Piepenbrock, Mayr, Mund e Buchner (2013), *Ergonomics*. Forte |
| Tema escuro opcional, seguindo o aparelho | Preferência individual e ambientes com pouca luz; mesma hierarquia | Escolha de conforto. Contraste verificado |
| Contraste mínimo de **4,5:1** em todo texto e **3:1** em indicadores (foco) | Legibilidade para baixa visão | WCAG 2.2, critérios 1.4.3 e 1.4.11. Norma |
| Estado nunca indicado só por cor | Daltonismo afeta cerca de 8% dos homens | WCAG 2.2, 1.4.1; Birch (2012). Forte |
| Fundo papel em vez de branco puro | **Escolha de marca.** Reduz o brilho total da página | Contraste verificado (texto 16,4:1) |

## 5. Tipografia

| Decisão | Princípio | Evidência |
|---|---|---|
| Texto em 17 px | Fontes maiores melhoram a leitura e a compreensão na tela | Rello, Pielot e Marcos (2016), *CHI*. Moderada |
| Entrelinha de 1,65 e linhas de até cerca de 70 caracteres | Conforto de leitura | Dyson e Haselgrove (2001): linhas longas leem mais rápido, mas leitores preferem e compreendem bem linhas médias. Evidência mista; adotado o meio-termo |
| Georgia nos títulos e fonte do sistema no texto | Contraste de famílias marca a hierarquia; fonte do sistema não precisa ser baixada, então a página aparece mais rápido | Hierarquia: Gestalt de semelhança. Desempenho: medido |

## 6. Interação, movimento e prevenção de erros

| Decisão | Princípio | Evidência |
|---|---|---|
| Nada fica escondido esperando a rolagem | Quem varre a página precisa ver o conteúdo de imediato | Nielsen (2006), leitura em varredura. Moderada |
| Máquina de escrever digita cada frase uma vez e **para** | Movimento contínuo na periferia captura a atenção de forma involuntária | Abrams e Christ (2003), *Psychological Science*. Forte |
| Tudo respeita "reduzir movimento" do aparelho | Movimento pode causar desconforto vestibular | WCAG 2.2, 2.3.3. Norma |
| Alvos de toque de pelo menos 24 px; botões com 44 px | O tempo para acertar depende do tamanho e da distância do alvo | Fitts (1954); WCAG 2.2, 2.5.8. Forte |
| Bloqueio de CPF e CNPJ na busca e na IA; calculadoras mostram as premissas | Prevenir o erro em vez de só avisar depois | Nielsen (1994), heurística 5; Norman (1988). Forte |

## 6b. Ferramentas (Fase 3)

| Decisão | Princípio | Evidência |
|---|---|---|
| **"Que documento é este?"** parte de quem enviou o documento e mostra os mesmos quatro rótulos em todo cartão (como reconhecer, o que significa, primeiro passo, prazo) | Reconhecimento em vez de evocação; estrutura repetida vira esquema e acelera a leitura das próximas fichas | Nielsen (1994), heurística 6; Sweller (1988), aquisição de esquemas. Forte |
| Prazos citados só quando estão fixados em lei, com o artigo ao lado; nos demais, "o indicado no documento" | Prevenção de erro: um prazo genérico errado é mais perigoso que nenhum | Nielsen (1994), heurística 5. Forte |
| **Calculadora de multa e juros** abre com um exemplo preenchido e mostra cada parcela com a regra usada | Exemplo resolvido reduz a carga de quem aprende o cálculo; transparência permite conferir | Sweller e Cooper (1985), efeito do exemplo resolvido, *Cognition and Instruction*. Forte |
| Validação enquanto a pessoa digita, com mensagem que diz como corrigir | Prevenir e explicar o erro no momento | Nielsen (1994), heurísticas 5 e 9. Forte |
| Aviso explícito quando a Selic de um mês ainda não foi publicada | Visibilidade do estado e honestidade sobre a incerteza | Nielsen (1994), heurística 1. Forte |
| Coluna de texto alinhada à esquerda e números à direita | Texto alinhado à direita é lido mais devagar; números alinhados à direita facilitam comparar casas decimais | Convenção tipográfica consolidada. Moderada |
| **Plano de ação** da triagem em passos numerados, com copiar e imprimir | A ordem é informação; registrar o plano fora da cabeça libera a memória de trabalho | Risko e Gilbert (2016), descarregamento cognitivo, *Trends in Cognitive Sciences*. Moderada |

## 6c. Personalização e agenda (Fase 4)

| Decisão | Princípio | Evidência |
|---|---|---|
| **Perfil do regime escolhido pela pessoa**: o site só destaca o cartão, pré-seleciona a Reforma e o painel de débitos e filtra a agenda; nada muda de lugar sozinho | Interfaces que o usuário ajusta são mais previsíveis e mais bem aceitas que as que se reorganizam automaticamente | Findlater e McGrenere (2004), *CHI*; Nielsen (1994), heurística 3. Moderada |
| Filtro sempre reversível ("ver todas", "esquecer a escolha") | Controle e liberdade do usuário | Nielsen (1994), heurística 3. Forte |
| Escolha guardada só no navegador | Privacidade por padrão; nada a enviar ou proteger no servidor | LGPD, art. 6º (necessidade). Norma |
| **Agenda** mostra a regra do prazo e a base legal, e manda para a Agenda Tributária oficial para a data exata | Uma data calculada errada causa multa; a fonte oficial resolve dias úteis e feriados | Nielsen (1994), heurística 5 (prevenção de erro). Forte |
| Teto diário de perguntas à IA (`OPENAI_MAX_DIARIO`) | Custo previsível; quando o teto é atingido, a mensagem indica a alternativa gratuita | Prevenção e recuperação de erro (heurísticas 5 e 9). Forte |

## 6e. Jornada de trabalho e página inicial por papel (Fase 6, etapa 1)

| Decisão | Princípio | Evidência |
|---|---|---|
| **Selos "Em vigor", "Aguardando regulamentação" e "Simulação"** em regras, cálculos e escalas | Distinguir norma de hipótese reduz erro de interpretação; o selo usa texto, cor e forma (contorno tracejado na simulação), nunca só cor | WCAG 2.2, critério 1.4.1; Nielsen (1994), heurísticas 2 e 5. Forte |
| Conta aberta em cada calculadora (fórmula, divisor, base legal) | Transparência aumenta a confiança e permite conferir; evita que um número isolado vire âncora | Tversky e Kahneman (1974), ancoragem; Nielsen (1994), heurística 1. Moderada |
| Tabela "mesmo salário, jornada menor" e as três opções da empresa (horas extras, contratar, reorganizar) lado a lado | Comparar alternativas explícitas melhora a decisão em relação a avaliar uma opção isolada | Hsee (1996), avaliação conjunta × separada. Moderada |
| Exemplos já preenchidos nas calculadoras | Um caso pronto mostra o que a ferramenta faz e reduz o esforço inicial | Sweller e Cooper (1985), efeito do exemplo resolvido. Moderada |
| **Página inicial: três caminhos por papel** (trabalhador, empresa, contador ou advogado) antes dos temas | Menos opções na primeira decisão e rótulos em que a pessoa se reconhece; o menu por tema continua para quem não quer se identificar | Hick (1952) e Hyman (1953); Nielsen Norman Group, navegação por público. Moderada |
| Dois destaques (6x1 e execução fiscal) com uma ação principal e uma secundária cada | Hierarquia visual clara e ação primária única por bloco | Nielsen (1994), heurística 8; Fitts (1954). Moderada |
| Botão "Tenho interesse" no plano Pro, só contado | Medir demanda antes de construir login e pagamento | Kohavi, Tang e Xu (2020). Forte |

## 6f. Ferramentas de execução fiscal (Fase 6, etapa 2)

| Decisão | Princípio | Evidência |
|---|---|---|
| Regras conferidas no texto oficial (Planalto) antes de programar; portaria não confirmada na fonte marcada como "Depende" | Precisão e transparência sobre o grau de certeza de cada número | Nielsen (1994), heurística 5 (prevenção de erros). Forte |
| **Prazos em duas colunas** (dias corridos e dias úteis), com a orientação de usar a data mais cedo | A aplicação do CPC aos prazos da LEF é controvertida; mostrar as duas evita uma certeza falsa e protege contra a perda do prazo | Princípio da precaução; Nielsen (1994), heurística 5. Forte |
| Atualização do débito "levada" para o simulador com um botão | Reaproveitar dados digitados reduz retrabalho e erro de transcrição | Nielsen (1994), heurística 7 (eficiência). Moderada |
| À vista, parcelamento e transação lado a lado, com o total projetado | Avaliação conjunta de alternativas melhora a decisão | Hsee (1996). Moderada |
| Carteira de CDAs só no navegador, com exportação para planilha e bloqueio de CPF e CNPJ | Privacidade por padrão e portabilidade dos dados | LGPD, art. 6º, III (necessidade). Norma |
| Prazos baixados para a agenda do celular (.ics), com lembrete 3 dias antes | Lembretes externos compensam a memória prospectiva falha | Einstein e McDaniel (1990), memória prospectiva. Moderada |

## 6g. Especialização em Direito Tributário e Previdenciário

| Decisão | Princípio | Evidência |
|---|---|---|
| **Menu em quatro grupos por tema** (Tributário; Débitos e cobrança; Previdência e folha; Atualizações), cada um com 4 a 7 itens | Grupos com rótulo claro e poucos itens reduzem o tempo de escolha e a carga da memória de trabalho | Hick (1952) e Hyman (1953); Cowan (2001). Moderada |
| Página inicial com as mesmas quatro portas do menu | Consistência entre navegação e conteúdo: a pessoa aprende um modelo mental só | Nielsen (1994), heurística 4. Forte |
| Retiradas: Direito Administrativo, Áreas e processos do Direito e Navegar por área; item NR-1 de "O que mudou" | Conteúdo fora do foco compete por atenção e dilui o "cheiro de informação" dos caminhos principais | Pirolli e Card (1999), teoria do forrageamento de informação. Moderada |
| "Fontes e livros" fundida em "Legislação, jurisprudência e fontes" | Duas páginas com o mesmo propósito obrigam a pessoa a decidir entre elas sem ganho | Nielsen (1994), heurística 8 (minimalismo). Forte |
| "CLT, PJ e responsabilidades" reescrita como "Folha, pró-labore e PJ: tributos e contribuições" | Mesmo assunto, pelo ângulo do público-alvo (custeio, retenções, regime) | Arquitetura da informação orientada à tarefa (Rosenfeld, Morville e Arango, 2015). Moderada |
| Páginas retiradas viram redirecionamento, com canonical para o destino e fora do sitemap | Links antigos e o histórico do Google continuam funcionando | Prevenção de erro (Nielsen, 1994, heurística 5). Forte |
| Escala 6x1 e calculadoras mantidas, a pedido do autor | Tema mais buscado do Prumo e ligado ao custo da folha | Dados do Semrush (cerca de 135 mil buscas por mês) |

## 6d. Medição contínua (Fase 5)

| Decisão | Princípio | Evidência |
|---|---|---|
| **Contagens agregadas por mês, sem cookie, identificador ou IP guardado** | Coletar só o necessário para a finalidade (melhorar páginas); sem dado pessoal, nada a pedir consentimento nem a proteger | LGPD, art. 6º, III (necessidade). Norma |
| Respeita "não rastrear" e o controle global de privacidade nas visitas | Recusa expressa pelo navegador deve valer | LGPD, art. 18; especificação Global Privacy Control. Norma |
| **"Esta página ajudou?" com resposta sim/não** | Pergunta binária tem custo mínimo de resposta; quanto maior o esforço, menor e mais enviesada a taxa de resposta | Krosnick (1991), *satisficing* em questionários. Moderada |
| Motivo opcional em quatro opções fechadas, sem texto livre | Diagnóstico acionável sem receber dado pessoal; opções fechadas reduzem esforço | Krosnick (1991); LGPD, art. 6º, III. Moderada |
| Caixa no fim do conteúdo, depois dos links relacionados | A pergunta só faz sentido depois da leitura e não compete com o conteúdo | Nielsen (1994), heurística 8. Moderada |
| **Buscas sem resultado** guardam só o termo (até 5 palavras, sem números ou e-mail) | É o sinal mais direto de lacuna de conteúdo ou de vocabulário da busca | Rosenfeld, Morville e Arango (2015), *Information Architecture*, análise de logs de busca. Moderada |
| Painel avisa que menos de 10 respostas não sustentam conclusão e que quem responde é autosselecionado | Evitar decisão com amostra pequena ou enviesada | Kohavi, Tang e Xu (2020). Forte |

---

## 7. Avaliação heurística (estado após a Fase 2)

Feita por um avaliador, com as 10 heurísticas de Nielsen (1994) e severidade de 0 (não é problema) a 4 (catástrofe). Um avaliador encontra só parte dos problemas; Nielsen e Molich (1990) recomendam de 3 a 5 avaliadores independentes.

| Heurística | Situação | Pendência | Severidade |
|---|---|---|---|
| 1. Visibilidade do estado | Página atual no menu, seção ativa no índice, tempo de leitura e data de revisão | Nenhuma relevante | 0 |
| 2. Correspondência com o mundo real | Linguagem simples e glossário com 26 termos | Alguns títulos técnicos ("Sobrestamento dentro da execução fiscal") | 2 |
| 3. Controle e liberdade | Esc fecha menu, busca e glossário; voltar funciona | Nenhuma relevante | 0 |
| 4. Consistência e padrões | Layout comum nas 27 páginas | Corrigido nesta fase: o guia mandava "escolher um tema no menu", que não existe mais; agora aponta o índice "Nesta página" | 0 |
| 5. Prevenção de erros | CPF/CNPJ bloqueados, premissas visíveis | Falta aviso automático quando a revisão passar de 90 dias | 2 |
| 6. Reconhecimento | Triagem por situação, busca em toda página, glossário | Nenhuma relevante | 0 |
| 7. Flexibilidade e eficiência | Atalho "/", tema, índice | Nenhuma relevante | 0 |
| 8. Estética e minimalismo | Resumos no topo das páginas longas | Avisos "conteúdo educativo" repetidos várias vezes na mesma página | 1 |
| 9. Reconhecer e recuperar erros | Busca sem resultado sugere termos; página 404 com caminhos | Nenhuma relevante | 0 |
| 10. Ajuda e documentação | Assistente, fontes, glossário | IA desligada até a chave ser cadastrada | 1 |

## 8. Métricas medidas (23/11/2026)

| Métrica | Valor | Meta |
|---|---|---|
| Contraste texto/fundo, tema claro | 16,4:1 | ≥ 4,5:1 |
| Menor contraste de texto, tema claro (sobretítulo dourado) | 6,4:1 | ≥ 4,5:1 |
| Contraste do indicador de foco, tema claro | 6,4:1 (antes 2,2:1, corrigido) | ≥ 3:1 |
| Menor contraste de texto, tema escuro | 8,9:1 | ≥ 4,5:1 |
| Páginas com texto abaixo do contraste mínimo, nos dois temas, a 375 px | 0 de 27 | 0 |
| Páginas com rolagem lateral no celular | 0 de 27 | 0 |
| Erros de JavaScript | 0 de 27 | 0 |
| Busca do assistente, acerto entre os 3 primeiros (hit@3) | 28 de 29 perguntas | ≥ 85% |
| Peso do CSS / script comum | 43 KB / 24 KB | < 100 KB por página |

Essas medições rodam sozinhas a cada mudança no GitHub (`.github/workflows/site-check.yml`), com o axe para acessibilidade.

## 9. Validação com pessoas (próxima etapa)

Medições automáticas e avaliação heurística não substituem observar pessoas reais. O roteiro abaixo deve ser aplicado a cada fase.

**Participantes:** 5 por rodada, do público do Prumo (donos de pequenas empresas, pessoas de departamento fiscal ou financeiro, contadores). Cinco participantes encontram a maior parte dos problemas graves de uma rodada (Nielsen e Landauer, 1993).

**Método:** teste moderado com pensamento em voz alta, no celular e no computador.

**Tarefas:**

1. "Sua empresa recebeu uma carta da PGFN dizendo que há dívida inscrita. Descubra o que isso significa e qual é o primeiro passo."
2. "Descubra se um MEI pode ter dois empregados em 2027."
3. "Calcule quanto sobe o valor da hora de quem ganha R$ 2.500 quando a jornada cai para 40 horas."
4. "Sem sair da página de execução fiscal, descubra o que é CDA."
5. "Explique a diferença entre restituição e compensação."

**O que medir:** taxa de sucesso por tarefa, tempo por tarefa, erros, a pergunta de facilidade de 1 a 7 depois de cada tarefa (SEQ; Sauro e Dumas, 2009) e o questionário SUS ao final (Brooke, 1996; a média de referência é 68).

**Depois de publicar (em funcionamento desde a Fase 5):** contagem de uso sem cookies, pergunta "Esta página ajudou?" e lista de buscas sem resultado, no painel `/painel.html`. Rotina mensal: abrir o painel, corrigir primeiro as páginas com mais respostas "não" (usando o motivo mais citado), transformar as buscas sem resultado em conteúdo ou sinônimo na busca (`SYN` em `assistente.js`) e comparar com o mês anterior. Testes A/B só com tráfego suficiente para resultado estatístico (Kohavi, Tang e Xu, 2020); com pouco tráfego, os testes com pessoas são mais confiáveis.

---

## Referências

- Abrams, R. A.; Christ, S. E. (2003). Motion onset captures attention. *Psychological Science*, 14(5).
- Ausubel, D. P. (1960). The use of advance organizers in the learning and retention of meaningful verbal material. *Journal of Educational Psychology*, 51(5).
- Birch, J. (2012). Worldwide prevalence of red-green color deficiency. *Journal of the Optical Society of America A*, 29(3).
- Brooke, J. (1996). SUS: a quick and dirty usability scale. In *Usability Evaluation in Industry*.
- Chandler, P.; Sweller, J. (1991). Cognitive load theory and the format of instruction. *Cognition and Instruction*, 8(4).
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1).
- Dyson, M. C.; Haselgrove, M. (2001). The influence of reading speed and line length on the effectiveness of reading from screen. *International Journal of Human-Computer Studies*, 54(4).
- Findlater, L.; McGrenere, J. (2004). A comparison of static, adaptive, and adaptable menus. *CHI '04*.
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1).
- Einstein, G. O.; McDaniel, M. A. (1990). Normal aging and prospective memory. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 16(4).
- Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6).
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1).
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3).
- ISO 24495-1:2023. Plain language — Part 1: Governing principles and guidelines.
- Kohavi, R.; Tang, D.; Xu, Y. (2020). *Trustworthy Online Controlled Experiments*. Cambridge University Press.
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1).
- Hsee, C. K. (1996). The evaluability hypothesis. *Organizational Behavior and Human Decision Processes*, 67(3).
- Krosnick, J. A. (1991). Response strategies for coping with the cognitive demands of attitude measures in surveys. *Applied Cognitive Psychology*, 5(3).
- Mayer, R. E. (2009). *Multimedia Learning* (2ª ed.). Cambridge University Press.
- Mayer, R. E.; Mathias, A.; Wetzell, K. (2002). Fostering understanding of multimedia messages through pre-training. *Journal of Experimental Psychology: Applied*, 8(3).
- Miller, G. A. (1956). The magical number seven, plus or minus two. *Psychological Review*, 63(2).
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3).
- Nielsen, J. (1994). Enhancing the explanatory power of usability heuristics. *CHI '94*.
- Pirolli, P.; Card, S. (1999). Information foraging. *Psychological Review*, 106(4).
- Rosenfeld, L.; Morville, P.; Arango, J. (2015). *Information Architecture: For the Web and Beyond*. 4. ed. O'Reilly.
- Nielsen, J.; Landauer, T. K. (1993). A mathematical model of the finding of usability problems. *INTERCHI '93*.
- Nielsen, J.; Molich, R. (1990). Heuristic evaluation of user interfaces. *CHI '90*.
- Norman, D. A. (1988). *The Design of Everyday Things*.
- Palmer, S. E. (1992). Common region: a new principle of perceptual grouping. *Cognitive Psychology*, 24(3).
- Piepenbrock, C.; Mayr, S.; Mund, I.; Buchner, A. (2013). Positive display polarity is advantageous for both younger and older adults. *Ergonomics*, 56(7).
- Reber, R.; Schwarz, N.; Winkielman, P. (2004). Processing fluency and aesthetic pleasure. *Personality and Social Psychology Review*, 8(4).
- Rello, L.; Pielot, M.; Marcos, M.-C. (2016). Make it big! The effect of font size and line spacing on online readability. *CHI '16*.
- Risko, E. F.; Gilbert, S. J. (2016). Cognitive offloading. *Trends in Cognitive Sciences*, 20(9).
- Sweller, J.; Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. *Cognition and Instruction*, 2(1).
- Sauro, J.; Dumas, J. S. (2009). Comparison of three one-question, post-task usability questionnaires. *CHI '09*.
- Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2).
- Tversky, A.; Kahneman, D. (1974). Judgment under uncertainty: heuristics and biases. *Science*, 185(4157).
- Treisman, A. M.; Gelade, G. (1980). A feature-integration theory of attention. *Cognitive Psychology*, 12(1).
- von Restorff, H. (1933). Über die Wirkung von Bereichsbildungen im Spurenfeld. *Psychologische Forschung*, 18.
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*.
- Wertheimer, M. (1923). Untersuchungen zur Lehre von der Gestalt II. *Psychologische Forschung*, 4.
