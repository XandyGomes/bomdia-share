/**
 * src/utils/url.js
 * Normalização de URLs para deduplicação (busca e histórico de compartilhamento
 * usam a mesma regra, para que uma imagem marcada como compartilhada seja
 * reconhecida mesmo se a URL tiver parâmetros de cache-busting diferentes)
 */

/**
 * Remove query string e hash de uma URL para comparação de igualdade
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrlForDedup(url) {
  if (!url) return '';
  return url.split('?')[0].split('#')[0];
}
