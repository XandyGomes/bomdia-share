/**
 * src/screens/HomeScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tela principal do BomDia Share
 * - Header com saudação baseada na hora
 * - Barra de busca
 * - Grade de imagens com paginação
 * - Modal de preview
 * - FAB (botão flutuante) do WhatsApp
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes
import SearchBar from '../components/SearchBar';
import ImageGrid from '../components/ImageGrid';
import ImageModal from './ImageModal';

// Serviços
import { buscarImagens } from '../services/imageSearch';
import { compartilharNoWhatsApp } from '../services/shareImage';

// Utilitários
import { getGreetingByTime } from '../utils/timeGreeting';

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
  // Obtém insets seguros (status bar, notch, etc.)
  const insets = useSafeAreaInsets();
  // ── Estado principal ────────────────────────────────────────────────────────
  const [termoBusca, setTermoBusca] = useState('');
  const [termoAtivo, setTermoAtivo] = useState('');
  const [imagens, setImagens] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [temMais, setTemMais] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [erroGlobal, setErroGlobal] = useState(null);

  // ── Modal ───────────────────────────────────────────────────────────────────
  const [modalVisivel, setModalVisivel] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const [ultimoCompartilhamento, setUltimoCompartilhamento] = useState(null);

  // ── Saudação baseada na hora ────────────────────────────────────────────────
  const saudacao = getGreetingByTime();

  // ── Animação do FAB ─────────────────────────────────────────────────────────
  const fabAnim = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  // ── Efeito inicial: busca baseada na hora ───────────────────────────────────
  useEffect(() => {
    const termoInicial = saudacao.termo;
    setTermoBusca(termoInicial);
    executarBusca(termoInicial, 1, false);
  }, []);

  // ── Animação do FAB ao aparecer ─────────────────────────────────────────────
  useEffect(() => {
    if (ultimoCompartilhamento) {
      Animated.sequence([
        Animated.timing(fabAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(fabAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [ultimoCompartilhamento]);

  /**
   * Executa a busca de imagens
   * @param {string} termo — Termo de busca
   * @param {number} pagina — Número da página
   * @param {boolean} acumular — Se true, acumula (paginação); se false, substitui
   */
  const executarBusca = useCallback(async (termo, pagina, acumular) => {
    if (!termo.trim()) return;

    try {
      setErroGlobal(null);

      if (pagina === 1 && !acumular) {
        setLoading(true);
        setImagens([]);
      } else {
        setLoadingMore(true);
      }

      const resultado = await buscarImagens(termo, pagina);

      setImagens(prev =>
        acumular ? [...prev, ...resultado.images] : resultado.images
      );
      setPaginaAtual(pagina);
      setTemMais(resultado.hasMore);
      setIsDemo(resultado.isDemo || false);
      setTermoAtivo(termo);

    } catch (error) {
      console.error('Erro na busca:', error);
      setErroGlobal(error.message);

      // Mostra alerta apenas para erros de configuração
      if (error.message.includes('SUA_CHAVE') || error.message.includes('api.js')) {
        // Silencia — o banner de demo já orienta o usuário
      } else {
        Alert.alert(
          '❌ Erro na busca',
          error.message,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Handler da barra de busca: dispara nova busca
   */
  function handleBuscar(termo) {
    setTermoBusca(termo);
    executarBusca(termo, 1, false);
  }

  /**
   * Handler de paginação (scroll infinito)
   */
  function handleCarregarMais() {
    if (!loadingMore && !loading && temMais && termoAtivo) {
      executarBusca(termoAtivo, paginaAtual + 1, true);
    }
  }

  /**
   * Handler de pull-to-refresh
   */
  function handleRefresh() {
    setRefreshing(true);
    executarBusca(termoAtivo || saudacao.termo, 1, false);
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
      setUltimoCompartilhamento(imagem);
      await compartilharNoWhatsApp(imagem.url);
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    }
  }

  /**
   * FAB: recompartilha o último item compartilhado
   */
  async function handleFAB() {
    if (!ultimoCompartilhamento) {
      // Se não há último, abre o primeiro da lista como sugestão
      if (imagens.length > 0) {
        handleToqueImagem(imagens[0]);
      }
      return;
    }

    try {
      await compartilharNoWhatsApp(ultimoCompartilhamento.url);
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    }
  }

  // Rótulo do FAB
  const fabLabel = ultimoCompartilhamento
    ? 'Recompartilhar último'
    : 'Compartilhar';

  return (
    // edges={[]} desativa o padding automático do SafeAreaView da safe-area-context
    // pois gerenciamos manualmente via insets.top no header
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
          {/* Logo e nome */}
          <View style={styles.headerLogo}>
            <Ionicons name="sunny" size={26} color={COLORS.branco} />
            <Text style={styles.headerNome}>BomDia Share</Text>
          </View>

          {/* Saudação baseada na hora */}
          <Text style={styles.headerSaudacao}>{saudacao.saudacao}</Text>
        </View>
      </LinearGradient>

      {/* ── Barra de busca ── */}
      <View style={styles.buscaContainer}>
        <SearchBar
          value={termoBusca}
          onChangeText={setTermoBusca}
          onSubmit={handleBuscar}
          loading={loading}
        />
      </View>

      {/* ── Chip do termo ativo ── */}
      {termoAtivo && !loading && (
        <View style={styles.chipContainer}>
          <View style={styles.chip}>
            <Ionicons name="images-outline" size={13} color={COLORS.verde} />
            <Text style={styles.chipTexto} numberOfLines={1}>
              {termoAtivo}
            </Text>
          </View>
          {isDemo && (
            <View style={styles.chipDemo}>
              <Text style={styles.chipDemoTexto}>Modo demo</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Grade de imagens ── */}
      <View style={styles.grid}>
        <ImageGrid
          images={imagens}
          onImagePress={handleToqueImagem}
          onImageLongPress={handleToqueLongoImagem}
          loading={loading}
          loadingMore={loadingMore}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleCarregarMais}
          emptyMessage={
            erroGlobal
              ? erroGlobal
              : `Nenhuma imagem encontrada para "${termoAtivo}"`
          }
          isDemo={isDemo}
        />
      </View>

      {/* ── FAB (Botão Flutuante) WhatsApp ── */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: fabAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFAB}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={28} color={COLORS.branco} />
        </TouchableOpacity>
        <Text style={styles.fabLabel}>{fabLabel}</Text>
      </Animated.View>

      {/* ── Modal de preview ── */}
      <ImageModal
        visible={modalVisivel}
        image={imagemSelecionada}
        onClose={() => {
          setModalVisivel(false);
          // Atualiza último compartilhamento se o usuário compartilhou no modal
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  // O paddingTop é calculado dinamicamente via insets, não no StyleSheet estático
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
  headerSaudacao: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  // ── Busca ───────────────────────────────────────────────────────────────────
  buscaContainer: {
    backgroundColor: COLORS.branco,
    paddingBottom: 4,
    // Sombra suave abaixo do header
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  // ── Chip do termo ativo ─────────────────────────────────────────────────────
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.branco,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.verde + '40',
    gap: 4,
    maxWidth: '60%',
  },
  chipTexto: {
    fontSize: 12,
    color: COLORS.verde,
    fontWeight: '500',
  },
  chipDemo: {
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipDemoTexto: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },
  // ── Grid ────────────────────────────────────────────────────────────────────
  grid: {
    flex: 1,
    backgroundColor: COLORS.fundo,
  },
  // ── FAB ─────────────────────────────────────────────────────────────────────
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
    // Sombra
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
