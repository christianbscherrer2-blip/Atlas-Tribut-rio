# Kit de divulgação do Prumo

Objetivo: fazer o Prumo ser encontrado por quem precisa dele (donos de pequenas empresas, pessoas de departamento fiscal e contadores) e medir no painel o que funciona.

---

## 1. Antes de divulgar (uma vez só)

### Google Search Console (o Google não tem outro jeito de ser avisado)
1. Entre em https://search.google.com/search-console com a conta Google que verificou o site (o arquivo `googleb49ad066d7bdc0dd.html` já está no ar).
2. Menu **Sitemaps** → envie `sitemap.xml`. Status esperado: "Sucesso".
3. Menu **Inspeção de URL** → cole cada endereço abaixo e clique em **Solicitar indexação** (há limite diário; faça alguns por dia):
   - `https://prumo-empresas.onrender.com/`
   - `https://prumo-empresas.onrender.com/acrescimos.html`
   - `https://prumo-empresas.onrender.com/documentos.html`
   - `https://prumo-empresas.onrender.com/agenda.html`
   - `https://prumo-empresas.onrender.com/empresa.html`
   - `https://prumo-empresas.onrender.com/execucao-fiscal.html`
   - `https://prumo-empresas.onrender.com/regimes.html`
   - `https://prumo-empresas.onrender.com/reforma.html`
   - `https://prumo-empresas.onrender.com/escala-6x1.html`
4. Volte em 1 a 2 semanas: menu **Páginas** mostra quantas foram indexadas; **Desempenho** mostra as buscas que trouxeram visitas.

### Bing Webmaster Tools (também alimenta DuckDuckGo, Yahoo e assistentes de IA)
1. Entre em https://www.bing.com/webmasters e escolha **Importar do Google Search Console** (é o caminho mais rápido).
2. A partir daí, o próprio site avisa o Bing a cada publicação (robô `indexnow` no GitHub). Não precisa fazer mais nada.

### Domínio próprio (recomendado)
Endereços `onrender.com` passam menos confiança e rendem menos nas buscas.
1. Registre um domínio `.com.br` no registro.br (precisa de CPF ou CNPJ).
2. No Render, serviço **atlas-tributario** → **Settings → Custom Domains** → adicione o domínio e siga as instruções de DNS.
3. Peça para eu rodar `scripts/set_domain.py` com o domínio novo e cadastrar o domínio em `SITE_ORIGINS` no serviço do assistente; depois, adicione o domínio novo no Search Console.

### Perfis
- No seu LinkedIn, em **Contato** e no **Destaque**, coloque o link `https://prumo-empresas.onrender.com/?origem=linkedin-perfil`.

---

## 2. Links marcados: como saber de onde veio cada visita

Acrescente `?origem=nome` no fim de qualquer endereço do Prumo. O painel mostra as visitas de cada nome na tabela **Campanhas**. O parâmetro some do endereço assim que a página abre, então quem receber o link de outra pessoa não "herda" a marcação.

Regras do nome: só letras minúsculas, números e hífen, até 24 caracteres. Use sempre o mesmo nome para o mesmo canal.

| Canal | Link pronto |
|---|---|
| Post no LinkedIn sobre a calculadora | `https://prumo-empresas.onrender.com/acrescimos.html?origem=linkedin` |
| Post no LinkedIn sobre documentos | `https://prumo-empresas.onrender.com/documentos.html?origem=linkedin` |
| Perfil do LinkedIn | `https://prumo-empresas.onrender.com/?origem=linkedin-perfil` |
| Grupos de WhatsApp | `https://prumo-empresas.onrender.com/acrescimos.html?origem=whatsapp` |
| Grupos de Telegram | `https://prumo-empresas.onrender.com/?origem=telegram` |
| Instagram (link na bio) | `https://prumo-empresas.onrender.com/?origem=instagram` |
| Contador parceiro (um nome por escritório) | `https://prumo-empresas.onrender.com/documentos.html?origem=parceiro-silva` |
| Assinatura de e-mail | `https://prumo-empresas.onrender.com/?origem=email` |

Links de ferramentas convertem mais que o link da página inicial: quem chega com um problema concreto encontra a resposta na hora.

---

## 3. Textos prontos

Adapte à sua voz. Evite prometer resultado ("resolva sua dívida") e não ofereça análise de caso: o Prumo é educativo.

### LinkedIn 1 · Calculadora de multa e juros
> Pagou um DARF com atraso e quer saber quanto vai dar antes de emitir a guia?
>
> A regra federal é a do art. 61 da Lei 9.430/1996:
> • multa de mora de 0,33% por dia de atraso, limitada a 20%;
> • juros pela Selic acumulada do mês seguinte ao vencimento até o mês anterior ao pagamento, mais 1% no mês do pagamento.
>
> Exemplo: R$ 1.000 vencidos em 20/03/2026 e pagos em 15/06/2026 ficam em R$ 1.231,60.
>
> Montei uma calculadora gratuita que faz a conta com a Selic oficial do Banco Central e mostra mês a mês de onde vem cada centavo:
> https://prumo-empresas.onrender.com/acrescimos.html?origem=linkedin
>
> É uma estimativa educativa: o valor que vale é o da guia emitida no Sicalc.

### LinkedIn 2 · "Que documento é este?"
> Chegou uma carta da Receita, uma intimação ou uma citação, e a primeira reação é pânico.
>
> Antes de qualquer coisa, três perguntas: quem enviou (Receita, PGFN, estado, município ou Justiça)? Que documento é? Qual é o prazo?
>
> Organizei os 10 documentos fiscais mais comuns com como reconhecer, o que costumam significar, o primeiro passo e o prazo previsto em lei:
> https://prumo-empresas.onrender.com/documentos.html?origem=linkedin
>
> Conteúdo educativo; o caso concreto pede contador ou advogado.

### LinkedIn 3 · Agenda de obrigações
> Qual é a lista de obrigações que a sua empresa entrega e paga todo mês?
>
> Fiz uma agenda com 15 obrigações federais recorrentes, filtrável por regime (MEI, Simples, Presumido e Real), com a regra do prazo, a base legal e o link direto para a Agenda Tributária oficial do mês:
> https://prumo-empresas.onrender.com/agenda.html?origem=linkedin

### LinkedIn 4 · Fim da escala 6x1
> A EC 141/2026 prevê escala 5x2 e jornada de 42 horas em até 60 dias, e de 40 horas em até 14 meses, sem redução de salário.
>
> Reuni o que muda para a empresa (CLT, PJ, regime tributário, previdência e custos) e uma calculadora do custo da jornada:
> https://prumo-empresas.onrender.com/escala-6x1.html?origem=linkedin

### WhatsApp ou Telegram (curtas, para grupos de empreendedores e MEIs)
- "Pra quem paga imposto atrasado: essa calculadora gratuita mostra a multa e os juros do DARF com a Selic oficial, antes de emitir a guia → https://prumo-empresas.onrender.com/acrescimos.html?origem=whatsapp"
- "Recebeu carta da Receita ou da PGFN e não sabe o que é? Aqui explica cada tipo de documento e o primeiro passo → https://prumo-empresas.onrender.com/documentos.html?origem=whatsapp"
- "Lista das obrigações do mês por regime (MEI, Simples, Presumido, Real), com link pra agenda oficial da Receita → https://prumo-empresas.onrender.com/agenda.html?origem=whatsapp"

Leia as regras de cada grupo antes de postar; em muitos, links só são aceitos se responderem a uma pergunta.

### Mensagem para contadores parceiros
> Olá, [nome]. Sou estudante de Direito e mantenho o Prumo, um site gratuito que explica para donos de empresa, em linguagem simples, temas como débitos, dívida ativa, documentos da Receita e da PGFN, agenda de obrigações e Reforma Tributária. Ele não presta consultoria e sempre orienta a procurar o contador.
>
> Pensei que poderia ajudar o seu escritório a responder dúvidas repetidas dos clientes. Se fizer sentido, este é um link para indicar: https://prumo-empresas.onrender.com/documentos.html?origem=parceiro-[escritorio]
>
> Se quiser, me diga quais dúvidas mais aparecem aí, que eu priorizo esse conteúdo.

### Descrição curta (bio, assinatura de e-mail)
> Prumo: tributos, trabalho e previdência para a sua empresa, explicados com fontes oficiais. Gratuito e sem cadastro.

---

## 4. Calendário das primeiras 4 semanas

| Semana | Ação | Medir no painel |
|---|---|---|
| 1 | Search Console, Bing e LinkedIn (perfil). Post 1 (calculadora). | Campanhas: `linkedin`, `linkedin-perfil` |
| 2 | Post 2 (documentos). 2 ou 3 grupos de WhatsApp. | `linkedin`, `whatsapp`; "Agora" no dia do post |
| 3 | Post 3 (agenda) no início do mês. Contato com 5 contadores. | `parceiro-*`; páginas mais visitadas |
| 4 | Post 4 (6x1 ou Reforma). Revisão do mês. | Origem "Buscadores" crescendo? Respostas "não" e buscas sem resultado |

Na revisão do mês: repita o formato e o canal que mais trouxeram visitas, corrija primeiro as páginas com mais "não" e transforme as buscas sem resultado em conteúdo.

---

## 5. O que esperar

- **Divulgação direta** (LinkedIn, grupos, parceiros): resultado no mesmo dia, visível na seção "Agora" do painel. Cai depois de 1 ou 2 dias.
- **Google**: indexação em dias ou semanas; visitas pelos buscadores crescem devagar, ao longo de 2 a 6 meses, e se acumulam.
- Um sinal de que está funcionando: a fatia de "Buscadores" em "De onde vêm as visitas" subindo mês a mês e respostas "sim" acima de "não".

## 6. Cuidados

- Não divulgue como consultoria nem prometa resultado: o Prumo é educativo (veja os termos de uso).
- Não use contatos ou dados de clientes do seu trabalho para divulgar o projeto.
- Ao divulgar em nome próprio, lembre que, como advogado no futuro, as regras de publicidade da OAB (Provimento 205/2021) passarão a valer para você.
