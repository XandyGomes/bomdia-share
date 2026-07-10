/**
 * src/screens/HomeScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tela principal do BomDia Share
 * - Header com saudação baseada na hora + contador de compartilhadas hoje
 * - Chips de categoria + barra de busca
 * - Grade de imagens com paginação (DDG + Bing + Pexels combinados)
 * - Modal de preview
 * - FAB (botão flutuante) do WhatsApp
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Componentes
import SearchBar from '../components/SearchBar';
import ImageGrid from '../components/ImageGrid';
import CategoryChips from '../components/CategoryChips';
import ImageModal from './ImageModal';

// Serviços
import { buscarImagens } from '../services/imageSearch';
import { compartilharNoWhatsApp } from '../services/shareImage';
import {
  listarCompartilhadas,
  marcarComoCompartilhada,
  limparHistorico,
  contarCompartilhadasHoje,
} from '../services/sharedHistory';

// Utilitários / constantes
import { getGreetingByTime } from '../utils/timeGreeting';
import { normalizeUrlForDedup } from '../utils/url';
import { CATEGORIAS } from '../constants/categorias';

// Constantes de cores
const COLORS = {
  verde: '#25D366',
  verdeDark: '#1DA851',
  verdeGradientInicio: '#25D366',
  verdeGradientFim: '#128C7E',
  fundo: '#FAFAFA',
  texto: '#212121',
  cinzaTexto: '#757575',
  branco: '#FFFFFF',
  sombra: '#000000',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // ── Estado principal ────────────────────────────────────────────────────────
  const [termoBusca, setTermoBusca] = useState('');
  const [termoAtivo, setTermoAtivo] = useState('');
  const [categoriaAtivaId, setCategoriaAtivaId] = useState(null);
  const [imagens, setImagens] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [temMais, setTemMais] = useState(true);
  const [erroGlobal, setErroGlobal] = useState(null);
  const [erroPaginacao, setErroPaginacao] = useState(false);

  // ── Histórico de compartilhamento ───────────────────────────────────────────
  const [historicoUrls, setHistoricoUrls] = useState(new Set());
  const [mostrarCompartilhadas, setMostrarCompartilhadas] = useState(false);
  const [compartilhadasHoje, setCompartilhadasHoje] = useState(0);

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [modalVisivel, setModalVisivel] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [ultimoCompartilhamento, setUltimoCompartilhamento] = useState(null);

  // ── Trava síncrona contra chamadas concorrentes (scroll rápido, duplo toque) ──
  const emVooRef = useRef(false);

  // ── Saudação baseada na hora ────────────────────────────────────────────────
  const saudacao = getGreetingByTime();

  // ── Animação do FAB ─────────────────────────────────────────────────────────
  const fabAnim = useRef(new Animated.Value(1)).current;

  // ── Efeito inicial: busca baseada na hora + carrega histórico ───────────────
  useEffect(() => {
    const termoInicial = saudacao.termo;
    setTermoBusca(termoInicial);
    executarBusca(termoInicial, 1, false);
    carregarHistorico();
  }, []);

  // ── Animação do FAB ao aparecer ─────────────────────────────────────────────
  useEffect(() => {
    if (ultimoCompartilhamento) {
      Animated.sequence([
        Animated.timing(fabAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [ultimoCompartilhamento]);

  async function carregarHistorico() {
    const { urls } = await listarCompartilhadas();
    setHistoricoUrls(urls);
    const hoje = await contarCompartilhadasHoje();
    setCompartilhadasHoje(hoje);
  }

  /**
   * Executa a busca de imagens
   * @param {string} termo — Termo de busca
   * @param {number} pagina — Número da página
   * @param {boolean} acumular — Se true, acumula (paginação); se false, substitui
   */
  const executarBusca = useCallback(async (termo, pagina, acumular) => {
    if (!termo.trim()) return;

    try {
      setErroPaginacao(false);

      if (pagina === 1 && !acumular) {
        setErroGlobal(null);
        setLoading(true);
        setImagens([]);
      }

      const resultado = await buscarImagens(termo, pagina);

      setImagens(prev =>
        acumular ? [...prev, ...resultado.images] : resultado.images
      );
      setPaginaAtual(pagina);
      setTemMais(resultado.hasMore);
      setTermoAtivo(termo);
    } catch (error) {
      console.error('Erro na busca:', error);

      if (pagina === 1) {
        // Busca inicial falhou de verdade (todas as fontes vazias) — avisa o usuário
        setErroGlobal(error.message);
        setTemMais(false);
        Alert.alert('❌ Erro na busca', error.message, [{ text: 'OK' }]);
      } else {
        // Falha ao carregar mais páginas: degrada silenciosamente, sem popup
        setErroPaginacao(true);
        setTemMais(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Handler da barra de busca: dispara nova busca (busca livre limpa a categoria ativa)
   */
  function handleBuscar(termo) {
    if (emVooRef.current) return;
    emVooRef.current = true;
    setCategoriaAtivaId(null);
    setTermoBusca(termo);
    executarBusca(termo, 1, false).finally(() => {
      emVooRef.current = false;
    });
  }

  /**
   * Handler dos chips de categoria
   */
  function handleSelecionarCategoria(categoria) {
    if (emVooRef.current) return;
    emVooRef.current = true;
    setCategoriaAtivaId(categoria.id);
    setTermoBusca(categoria.termo);
    executarBusca(categoria.termo, 1, false).finally(() => {
      emVooRef.current = false;
    });
  }

  /**
   * Handler de paginação (scroll infinito) — trava síncrona evita chamadas
   * concorrentes disparadas pelo FlatList antes do estado atualizar
   */
  function handleCarregarMais() {
    if (emVooRef.current || loading || !temMais || !termoAtivo) return;

    emVooRef.current = true;
    setLoadingMore(true);
    executarBusca(termoAtivo, paginaAtual + 1, true).finally(() => {
      emVooRef.current = false;
    });
  }

  /**
   * Handler de pull-to-refresh
   */
  function handleRefresh() {
    if (emVooRef.current) return;
    emVooRef.current = true;
    setRefreshing(true);
    executarBusca(termoAtivo || saudacao.termo, 1, false).finally(() => {
      emVooRef.current = false;
    });
  }

  /**
   * Abre o modal com a imagem selecionada (toque simples)
   */
  function handleToqueImagem(imagem) {
    setImagemSelecionada(imagem);
    setModalVisivel(true);
  }

  /**
   * Toque longo: compartilha diretamente sem abrir modal
   */
  async function handleToqueLongoImagem(imagem) {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setUltimoCompartilhamento(imagem);
      await compartilharNoWhatsApp(imagem.url);
      await registrarCompartilhamento(imagem.url);
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    }
  }

  /**
   * FAB: recompartilha o último item compartilhado
   */
  async function handleFAB() {
    if (!ultimoCompartilhamento) {
      if (imagens.length > 0) {
        handleToqueImagem(imagens[0]);
      }
      return;
    }

    try {
      await compartilharNoWhatsApp(ultimoCompartilhamento.url);
      await registrarCompartilhamento(ultimoCompartilhamento.url);
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    }
  }

  /**
   * Atualiza o histórico (memória + storage + contador) sem precisar reler tudo
   */
  async function registrarCompartilhamento(url) {
    const chave = normalizeUrlForDedup(url);
    await marcarComoCompartilhada(url);
    setHistoricoUrls(prev => new Set(prev).add(chave));
    setCompartilhadasHoje(prev => prev + 1);
  }

  function handleToggleMostrarCompartilhadas() {
    Haptics.selectionAsync();
    setMostrarCompartilhadas(prev => !prev);
  }

  function handleLimparHistorico() {
    Alert.alert(
      'Limpar histórico?',
      'As imagens já compartilhadas voltarão a aparecer na busca.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await limparHistorico();
            setHistoricoUrls(new Set());
            setCompartilhadasHoje(0);
          },
        },
      ]
    );
  }

  // ── Lista final exibida: oculta já-compartilhadas quando o toggle está desligado ──
  const { imagensExibidas, ocultandoCompartilhadas } = useMemo(() => {
    if (mostrarCompartilhadas) {
      return { imagensExibidas: imagens, ocultandoCompartilhadas: false };
    }
    const filtradas = imagens.filter(
      img => !historicoUrls.has(normalizeUrlForDedup(img.url))
    );
    return {
      imagensExibidas: filtradas,
      ocultandoCompartilhadas: filtradas.length < imagens.length,
    };
  }, [imagens, historicoUrls, mostrarCompartilhadas]);

  const mensagemVazio = erroGlobal
    ? erroGlobal
    : ocultandoCompartilhadas && imagensExibidas.length === 0
      ? 'Todas as imagens encontradas já foram compartilhadas por você.'
      : `Nenhuma imagem encontrada para "${termoAtivo}"`;

  // Rótulo do FAB
  const fabLabel = ultimoCompartilhamento ? 'Recompartilhar último' : 'Compartilhar';

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.verdeGradientInicio}
        translucent={false}
      />

      {/* ── Header com gradiente verde ── */}
      <LinearGradient
        colors={[COLORS.verdeGradientInicio, COLORS.verdeGradientFim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLogo}>
            <Ionicons name="sunny" size={26} color={COLORS.branco} />
            <Text style={styles.headerNome}>BomDia Share</Text>
          </View>

          <View style={styles.headerAcoes}>
            <TouchableOpacity
              onPress={handleToggleMostrarCompartilhadas}
              onLongPress={handleLimparHistorico}
              style={styles.headerBotaoOlho}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={mostrarCompartilhadas ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.branco}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerSaudacao}>{saudacao.saudacao}</Text>
          {compartilhadasHoje > 0 && (
            <View style={styles.contadorChip}>
              <Ionicons name="checkmark-done" size={13} color={COLORS.branco} />
              <Text style={styles.contadorTexto}>{compartilhadasHoje} enviadas hoje</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── Chips de categoria ── */}
      <CategoryChips
        categorias={CATEGORIAS}
        categoriaAtivaId={categoriaAtivaId}
        onSelecionar={handleSelecionarCategoria}
      />

      {/* ── Barra de busca ── */}
      <View style={styles.buscaContainer}>
        <SearchBar
          value={termoBusca}
          onChangeText={setTermoBusca}
          onSubmit={handleBuscar}
          loading={loading}
        />
      </View>

      {/* ── Grade de imagens ── */}
      <View style={styles.grid}>
        <ImageGrid
          images={imagensExibidas}
          onImagePress={handleToqueImagem}
          onImageLongPress={handleToqueLongoImagem}
          loading={loading}
          loadingMore={loadingMore}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleCarregarMais}
          emptyMessage={mensagemVazio}
          erroPaginacao={erroPaginacao}
          mostrandoOcultas={ocultandoCompartilhadas}
          onRevelarOcultas={handleToggleMostrarCompartilhadas}
        />
      </View>

      {/* ── FAB (Botão Flutuante) WhatsApp ── */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabAnim }] }]}>
        <TouchableOpacity style={styles.fab} onPress={handleFAB} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={28} color={COLORS.branco} />
        </TouchableOpacity>
        <Text style={styles.fabLabel}>{fabLabel}</Text>
      </Animated.View>

      {/* ── Modal de preview ── */}
      <ImageModal
        visible={modalVisivel}
        image={imagemSelecionada}
        onClose={() => setModalVisivel(false)}
        onCompartilhado={registrarCompartilhamento}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerNome: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.branco,
    letterSpacing: 0.5,
  },
  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBotaoOlho: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaudacao: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  contadorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  contadorTexto: {
    fontSize: 12,
    color: COLORS.branco,
    fontWeight: '600',
  },
  buscaContainer: {
    backgroundColor: COLORS.branco,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  grid: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.verde,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.verde,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 10,
    color: COLORS.cinzaTexto,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 70,
  },
});
