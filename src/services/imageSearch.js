/**
 * src/services/imageSearch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Orquestrador de busca de imagens — combina 3 fontes:
 *   1. DuckDuckGo Images (src/services/sources/ddgSource.js)
 *   2. Bing Images       (src/services/sources/bingSource.js)
 *   3. Pexels            (src/services/sources/pexelsSource.js) — só como reforço
 *
 * DDG e Bing são consultados em paralelo a cada "rodada" e os resultados são
 * mesclados e deduplicados por URL. Pexels só entra quando DDG+Bing não
 * conseguem preencher a página sozinhos (evita gastar a cota gratuita do
 * Pexels em toda rolagem).
 *
 * Uma falha de UMA fonte nunca derruba a busca inteira — a fonte que falhar é
 * marcada como esgotada para esta sessão de busca e as outras continuam.
 * Só lançamos erro de verdade quando a página 1 termina com zero imagens.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { IMAGES_PER_PAGE } from '../config/api';
import { buscarDDG } from './sources/ddgSource';
import { buscarBing } from './sources/bingSource';
import { buscarPexels } from './sources/pexelsSource';
import { normalizeUrlForDedup } from '../utils/url';

const MAX_RODADAS_POR_PAGINA = 4;

// Estado de cada busca em andamento, por cacheKey (termo enriquecido)
const sessao = {}; // cacheKey → { buffer, seenUrls, ddgPage, bingPage, pexelsPage, ddgFim, bingFim, pexelsFim }

/**
 * Enriquece o termo para buscar imagens com texto motivacional em PT-BR
 * (usado por DDG e Bing, que respondem bem a frases longas)
 */
function enriquecerQuery(query) {
  const q = query.toLowerCase().trim();

  if (q.includes('bom dia'))   return 'bom dia mensagem frases motivacional imagem';
  if (q.includes('boa tarde')) return 'boa tarde mensagem frases imagem bonita';
  if (q.includes('boa noite')) return 'boa noite mensagem frases imagem carinhosa';
  if (q.includes('motivac'))   return `${query} frases motivacionais imagens`;
  if (q.includes('fé') || q.includes('fe') || q.includes('deus'))
                                return `${query} mensagem fé imagem`;
  return `${query} mensagem imagem frases`;
}

/**
 * Versão mais literal do termo para o Pexels (banco de fotos) — frases longas
 * em português com gírias retornam poucos resultados num banco de imagens,
 * então usamos termos mais simples e diretos por categoria.
 */
function enriquecerQueryPexels(query) {
  const q = query.toLowerCase().trim();

  if (q.includes('bom dia'))   return 'good morning sunrise coffee';
  if (q.includes('boa tarde')) return 'afternoon sunshine nature';
  if (q.includes('boa noite')) return 'good night moon stars';
  if (q.includes('motivac'))   return 'motivation inspiration';
  if (q.includes('fé') || q.includes('fe') || q.includes('deus'))
                                return 'faith prayer light';
  if (q.includes('amor'))      return 'love couple heart';
  return query;
}

function novaSessao() {
  return {
    buffer: [],
    seenUrls: new Set(),
    ddgPage: 1,
    bingPage: 1,
    pexelsPage: 1,
    ddgFim: false,
    bingFim: false,
    pexelsFim: false,
  };
}

function adicionarAoBuffer(s, results) {
  for (const item of results) {
    const chave = normalizeUrlForDedup(item.url);
    if (!chave || s.seenUrls.has(chave)) continue;
    s.seenUrls.add(chave);
    s.buffer.push(item);
  }
}

/**
 * Busca uma rodada de DDG + Bing em paralelo; nunca rejeita — fontes que
 * falharem são marcadas como esgotadas e simplesmente não contribuem mais.
 */
async function rodadaDdgBing(s, queryOtimizada) {
  const tarefas = [];

  if (!s.ddgFim) {
    tarefas.push(
      buscarDDG(queryOtimizada, s.ddgPage)
        .then(r => {
          s.ddgPage += 1;
          s.ddgFim = !r.hasMore;
          adicionarAoBuffer(s, r.results);
        })
        .catch(() => {
          s.ddgFim = true;
        })
    );
  }

  if (!s.bingFim) {
    tarefas.push(
      buscarBing(queryOtimizada, s.bingPage)
        .then(r => {
          s.bingPage += 1;
          s.bingFim = !r.hasMore;
          adicionarAoBuffer(s, r.results);
        })
        .catch(() => {
          s.bingFim = true;
        })
    );
  }

  if (tarefas.length > 0) {
    await Promise.all(tarefas);
  }
}

/**
 * Busca uma rodada de reforço no Pexels (só chamado quando DDG+Bing não bastam)
 */
async function rodadaPexels(s, queryPexels) {
  if (s.pexelsFim) return;

  try {
    const r = await buscarPexels(queryPexels, s.pexelsPage);
    s.pexelsPage += 1;
    s.pexelsFim = !r.hasMore;
    adicionarAoBuffer(s, r.results);
  } catch (_) {
    s.pexelsFim = true;
  }
}

/**
 * Busca imagens combinando DuckDuckGo, Bing e (se necessário) Pexels
 *
 * @param {string} query — Termo digitado pelo usuário ou de uma categoria
 * @param {number} page  — Página (começa em 1)
 * @returns {Promise<{ images, totalResults, hasMore }>}
 */
export async function buscarImagens(query, page = 1) {
  if (!query || !query.trim()) {
    return { images: [], totalResults: 0, hasMore: false };
  }

  const queryOtimizada = enriquecerQuery(query);
  const queryPexels = enriquecerQueryPexels(query);
  const cacheKey = queryOtimizada;

  if (page === 1 || !sessao[cacheKey]) {
    sessao[cacheKey] = novaSessao();
  }
  const s = sessao[cacheKey];

  const startIdx = (page - 1) * IMAGES_PER_PAGE;
  const endIdx = page * IMAGES_PER_PAGE;

  let rodadas = 0;
  while (s.buffer.length < endIdx && rodadas < MAX_RODADAS_POR_PAGINA) {
    rodadas += 1;

    if (!s.ddgFim || !s.bingFim) {
      await rodadaDdgBing(s, queryOtimizada);
    } else if (!s.pexelsFim) {
      await rodadaPexels(s, queryPexels);
    } else {
      break; // Todas as fontes esgotadas — nada mais a buscar
    }
  }

  // Se DDG+Bing já esgotaram e ainda falta preencher a página, tenta Pexels
  if (s.buffer.length < endIdx && s.ddgFim && s.bingFim && !s.pexelsFim) {
    await rodadaPexels(s, queryPexels);
  }

  const pageItems = s.buffer.slice(startIdx, endIdx);
  const todasEsgotadas = s.ddgFim && s.bingFim && s.pexelsFim;
  let hasMore = s.buffer.length > endIdx || !todasEsgotadas;

  // Segurança: se mesmo depois de várias rodadas não sobrou nada de novo pra
  // preencher esta página (tudo já visto/deduplicado), para de reportar
  // hasMore — senão o app fica girando "carregando mais" pra sempre, mesmo
  // com fontes tecnicamente "não esgotadas"
  if (page > 1 && pageItems.length === 0) {
    hasMore = false;
  }

  if (page === 1 && pageItems.length === 0) {
    throw new Error(
      'Não foi possível encontrar imagens agora. Tente outro termo ou aguarde um instante.'
    );
  }

  return {
    images: pageItems,
    totalResults: s.buffer.length + (hasMore ? IMAGES_PER_PAGE : 0),
    hasMore,
  };
}
