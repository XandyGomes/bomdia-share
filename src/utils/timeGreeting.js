/**
 * src/utils/timeGreeting.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Detecta a hora atual e retorna o termo de busca padrão e saudação
 * para ser usado na carga inicial do aplicativo
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Retorna o termo de busca padrão baseado na hora atual
 * @returns {{ termo: string, saudacao: string, emoji: string }}
 */
export function getGreetingByTime() {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) {
    // Manhã: 05h às 11h59
    return {
      termo: 'bom dia mensagem motivacional',
      saudacao: 'Bom Dia! ☀️',
      emoji: '☀️',
      periodo: 'manha',
    };
  } else if (hora >= 12 && hora < 18) {
    // Tarde: 12h às 17h59
    return {
      termo: 'boa tarde mensagem motivacional',
      saudacao: 'Boa Tarde! 🌤️',
      emoji: '🌤️',
      periodo: 'tarde',
    };
  } else {
    // Noite / Madrugada: 18h às 04h59
    return {
      termo: 'boa noite mensagem motivacional',
      saudacao: 'Boa Noite! 🌙',
      emoji: '🌙',
      periodo: 'noite',
    };
  }
}

/**
 * Retorna apenas o termo de busca baseado na hora
 * @returns {string}
 */
export function getDefaultSearchTerm() {
  return getGreetingByTime().termo;
}

/**
 * Retorna apenas a saudação textual
 * @returns {string}
 */
export function getSaudacao() {
  return getGreetingByTime().saudacao;
}
