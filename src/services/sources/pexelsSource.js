/**
 * src/services/sources/pexelsSource.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fonte de reforço: API oficial e gratuita do Pexels (fotos de banco de imagens)
 * Só é chamada como "top-up" quando DDG + Bing não preenchem a página inteira.
 *
 * Sem chave configurada, esta fonte simplesmente não faz nenhuma requisição —
 * o app funciona normalmente só com DDG + Bing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { PEXELS_API_KEY } from '../../config/api';

const PEXELS_URL = 'https://api.pexels.com/v1/search';
const PER_PAGE = 15;

function normalizarImagem(photo) {
  return {
    id: `pexels-${photo.id}`,
    url: photo.src?.large2x || photo.src?.large || photo.src?.original || '',
    thumbnailUrl: photo.src?.medium || photo.src?.small || '',
    title: photo.alt || '',
    width: photo.width || 800,
    height: photo.height || 800,
    source: 'pexels',
  };
}

/**
 * Busca imagens no Pexels (só executa se houver PEXELS_API_KEY configurada)
 * @param {string} query
 * @param {number} page — Página do Pexels (1-based, própria contagem do orquestrador)
 * @returns {Promise<{ results: Array, hasMore: boolean }>}
 */
export async function buscarPexels(query, page = 1) {
  if (!PEXELS_API_KEY) {
    return { results: [], hasMore: false };
  }

  const response = await axios.get(PEXELS_URL, {
    params: {
      query,
      per_page: PER_PAGE,
      page,
      locale: 'pt-BR',
    },
    headers: {
      Authorization: PEXELS_API_KEY,
    },
    timeout: 15000,
  });

  const fotos = response.data?.photos || [];

  return {
    results: fotos.map(normalizarImagem),
    hasMore: !!response.data?.next_page,
  };
}
