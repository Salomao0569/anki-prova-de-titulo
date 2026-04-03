const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const openaiKey = defineSecret("OPENAI_API_KEY");

exports.explainQuestion = onRequest(
  {
    cors: true,
    secrets: [openaiKey],
    region: "southamerica-east1",
    memory: "256MiB",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { question, userAnswer, correctAnswer, detail, wasCorrect } = req.body;

    if (!question) {
      res.status(400).json({ error: "Missing question" });
      return;
    }

    const context = [
      `Questao: ${question}`,
      `Resposta do aluno: ${userAnswer}`,
      `Resposta correta: ${correctAnswer}`,
      wasCorrect ? "O aluno ACERTOU." : "O aluno ERROU.",
      detail ? `Contexto: ${detail}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = wasCorrect
      ? "Voce e um professor de ecocardiografia preparando alunos para a prova DIC. O aluno ACERTOU. Reforce o raciocinio correto, destaque o ponto-chave e adicione uma perola clinica ou dica de prova. Seja didatico e objetivo. Maximo 200 palavras."
      : "Voce e um professor de ecocardiografia preparando alunos para a prova DIC. O aluno ERROU. Explique por que a resposta dele esta errada e por que a correta esta certa. Adicione uma dica de memoria para fixar. Seja didatico e objetivo. Maximo 200 palavras.";

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + openaiKey.value(),
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI error:", err);
        res.status(500).json({ error: "Erro OpenAI" });
        return;
      }

      const data = await response.json();
      res.json({ explanation: data.choices[0].message.content });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Erro ao gerar explicacao" });
    }
  }
);
