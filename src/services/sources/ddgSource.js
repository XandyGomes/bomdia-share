/**
 * src/services/sources/ddgSource.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Busca de imagens usando DuckDuckGo Images (API não-oficial)
 * ✅ 100% gratuito, sem API key, sem cadastro
 * ✅ Retorna imagens reais do Pinterest, blogs, sites brasileiros
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { IMAGES_PER_PAGE } from '../../config/api';

const DDG_URL = 'https://duckduckgo.com/';
const DDG_IMG = 'https://duckduckgo.com/i.js';

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';

// Cache de tokens, próximas páginas e buffer de imagens acumuladas por query
const tokenCache = {};    // query → vqd
const nextPageCache = {}; // query → next URL para próxima página
const imageBuffer = {};   // query → array com imagens acumuladas

/**
 * Busca o token VQD do DuckDuckGo para uma query
 * O token é obrigatório para usar a API de imagens
 */
async function buscarToken(query) {
  if (tokenCache[query]) return tokenCache[query];

  const response = await axios.get(DDG_URL, {
    params: { q: query, iax: 'images', ia: 'images' },
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    timeout: 10000,
  });

  const match =
    response.data.match(/vqd=["']?([^"'&]+)["']?/) ||
    response.data.match(/vqd%3D([^&"']+)/);

  if (!match) {
    throw new Error('Não foi possível iniciar a busca no DuckDuckGo.');
  }

  const vqd = decodeURIComponent(match[1]);
  tokenCache[query] = vqd;
  return vqd;
}

/**
 * Busca lote de imagens na API do DuckDuckGo
 */
async function buscarLote(query, vqd, nextUrl = null) {
  // O campo "next" da resposta do DDG vem sem barra inicial (ex: "i.js?...")
  const url = nextUrl ? `https://duckduckgo.com/${nextUrl}` : DDG_IMG;
  const params = nextUrl
    ? {}
    : {
        l: 'br-pt_BR',
        o: 'json',
        q: query,
        vqd,
        f: ',,,,,',
        p: 1,
      };

  const response = await axios.get(url, {
    params,
    headers: {
      'User-Agent': USER_AGENT,
      'Referer': `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      'Accept': 'application/json',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    timeout: 15000,
  });

  return response.data; // { results: [...], next: '/i.js?...' }
}

function normalizarImagem(item, index, page) {
  return {
    id: `ddg-${page}-${index}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: item.image || item.url || '',
    thumbnailUrl: item.thumbnail || item.image || '',
    title: item.title || '',
    width: item.width || 800,
    height: item.height || 800,
    source: 'ddg',
  };
}

/**
 * Busca imagens usando DuckDuckGo Images
 * @param {string} query — Termo já enriquecido
 * @param {number} page — Página (começa em 1)
 * @returns {Promise<{ results: Array, hasMore: boolean }>}
 */
export async function buscarDDG(query, page = 1) {
  const cacheKey = query;

  if (page === 1) {
    delete imageBuffer[cacheKey];
    delete tokenCache[cacheKey];
    delete nextPageCache[cacheKey];
  }

  const bufferAtual = imageBuffer[cacheKey] || [];
  const startIdx = (page - 1) * IMAGES_PER_PAGE;
  const endIdx = page * IMAGES_PER_PAGE;

  if (bufferAtual.length >= endIdx) {
    return {
      results: bufferAtual.slice(startIdx, endIdx),
      hasMore: bufferAtual.length > endIdx || !!nextPageCache[cacheKey],
    };
  }

  const vqd = await buscarToken(cacheKey);
  const nextUrl = nextPageCache[cacheKey] || null;
  const data = await buscarLote(cacheKey, vqd, nextUrl);

  const novosResultados = (data.results || [])
    .filter(item => item.image && item.image.startsWith('http'))
    .map((item, i) => normalizarImagem(item, i, page));

  imageBuffer[cacheKey] = [...bufferAtual, ...novosResultados];
  nextPageCache[cacheKey] = data.next || null;

  const buffer = imageBuffer[cacheKey];
  const pageItems = buffer.slice(startIdx, endIdx);

  return {
    results: pageItems,
    hasMore: buffer.length > endIdx || !!data.next,
  };
}
