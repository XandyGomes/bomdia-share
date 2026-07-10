/**
 * src/config/api.js
 * Configurações do app
 */

// Quantas imagens exibir por página
export const IMAGES_PER_PAGE = 12;

// Tempo máximo de espera por busca (ms)
export const SEARCH_TIMEOUT = 15000;

// Chave gratuita do Pexels (opcional) — usada apenas como reforço quando
// DuckDuckGo + Bing não retornam imagens suficientes para preencher a página.
// Sem chave, o app funciona normalmente só com DDG + Bing.
// Crie a sua em https://www.pexels.com/api/ (gratuito, aprovação imediata) e
// coloque em um arquivo .env local (nunca commitado, veja .env.example):
//   EXPO_PUBLIC_PEXELS_API_KEY=sua_chave_aqui
export const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY || '';
