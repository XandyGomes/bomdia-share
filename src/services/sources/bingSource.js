/**
 * src/services/sources/bingSource.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Busca de imagens usando o Bing Images (endpoint não-oficial de HTML async)
 * ✅ Sem API key — segunda fonte além do DuckDuckGo para aumentar o volume
 * ✅ Mesmo estilo de conteúdo (imagens com frases, cards de Pinterest/blogs)
 *
 * O Bing não expõe uma API JSON pública como o DDG; em vez disso ele renderiza
 * um fragmento de HTML onde cada resultado é um <a class="iusc" m='{...}'>
 * com um blob JSON no atributo `m` contendo a URL da imagem (murl), thumbnail
 * (turl) e título (t). Extraímos esse blob por regex e fazemos JSON.parse.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { IMAGES_PER_PAGE } from '../../config/api';

const BING_URL = 'https://www.bing.com/images/async';

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';

// Cache de offset de paginação e buffer de imagens acumuladas por query
const nextOffsetCache = {}; // query → próximo offset ("first")
const imageBuffer = {};     // query → array com imagens acumuladas
const semMaisCache = {};    // query → true quando o Bing parou de retornar itens novos

function decodeEntidades(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Extrai os blobs JSON dos atributos m='{...}' de cada resultado <a class="iusc">
 */
function extrairResultados(html) {
  const resultados = [];
  const regex = /class="iusc"[^>]*?m='([^']+)'/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(decodeEntidades(match[1]));
      if (json.murl) {
        resultados.push(json);
      }
    } catch (_) {
      // Item malformado — ignora e segue para o próximo
    }
  }

  return resultados;
}

function normalizarImagem(item, index, page) {
  return {
    id: `bing-${page}-${index}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: item.murl || '',
    thumbnailUrl: item.turl || item.murl || '',
    title: item.t || '',
    width: item.exw || item.initialWidth || 800,
    height: item.exh || item.initialHeight || 800,
    source: 'bing',
  };
}

/**
 * Busca imagens usando Bing Images
 * @param {string} query — Termo já enriquecido
 * @param {number} page — Página (começa em 1)
 * @returns {Promise<{ results: Array, hasMore: boolean }>}
 */
export async function buscarBing(query, page = 1) {
  const cacheKey = query;

  if (page === 1) {
    delete imageBuffer[cacheKey];
    delete nextOffsetCache[cacheKey];
    delete semMaisCache[cacheKey];
  }

  const bufferAtual = imageBuffer[cacheKey] || [];
  const startIdx = (page - 1) * IMAGES_PER_PAGE;
  const endIdx = page * IMAGES_PER_PAGE;

  if (bufferAtual.length >= endIdx) {
    return {
      results: bufferAtual.slice(startIdx, endIdx),
      hasMore: bufferAtual.length > endIdx || !semMaisCache[cacheKey],
    };
  }

  if (semMaisCache[cacheKey]) {
    return {
      results: bufferAtual.slice(startIdx, endIdx),
      hasMore: false,
    };
  }

  const offset = nextOffsetCache[cacheKey] || 0;

  const response = await axios.get(BING_URL, {
    params: {
      q: query,
      first: offset,
      count: 35,
      mmasync: 1,
    },
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    timeout: 15000,
  });

  const novosResultados = extrairResultados(response.data || '')
    .filter(item => item.murl && item.murl.startsWith('http'))
    .map((item, i) => normalizarImagem(item, i, page));

  if (novosResultados.length === 0) {
    semMaisCache[cacheKey] = true;
  } else {
    nextOffsetCache[cacheKey] = offset + 35;
  }

  imageBuffer[cacheKey] = [...bufferAtual, ...novosResultados];

  const buffer = imageBuffer[cacheKey];
  const pageItems = buffer.slice(startIdx, endIdx);

  return {
    results: pageItems,
    hasMore: buffer.length > endIdx || !semMaisCache[cacheKey],
  };
}
