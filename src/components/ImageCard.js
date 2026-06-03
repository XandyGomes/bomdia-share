/**
 * src/components/ImageCard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Card individual de imagem com skeleton loading, toque simples e longo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Largura de cada card: metade da tela menos margens
const CARD_MARGIN = 6;
const CARDS_POR_LINHA = 2;
const CARD_SIZE =
  (SCREEN_WIDTH - CARD_MARGIN * (CARDS_POR_LINHA + 1) * 2) / CARDS_POR_LINHA;

// Cores
const COLORS = {
  verde: '#25D366',
  cinzaClaro: '#F0F0F0',
  cinzaSkeleton: '#E8E8E8',
  cinzaSkeletonDark: '#D0D0D0',
  overlay: 'rgba(0,0,0,0.25)',
  branco: '#FFFFFF',
};

/**
 * Componente de Skeleton Loading (placeholder animado)
 */
function SkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacidade = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[styles.skeleton, { opacity: opacidade }]}
    />
  );
}

/**
 * @param {Object} props
 * @param {Object} props.image — Objeto de imagem com url, thumbnailUrl, title
 * @param {Function} props.onPress — Toque simples: abre modal
 * @param {Function} props.onLongPress — Toque longo: download + share direto
 */
export default function ImageCard({ image, onPress, onLongPress }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // Animação de escala ao pressionar
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(image)}
        onLongPress={() => onLongPress(image)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
        style={styles.touchable}
      >
        {/* Skeleton enquanto carrega */}
        {carregando && !erro && <SkeletonCard />}

        {/* Imagem real */}
        {!erro && (image.thumbnailUrl || image.url) ? (
          <Image
            source={{ uri: image.thumbnailUrl || image.url }}
            style={[styles.imagem, carregando && styles.imagemHidden]}
            resizeMode="cover"
            onLoad={() => setCarregando(false)}
            onError={() => {
              setCarregando(false);
              setErro(true);
            }}
          />
        ) : !erro ? (
          <View style={styles.erroContainer}>
            <Ionicons name="image-outline" size={32} color={COLORS.cinzaSkeletonDark} />
          </View>
        ) : null}


        {/* Placeholder de erro */}
        {erro && (
          <View style={styles.erroContainer}>
            <Ionicons name="image-outline" size={32} color={COLORS.cinzaSkeletonDark} />
          </View>
        )}

        {/* Overlay com ícone do WhatsApp (visível no hover / hint) */}
        {!carregando && !erro && (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.whatsappBadge}>
              <Ionicons name="logo-whatsapp" size={14} color={COLORS.branco} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.cinzaClaro,
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchable: {
    flex: 1,
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cinzaSkeleton,
    borderRadius: 12,
  },
  imagem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagemHidden: {
    opacity: 0, // Esconde a imagem enquanto o skeleton aparece
  },
  erroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cinzaClaro,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 6,
  },
  whatsappBadge: {
    backgroundColor: COLORS.verde,
    borderRadius: 10,
    padding: 4,
    opacity: 0.9,
  },
});
