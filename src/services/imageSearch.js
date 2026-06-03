/**
 * src/services/imageSearch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Busca de imagens usando DuckDuckGo Images (API não-oficial)
 * ✅ 100% gratuito, sem API key, sem cadastro
 * ✅ Retorna imagens reais do Pinterest, blogs, sites brasileiros
 * ✅ React Native não tem CORS, então funciona perfeitamente
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

const DDG_URL    = 'https://duckduckgo.com/';
const DDG_IMG    = 'https://duckduckgo.com/i.js';
const RESULTS_PER_PAGE = 12;

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';

// Cache de tokens e próximas páginas por query
const tokenCache = {};    // query → vqd
const nextPageCache = {}; // query → next URL para próxima página
const imageBuffer = {};   // query → array com imagens acumuladas

/**
 * Enriquece o termo para buscar imagens com texto motivacional em PT-BR
 */
function enriquecerQuery(query) {
  const q = query.toLowerCase().trim();

  if (q.includes('bom dia'))    return 'bom dia mensagem frases motivacional imagem';
  if (q.includes('boa tarde'))  return 'boa tarde mensagem frases imagem bonita';
  if (q.includes('boa noite'))  return 'boa noite mensagem frases imagem carinhosa';
  if (q.includes('motivac'))    return `${query} frases motivacionais imagens`;
  if (q.includes('fé') || q.includes('fe') || q.includes('deus'))
                                return `${query} mensagem fé imagem`;
  return `${query} mensagem imagem frases`;
}

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

  // Extrai o token VQD do HTML da resposta
  const match =
    response.data.match(/vqd=["']?([^"'&]+)["']?/) ||
    response.data.match(/vqd%3D([^&"']+)/);

  if (!match) {
    throw new Error('Não foi possível iniciar a busca. Tente novamente.');
  }

  const vqd = decodeURIComponent(match[1]);
  tokenCache[query] = vqd;
  return vqd;
}

/**
 * Busca lote de imagens na API do DuckDuckGo
 */
async function buscarLote(query, vqd, nextUrl = null) {
  const url    = nextUrl ? `https://duckduckgo.com${nextUrl}` : DDG_IMG;
  const params = nextUrl
    ? {}
    : {
        l: 'br-pt_BR',
        o: 'json',
        q: query,
        vqd,
        f: ',,,,,',  // filtros: tamanho, cor, tipo, licença, etc.
        p: 1,        // página inicial
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

/**
 * Normaliza um resultado do DDG para o formato do app
 */
function normalizarImagem(item, index, page) {
  return {
    id: `ddg-${page}-${index}-${Date.now()}`,
    url: item.image || item.url || '',
    thumbnailUrl: item.thumbnail || item.image || '',
    title: item.title || '',
    width: item.width || 800,
    height: item.height || 800,
    source: item.url || '',
  };
}

/**
 * Busca imagens usando DuckDuckGo Images
 *
 * @param {string} query — Termo digitado pelo usuário
 * @param {number} page  — Página (começa em 1)
 * @returns {Promise<{ images, totalResults, hasMore }>}
 */
export async function buscarImagens(query, page = 1) {
  const queryOtimizada = enriquecerQuery(query);
  const cacheKey = queryOtimizada;

  try {
    // — Inicializa o buffer para esta query —
    if (page === 1) {
      delete imageBuffer[cacheKey];
      delete tokenCache[cacheKey];
      delete nextPageCache[cacheKey];
    }

    // Buffer já tem imagens suficientes para esta página?
    const bufferAtual = imageBuffer[cacheKey] || [];
    const startIdx    = (page - 1) * RESULTS_PER_PAGE;
    const endIdx      = page * RESULTS_PER_PAGE;

    if (bufferAtual.length >= endIdx) {
      // Servir do buffer
      return {
        images: bufferAtual.slice(startIdx, endIdx),
        totalResults: bufferAtual.length + RESULTS_PER_PAGE,
        hasMore: bufferAtual.length > endIdx || !!nextPageCache[cacheKey],
      };
    }

    // — Busca token VQD —
    const vqd = await buscarToken(queryOtimizada);

    // — Busca próximo lote de imagens —
    const nextUrl = nextPageCache[cacheKey] || null;
    const data    = await buscarLote(queryOtimizada, vqd, nextUrl);

    const novosResultados = (data.results || [])
      .filter(item => item.image && item.image.startsWith('http'))
      .map((item, i) => normalizarImagem(item, i, page));

    // Atualiza buffer e próxima página
    imageBuffer[cacheKey]  = [...bufferAtual, ...novosResultados];
    nextPageCache[cacheKey] = data.next || null;

    const buffer    = imageBuffer[cacheKey];
    const pageItems = buffer.slice(startIdx, endIdx);

    return {
      images: pageItems,
      totalResults: buffer.length + (data.next ? RESULTS_PER_PAGE : 0),
      hasMore: buffer.length > endIdx || !!data.next,
    };

  } catch (error) {
    console.error('[DDG Search] Erro:', error.message);

    // Mensagens de erro amigáveis
    if (error.response?.status === 403 || error.response?.status === 429) {
      throw new Error('Muitas buscas seguidas. Aguarde um momento e tente de novo.');
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Conexão lenta. Verifique sua internet e tente novamente.');
    }
    if (error.message.includes('token') || error.message.includes('VQD')) {
      throw new Error('Erro ao iniciar busca. Tente de novo em alguns segundos.');
    }

    throw new Error('Não foi possível buscar imagens. Verifique sua conexão.');
  }
}
