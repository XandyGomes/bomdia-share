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

// Estilos sorteados a cada chamada — sem isso o modelo tende a convergir
// sempre pro mesmo tipo de frase ("Que seu dia seja repleto de...")
const ESTILOS = [
  'uma frase de efeito curta e impactante',
  'uma reflexão poética sobre o novo dia',
  'um convite carinhoso pra agradecer a vida',
  'uma mensagem simples e direta, sem clichês',
  'uma frase com um toque de humor leve',
  'uma citação inspiradora no estilo de autoajuda',
  'uma frase sobre superar desafios com coragem',
  'uma mensagem calorosa como se fosse pra um amigo querido',
  'uma frase curta sobre gratidão pelas coisas simples',
  'um pensamento motivacional sobre recomeços',
];

/**
 * Gera uma frase curta e original para a categoria informada
 * @param {string} categoriaLabel — ex: "bom dia", "motivação", "fé"
 * @param {string[]} frasesEvitar — frases já usadas nesta sessão, pra não repetir o padrão
 * @returns {Promise<string>}
 */
export async function gerarFraseIA(categoriaLabel, frasesEvitar = []) {
  if (!GEMINI_API_KEY) {
    throw new Error('IA não configurada');
  }

  const estilo = ESTILOS[Math.floor(Math.random() * ESTILOS.length)];
  const evitarTexto = frasesEvitar.length
    ? `\nNão repita o estilo, a estrutura ou as palavras iniciais destas frases já usadas: ${frasesEvitar
        .slice(-4)
        .map(f => `"${f}"`)
        .join('; ')}.`
    : '';

  const prompt =
    `Você é um criador de frases de "${categoriaLabel}" pra compartilhar no WhatsApp. ` +
    `Escreva ${estilo}, em português do Brasil, no máximo 14 palavras. ` +
    'Seja criativo e original — evite clichês batidos como "que seu dia seja repleto/abençoado". ' +
    `Varie sempre a forma de começar a frase.${evitarTexto}\n` +
    'Responda apenas com a frase final, sem aspas, sem emojis, sem explicações.';

  const response = await axios.post(
    `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.3,
        topP: 0.95,
        maxOutputTokens: 120,
        // Desliga o "modo pensamento" do modelo — sem isso, ele gasta o limite
        // de tokens "pensando" e a resposta final vem cortada/vazia.
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    { timeout: 20000 }
  );

  const texto = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!texto) {
    throw new Error('A IA não conseguiu gerar uma frase agora.');
  }

  // Remove aspas que o modelo às vezes adiciona por conta própria
  return texto.replace(/^["“]+|["”]+$/g, '').trim();
}
