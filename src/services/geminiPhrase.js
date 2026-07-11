/**
 * src/services/geminiPhrase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gera frases de bom dia/motivação sob demanda usando o Google Gemini.
 * Reforço opcional — sem chave configurada, o app usa só o banco de frases
 * fixo (src/constants/frases.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { GEMINI_API_KEY } from '../config/api';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/**
 * Gera uma frase curta e original para a categoria informada
 * @param {string} categoriaLabel — ex: "bom dia", "motivação", "fé"
 * @returns {Promise<string>}
 */
export async function gerarFraseIA(categoriaLabel) {
  if (!GEMINI_API_KEY) {
    throw new Error('IA não configurada');
  }

  const prompt =
    `Escreva uma frase curta, positiva e calorosa de "${categoriaLabel}" em português do Brasil, ` +
    'no estilo das mensagens que as pessoas compartilham no WhatsApp pela manhã. ' +
    'No máximo 12 palavras. Responda apenas com a frase, sem aspas, sem emojis, sem explicações.';

  const response = await axios.post(
    `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100,
        // Desliga o "modo pensamento" do modelo — sem isso, ele gasta o limite
        // de tokens "pensando" e a resposta final vem cortada/vazia.
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    { timeout: 15000 }
  );

  const texto = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!texto) {
    throw new Error('A IA não conseguiu gerar uma frase agora.');
  }

  // Remove aspas que o modelo às vezes adiciona por conta própria
  return texto.replace(/^["“]+|["”]+$/g, '').trim();
}
