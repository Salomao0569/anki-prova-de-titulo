const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");

const openaiKey = defineSecret("OPENAI_API_KEY");

/**
 * Monta o contexto completo da questão para os agentes.
 */
function buildQuestionContext({ question, userAnswer, correctAnswer, detail, wasCorrect, options }) {
  const optionsText = options
    ? Object.entries(options).map(([k, v]) => `  ${k}) ${v}`).join("\n")
    : "";

  return [
    `Questão: ${question}`,
    optionsText ? `Alternativas:\n${optionsText}` : "",
    `Resposta do aluno: ${userAnswer}`,
    `Resposta correta: ${correctAnswer}`,
    wasCorrect ? "O aluno ACERTOU." : "O aluno ERROU.",
    detail ? `Contexto/detalhe: ${detail}` : "",
  ].filter(Boolean).join("\n");
}

/**
 * Chama a OpenAI com system prompt + contexto da questão.
 */
async function callAgent(client, systemPrompt, questionContext, maxTokens) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: questionContext },
    ],
  });
  return completion.choices[0].message.content;
}

// ── System Prompts ──────────────────────────────────────────────────────────

const PROMPT_EXPLICADOR = `Você é um professor especialista em ecocardiografia, preparando alunos para a prova de título DIC (Departamento de Imagem Cardiovascular da SBC).

Sua tarefa: explicar de forma didática e objetiva POR QUE a resposta correta está certa.
- Se o aluno ERROU, explique também por que a alternativa dele está errada.
- Se o aluno ACERTOU, reforce o raciocínio correto e destaque o ponto-chave.
- Use linguagem clara, com bullet points quando útil.
- Relacione com achados ecocardiográficos (medidas, cortes, Doppler, strain, etc.) sempre que pertinente.
- NÃO use headers markdown. NÃO repita o enunciado da questão.
- Máximo 150 palavras.`;

const PROMPT_APROFUNDADOR = `Você é um cardiologista-ecocardiografista experiente que prepara alunos para a prova DIC.

Sua tarefa: complementar a explicação com informações de alto valor para a prova.
- Adicione pérolas clínicas (clinical pearls) relevantes ao tema.
- Mencione armadilhas comuns da prova DIC (pegadinhas, diagnósticos diferenciais).
- Conecte o tema a outros tópicos do edital DIC quando possível (ex: valvopatias ↔ hemodinâmica, cardiopatias congênitas ↔ eco 3D).
- Cite valores de referência, classificações ou critérios diagnósticos quando relevante.
- NÃO repita a explicação básica. Foque no que AGREGA.
- NÃO use headers markdown.
- Máximo 100 palavras.`;

const PROMPT_MNEMONICO = `Você é um especialista em técnicas de memorização para estudantes de medicina.

Sua tarefa: criar UM mnemônico ou dica de memória para o conceito-chave da questão.
- Pode ser acrônimo, frase, analogia visual ou associação.
- Deve ser em português, fácil de lembrar e diretamente útil para a prova DIC.
- Seja criativo mas clinicamente preciso.
- NÃO use headers markdown.
- Máximo 50 palavras.`;

// ── Cloud Function ──────────────────────────────────────────────────────────

exports.explainQuestion = onRequest(
  {
    cors: true,
    secrets: [openaiKey],
    region: "southamerica-east1",
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { question, userAnswer, correctAnswer, detail, wasCorrect, options } = req.body;

    if (!question) {
      res.status(400).json({ error: "Missing question" });
      return;
    }

    const client = new OpenAI({ apiKey: openaiKey.value() });
    const context = buildQuestionContext({ question, userAnswer, correctAnswer, detail, wasCorrect, options });

    try {
      const [explicacao, aprofundamento, mnemonico] = await Promise.all([
        callAgent(client, PROMPT_EXPLICADOR, context, 400),
        callAgent(client, PROMPT_APROFUNDADOR, context, 300),
        callAgent(client, PROMPT_MNEMONICO, context, 150),
      ]);

      res.json({ explicacao, aprofundamento, mnemonico });
    } catch (err) {
      console.error("OpenAI agent swarm error:", err);
      res.status(500).json({ error: "Erro ao gerar explicação" });
    }
  }
);
