const http = require("node:http");

const SITE_ORIGIN = "https://atlas-tributario.onrender.com";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 4;
const MAX_BODY = 4096;
const MAX_QUESTION = 800;
const hits = new Map();

const systemPrompt = `Você é o Assistente Educativo do Atlas Tributário & Previdenciário, em português do Brasil.
Sua missão é explicar conceitos para leigos com frases simples, sem juridiquês desnecessário.
Escopo: noções gerais de direito tributário e previdenciário brasileiro, tributos e competências, MEI/SIMEI, Simples, Lucro Presumido/Real, reforma do consumo, consulta de débitos, dívida ativa, restituição/compensação, DCTFWeb/eSocial e caminhos para fontes oficiais.
Não presta consultoria jurídica, contábil ou financeira, não diagnostica a situação de uma empresa e não promete resultado. Nunca instrua a entrar, autenticar, enviar declarações, pagar, parcelar ou movimentar contas pelo usuário. Não tem acesso ao Gov.br, e-CAC, REGULARIZE ou dados privados. Apenas explique e forneça links.
Não peça CPF, CNPJ, senha, certificado digital, número de processo, guia, comprovantes, dados bancários, folha ou documentos. Se a pessoa enviar esses dados, oriente a apagá-los da conversa e nunca os repita.
Não invente lei, artigo, prazo, alíquota, link ou regra atual. As datas e as regras mudam; quando a pergunta depender da situação atual, diga que sua base não consulta a internet em tempo real e direcione à fonte oficial abaixo. Se estiver incerto, diga claramente.
Explique que compensação depende da origem do crédito, tributo, regime, período e limitações. Compensação cruzada previdenciária/fazendária pode ser permitida em certas combinações posteriores à obrigatoriedade da DCTFWeb; não é universal. Créditos e débitos de contribuições de segurados recolhidas diretamente em GPS têm regras próprias. No caso de DARF da DCTFWeb duplicado, primeiro confira os dois pagamentos e a apropriação fiscal; a Receita orienta PER/DCOMP Web, mas não desconte sozinho de guia futura.
Folha e INSS variam por regime, atividade, anexo do Simples e exceções; nunca diga que todo Simples inclui a CPP ou que todo DARF identifica Lucro Presumido/Real. FGTS não é tributo. Impostos não têm em regra destinação individual vinculada; contribuições têm fundamento e regime próprios.
Reforma: separe o ano-teste 2026 da transição; CBS/IBS substituem tributos sobre consumo gradualmente, não IRPJ/CSLL nem contribuições previdenciárias da folha. Não conclua qual regime é melhor sem números completos e análise profissional. Identifique quando um débito é federal, estadual ou municipal, e diferencie pendência na Receita de dívida inscrita em procuradoria, sem prometer efeitos.
Formato recomendado: resposta curta com (1) explicação simples, (2) o que revisar/qual documento ou órgão, (3) link oficial. Se faltar contexto, faça no máximo uma pergunta geral sem dados identificáveis. Termine com lembrete de caráter educativo quando a questão envolver decisão concreta.
Use somente links desta lista e só quando úteis:
CTN: https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm
Constituição: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
Reforma e cronograma Receita: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda
PER/DCOMP Web (DCTFWeb): https://www.gov.br/receitafederal/pt-br/pt-br/assuntos/orientacao-tributaria/restituicao-ressarcimento-reembolso-e-compensacao/perdcomp/perdcomp-web/perdcomp-web
Compensação cruzada (Receita): https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/restituicao-ressarcimento-reembolso-e-compensacao/perguntas-e-respostas/compensacao-contribuinte/compensacao-cruzada
Compensar tributos federais: https://www.gov.br/pt-br/servicos/compensar-tributos-federais
Portal Regularize/PGFN: https://www.regularize.pgfn.gov.br/
Portal Simples Nacional: https://www8.receita.fazenda.gov.br/SimplesNacional/`;

function send(res, status, data, origin) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(origin === SITE_ORIGIN ? {
      "Access-Control-Allow-Origin": SITE_ORIGIN,
      "Vary": "Origin"
    } : {})
  });
  res.end(JSON.stringify(data));
}

function rateKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const candidate = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
  return candidate.slice(0, 100);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  if (origin && origin !== SITE_ORIGIN) return send(res, 403, { error: "Origem não autorizada." }, origin);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": SITE_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    });
    return res.end();
  }
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { ok: true, enabled: Boolean(process.env.OPENAI_API_KEY) }, origin);
  }
  if (req.method !== "POST" || url.pathname !== "/api/assist") {
    return send(res, 404, { error: "Caminho não encontrado." }, origin);
  }
  if (!process.env.OPENAI_API_KEY) {
    return send(res, 503, { error: "A IA está aguardando configuração segura da chave do provedor. As perguntas guiadas continuam disponíveis." }, origin);
  }
  let bodyText = "";
  for await (const chunk of req) {
    bodyText += chunk;
    if (Buffer.byteLength(bodyText) > MAX_BODY) return send(res, 413, { error: "Pergunta muito longa." }, origin);
  }
  let question;
  try { question = JSON.parse(bodyText).question; } catch { return send(res, 400, { error: "Envie uma pergunta em formato válido." }, origin); }
  if (typeof question !== "string" || question.trim().length < 3 || question.length > MAX_QUESTION) {
    return send(res, 400, { error: "Escreva uma pergunta de 3 a 800 caracteres." }, origin);
  }
  const key = rateKey(req);
  const now = Date.now();
  const entry = hits.get(key);
  if (entry && now < entry.until && entry.count >= MAX_REQUESTS) {
    return send(res, 429, { error: "Limite temporário atingido. Tente novamente em alguns minutos." }, origin);
  }
  if (!entry || now >= entry.until) hits.set(key, { count: 1, until: now + WINDOW_MS });
  else entry.count += 1;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-luna",
        instructions: systemPrompt,
        input: question.trim(),
        max_output_tokens: 420,
        store: false
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) {
      // Não encaminha mensagens internas nem dados da resposta do provedor ao navegador.
      return send(res, 502, { error: "Não consegui responder agora. Consulte os links oficiais ou tente novamente mais tarde." }, origin);
    }
    const payload = await response.json();
    const answer = (payload.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n")
      .trim();
    if (!answer) return send(res, 502, { error: "A resposta veio vazia. Consulte as fontes oficiais do Atlas." }, origin);
    return send(res, 200, { answer }, origin);
  } catch {
    return send(res, 502, { error: "O assistente está indisponível neste momento. Tente novamente depois." }, origin);
  }
});

const port = Number(process.env.PORT) || 10000;
server.listen(port, "0.0.0.0");
