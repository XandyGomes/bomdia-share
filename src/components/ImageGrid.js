/**
 * src/components/ImageGrid.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Grade de imagens em 2 colunas com FlatList, paginação e pull-to-refresh
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageCard from './ImageCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  verde: '#25D366',
  cinzaTexto: '#757575',
  cinzaClaro: '#F5F5F5',
  texto: '#212121',
  branco: '#FFFFFF',
};

/**
 * @param {Object} props
 * @param {Array} props.images — Lista de objetos de imagem
 * @param {Function} props.onImagePress — Toque simples
 * @param {Function} props.onImageLongPress — Toque longo
 * @param {boolean} props.loading — Estado de carregamento inicial
 * @param {boolean} props.loadingMore — Estado de carregamento de mais itens
 * @param {boolean} props.refreshing — Estado de pull-to-refresh
 * @param {Function} props.onRefresh — Callback do pull-to-refresh
 * @param {Function} props.onEndReached — Callback ao chegar no fim (paginação)
 * @param {string} props.emptyMessage — Mensagem quando não há resultados
 * @param {boolean} props.erroPaginacao — Falha ao carregar mais páginas (degradação silenciosa)
 * @param {boolean} props.mostrandoOcultas — Se true, há imagens já compartilhadas ocultas nesta busca
 * @param {Function} props.onRevelarOcultas — Callback para mostrar as imagens já compartilhadas
 */
export default function ImageGrid({
  images = [],
  onImagePress,
  onImageLongPress,
  loading = false,
  loadingMore = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  emptyMessage = 'Nenhuma imagem encontrada.',
  erroPaginacao = false,
  mostrandoOcultas = false,
  onRevelarOcultas,
}) {

  // Renderiza cada item do grid
  function renderItem({ item }) {
    return (
      <ImageCard
        image={item}
        onPress={onImagePress}
        onLongPress={onImageLongPress}
      />
    );
  }

  // Rodapé do FlatList: spinner ao carregar mais, aviso discreto de falha ou espaço final
  function renderFooter() {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={COLORS.verde} />
          <Text style={styles.footerTexto}>Carregando mais imagens...</Text>
        </View>
      );
    }
    if (erroPaginacao) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerErroTexto}>
            Não foi possível carregar mais imagens agora. Tente rolar novamente em instantes.
          </Text>
        </View>
      );
    }
    if (images.length > 0) {
      return <View style={styles.footerEspaco} />;
    }
    return null;
  }

  // Loading inicial: mostra skeletons
  if (loading && images.length === 0) {
    const skeletons = Array.from({ length: 10 }, (_, i) => ({
      id: `skeleton-${i}`,
      url: '',
      thumbnailUrl: '',
      title: '',
      isSkeleton: true,
    }));

    return (
      <FlatList
        data={skeletons}
        renderItem={({ item }) => (
          <ImageCard
            image={item}
            onPress={() => {}}
            onLongPress={() => {}}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        scrollEnabled={false}
      />
    );
  }

  // Estado vazio
  if (!loading && images.length === 0) {
    return (
      <View style={styles.vazioContainer}>
        <Text style={styles.vazioEmoji}>{mostrandoOcultas ? '✅' : '🔍'}</Text>
        <Text style={styles.vazioTexto}>{emptyMessage}</Text>
        {mostrandoOcultas ? (
          <TouchableOpacity style={styles.vazioBotao} onPress={onRevelarOcultas} activeOpacity={0.8}>
            <Ionicons name="eye" size={16} color={COLORS.branco} />
            <Text style={styles.vazioBotaoTexto}>Mostrar já enviadas</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.vazioSubtexto}>
            Tente buscar por "bom dia", "motivação" ou "boa tarde"
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        // Pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.verde]}
            tintColor={COLORS.verde}
          />
        }
        // Paginação infinita: dispara quando fica a 20% do fim
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        // Rodapé com spinner
        ListFooterComponent={renderFooter}
        // Performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 80, // Espaço para o FAB
  },
  vazioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  vazioEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  vazioTexto: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.texto,
    textAlign: 'center',
    marginBottom: 8,
  },
  vazioSubtexto: {
    fontSize: 14,
    color: COLORS.cinzaTexto,
    textAlign: 'center',
    lineHeight: 20,
  },
  vazioBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verde,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  vazioBotaoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.branco,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  footerTexto: {
    fontSize: 13,
    color: COLORS.cinzaTexto,
    marginLeft: 8,
  },
  footerErroTexto: {
    fontSize: 12,
    color: COLORS.cinzaTexto,
    textAlign: 'center',
    lineHeight: 17,
  },
  footerEspaco: {
    height: 20,
  },
});
