/**
 * src/services/sharedHistory.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Histórico local (AsyncStorage) de imagens já compartilhadas, para que o app
 * não fique mostrando/repetindo o que o usuário já enviou.
 *
 * Conta como "compartilhada" apenas o que sai do aparelho (WhatsApp / share
 * sheet genérico). Salvar na galeria NÃO marca como compartilhada.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeUrlForDedup } from '../utils/url';

const STORAGE_KEY = '@bomdia_share:historico';

async function lerEntradas() {
  try {
    const bruto = await AsyncStorage.getItem(STORAGE_KEY);
    return bruto ? JSON.parse(bruto) : [];
  } catch (_) {
    return [];
  }
}

async function salvarEntradas(entradas) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entradas));
  } catch (_) {
    // Se o storage falhar, o app continua funcionando sem histórico persistido
  }
}

/**
 * Marca uma imagem como compartilhada (idempotente)
 * @param {string} url
 */
export async function marcarComoCompartilhada(url) {
  const chave = normalizeUrlForDedup(url);
  if (!chave) return;

  const entradas = await lerEntradas();
  if (entradas.some(e => e.url === chave)) return;

  entradas.push({ url: chave, timestamp: Date.now() });
  await salvarEntradas(entradas);
}

/**
 * Lista todas as imagens já compartilhadas
 * @returns {Promise<{ urls: Set<string>, entries: Array }>}
 */
export async function listarCompartilhadas() {
  const entradas = await lerEntradas();
  return {
    urls: new Set(entradas.map(e => e.url)),
    entries: entradas,
  };
}

/**
 * Limpa todo o histórico de compartilhamento
 */
export async function limparHistorico() {
  await salvarEntradas([]);
}

/**
 * Conta quantas imagens foram compartilhadas hoje (dia local do aparelho)
 */
export async function contarCompartilhadasHoje() {
  const entradas = await lerEntradas();
  const agora = new Date();
  const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();

  return entradas.filter(e => e.timestamp >= inicioDoDia).length;
}
