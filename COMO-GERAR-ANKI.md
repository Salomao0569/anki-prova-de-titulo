# Como Gerar Anki Cards com o Claude

Guia para transformar qualquer tema ou diretriz em cards interativos no estilo DIC.

---

## O que o Claude precisa para gerar cards

### 1. Fonte do conteudo

Fornecer **uma** das opcoes abaixo:

| Fonte | Exemplo |
|-------|---------|
| **Questoes erradas** de simulado | Print/texto das questoes + gabarito |
| **Tema especifico** da prova | "Diastologia — graus de disfuncao" |
| **Diretriz/PDF** | "Diretriz SBC Valvopatias 2017, capitulo de estenose aortica" |
| **Aula ou resumo** | Texto colado ou screenshot da aula |
| **Revisao de erros** | Lista de erros recorrentes por tema |

### 2. Nivel de profundidade

Diga ao Claude:
- **Basico** — conceitos fundamentais, definicoes
- **Intermediario** — aplicacao clinica, tabelas, cutoffs
- **Avancado/DIC** — pegadinhas de prova, detalhes de cortes, armadilhas

### 3. Formato desejado

O padrao e o HTML interativo com:
- Modo misto (flip + quiz alternados)
- Diagrama SVG no verso
- Indicador de dificuldade (facil/medio/dificil)
- Streak e progresso

---

## Prompts prontos para copiar e colar

### Prompt 1 — A partir de questoes erradas

```
Errei as seguintes questoes do simulado DIC:
[COLAR TEXTO DAS QUESTOES + GABARITO]

Gere um Anki HTML interativo no estilo DIC (flip + quiz, diagramas SVG,
streak, dificuldade) cobrindo EXATAMENTE o conhecimento necessario para
acertar cada questao. 10 cards. Salve em Desktop/Anki-DIC2026/
```

### Prompt 2 — A partir de um tema

```
Tema: [EX: Diastologia — classificacao por graus]

Gere 10 cards Anki HTML no estilo DIC cobrindo:
- Definicoes e criterios
- Valores de corte (E/A, e', E/e', TRIV, tempo de desaceleracao)
- Armadilhas de prova (pseudonormalizacao, Valsalva)
- Diagramas SVG anatomicos/funcionais

Formato: HTML standalone, modo flip+quiz, streak, dificuldade.
Salve em Desktop/Anki-DIC2026/
```

### Prompt 3 — A partir de diretriz

```
Diretriz: [EX: Diretriz SBC de Valvopatias 2017]
Capitulo: [EX: Estenose Aortica]

Extraia os pontos mais cobraveis em prova DIC e gere 15 cards Anki HTML:
- Criterios de gravidade (area valvar, gradiente medio, Vmax)
- Indicacoes cirurgicas (classe I, IIa, IIb)
- Armadilhas (EA low-flow low-gradient, dobutamina)
- Diagramas SVG com tabelas de cutoff

Formato: HTML standalone igual ao modelo em Desktop/Anki-DIC2026/
```

### Prompt 4 — Revisao espacada (reforco)

```
Ja estudei estes temas: [LISTAR TEMAS]
Gere 10 cards de REVISAO com variacoes das mesmas questoes
(mesmo conceito, enunciado diferente, alternativas reorganizadas).
Quero evitar decorar posicao da resposta.
Formato: HTML Anki DIC padrao.
```

### Prompt 5 — A partir de screenshot de aula

```
[COLAR SCREENSHOT DA AULA]

Transforme o conteudo desta aula em 10 cards Anki HTML interativos.
Foque nos pontos que cairiam em prova DIC.
Inclua diagramas SVG quando houver anatomia ou tabelas.
```

---

## Estrutura de cada card

Cada card no array CARDS do HTML tem esta estrutura:

```javascript
{
  id: 1,                          // numero sequencial
  tag: "Tema — subtema",          // aparece no topo do card
  diff: "easy|medium|hard",       // dificuldade
  question: "Pergunta...",        // frente do card (flip) ou enunciado (quiz)
  answer: "Resposta curta",       // verso do card (flip)
  detail: "Explicacao completa",  // aparece apos responder
  diagram: "nome_do_diagrama",    // chave no objeto DIAGRAMS
  options: ["A","B","C","D"],     // 4 alternativas (modo quiz)
  correct: 2                      // indice da correta (0-based)
}
```

---

## Dicas para cards de alta qualidade

1. **Uma ideia por card** — nao misturar dois conceitos
2. **Alternativas plausveis** — os distratores devem ser erros comuns reais
3. **Diagrama quando houver anatomia** — SVG inline, sem dependencias externas
4. **Explicacao no detalhe** — o "detail" deve ensinar, nao so dizer "alternativa C correta"
5. **Dificuldade honesta** — facil = definicao, medio = aplicacao, dificil = pegadinha/integracao

---

## Organizacao dos arquivos

```
Desktop/Anki-DIC2026/
  |-- COMO-GERAR-ANKI.md          <- este guia
  |-- anki_dic_eco_v2.html         <- modelo base (ecocardiografia)
  |-- anki_diastologia.html        <- exemplo: tema diastologia
  |-- anki_valvopatias_ea.html     <- exemplo: estenose aortica
  |-- anki_revisao_round1.html     <- revisao espacada
  └-- ...
```

Cada arquivo e **standalone** — abre em qualquer navegador, funciona offline, zero dependencias.

---

## Fluxo recomendado de estudo

```
Simulado DIC
    |
    v
Errou questoes? --SIM--> Pedir ao Claude: gerar Anki dos erros
    |                          |
    |                          v
    |                     Estudar cards (mesmo dia)
    |                          |
    |                          v
    |                     +2 dias: refazer cards
    |                          |
    |                          v
    |                     +1 semana: pedir VARIACAO dos cards
    |
    v
Acertou? --SIM--> +2 semanas: pedir cards de REFORCO (mesmo tema, mais dificil)
```

---

## Comando rapido

Para qualquer novo tema, basta dizer ao Claude:

> "Gere anki DIC sobre [TEMA]. Mesmo estilo do modelo em Desktop/Anki-DIC2026/. [N] cards."

O Claude vai gerar o HTML completo com cards, diagramas, quiz e flip.
