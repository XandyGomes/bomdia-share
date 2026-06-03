/**
 * src/screens/ImageModal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal fullscreen de preview de imagem com opções de compartilhamento
 * e salvamento na galeria
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { compartilharImagem, compartilharNoWhatsApp, salvarNaGaleria } from '../services/shareImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  verde: '#25D366',
  verdeDark: '#1DA851',
  verdeOverlay: 'rgba(37, 211, 102, 0.15)',
  fundo: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.92)',
  texto: '#212121',
  cinzaTexto: '#757575',
  cinzaClaro: '#F5F5F5',
  branco: '#FFFFFF',
  erro: '#E53935',
};

/**
 * @param {Object} props
 * @param {boolean} props.visible — Controla visibilidade do modal
 * @param {Object|null} props.image — Objeto da imagem selecionada
 * @param {Function} props.onClose — Callback ao fechar o modal
 */
export default function ImageModal({ visible, image, onClose }) {
  const [baixando, setBaixando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [acaoAtual, setAcaoAtual] = useState('');
  const [imagemCarregada, setImagemCarregada] = useState(false);

  // Animação de entrada do modal
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setImagemCarregada(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setProgresso(0);
      setAcaoAtual('');
    }
  }, [visible]);

  if (!image) return null;

  /**
   * Compartilha a imagem via share sheet nativo
   */
  async function handleCompartilhar() {
    if (baixando || salvando) return;

    try {
      setBaixando(true);
      setAcaoAtual('Baixando imagem...');
      setProgresso(0);

      await compartilharImagem(image.url, (p) => {
        setProgresso(p);
        if (p > 0.5) setAcaoAtual('Preparando para compartilhar...');
      });

      setAcaoAtual('');
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    } finally {
      setBaixando(false);
      setProgresso(0);
      setAcaoAtual('');
    }
  }

  /**
   * Compartilha diretamente no WhatsApp
   */
  async function handleWhatsApp() {
    if (baixando || salvando) return;

    try {
      setBaixando(true);
      setAcaoAtual('Baixando para o WhatsApp...');
      setProgresso(0);

      await compartilharNoWhatsApp(image.url, (p) => {
        setProgresso(p);
        if (p > 0.5) setAcaoAtual('Abrindo WhatsApp...');
      });

    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    } finally {
      setBaixando(false);
      setProgresso(0);
      setAcaoAtual('');
    }
  }

  /**
   * Salva a imagem na galeria do dispositivo
   */
  async function handleSalvar() {
    if (baixando || salvando) return;

    try {
      setSalvando(true);
      setAcaoAtual('Salvando na galeria...');
      setProgresso(0);

      const salvo = await salvarNaGaleria(image.url, (p) => {
        setProgresso(p);
      });

      if (salvo) {
        Alert.alert(
          '✅ Salvo!',
          'Imagem salva no álbum "BomDia Share" da sua galeria.',
          [{ text: 'Ótimo!' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', error.message, [{ text: 'OK' }]);
    } finally {
      setSalvando(false);
      setProgresso(0);
      setAcaoAtual('');
    }
  }

  const emCarregamento = baixando || salvando;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Botão fechar no topo */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botaoFechar}
            onPress={onClose}
            disabled={emCarregamento}
          >
            <Ionicons name="close" size={24} color={COLORS.branco} />
          </TouchableOpacity>

          <Text style={styles.headerTitulo} numberOfLines={1}>
            {image.title || 'Imagem'}
          </Text>

          {/* Espaço para alinhar o título */}
          <View style={styles.botaoFechar} />
        </View>

        {/* Container da imagem */}
        <View style={styles.imagemContainer}>
          {/* Spinner enquanto a imagem carrega */}
          {!imagemCarregada && (
            <ActivityIndicator
              size="large"
              color={COLORS.verde}
              style={StyleSheet.absoluteFill}
            />
          )}

          <Image
            source={{ uri: image.url }}
            style={styles.imagem}
            resizeMode="contain"
            onLoad={() => setImagemCarregada(true)}
          />
        </View>

        {/* Barra de progresso */}
        {emCarregamento && progresso > 0 && (
          <View style={styles.progressoContainer}>
            <View style={[styles.progressoBarra, { width: `${progresso * 100}%` }]} />
          </View>
        )}

        {/* Mensagem de ação atual */}
        {acaoAtual ? (
          <Text style={styles.acaoTexto}>{acaoAtual}</Text>
        ) : null}

        {/* Botões de ação */}
        <View style={styles.botoesContainer}>
          {/* Botão WhatsApp (destaque) */}
          <TouchableOpacity
            style={[styles.botaoPrincipal, emCarregamento && styles.botaoDisabled]}
            onPress={handleWhatsApp}
            disabled={emCarregamento}
            activeOpacity={0.8}
          >
            {emCarregamento && baixando ? (
              <ActivityIndicator size="small" color={COLORS.branco} />
            ) : (
              <Ionicons name="logo-whatsapp" size={22} color={COLORS.branco} />
            )}
            <Text style={styles.botaoPrincipalTexto}>
              {baixando ? 'Aguarde...' : 'Enviar no WhatsApp'}
            </Text>
          </TouchableOpacity>

          {/* Botões secundários */}
          <View style={styles.botoesSecundarios}>
            {/* Compartilhar (share sheet genérico) */}
            <TouchableOpacity
              style={[styles.botaoSecundario, emCarregamento && styles.botaoDisabled]}
              onPress={handleCompartilhar}
              disabled={emCarregamento}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color={COLORS.verde} />
              <Text style={styles.botaoSecundarioTexto}>Compartilhar</Text>
            </TouchableOpacity>

            {/* Salvar na galeria */}
            <TouchableOpacity
              style={[styles.botaoSecundario, emCarregamento && styles.botaoDisabled]}
              onPress={handleSalvar}
              disabled={emCarregamento}
              activeOpacity={0.8}
            >
              {salvando ? (
                <ActivityIndicator size="small" color={COLORS.verde} />
              ) : (
                <Ionicons name="download-outline" size={20} color={COLORS.verde} />
              )}
              <Text style={styles.botaoSecundarioTexto}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitulo: {
    flex: 1,
    fontSize: 15,
    color: COLORS.branco,
    textAlign: 'center',
    marginHorizontal: 8,
    opacity: 0.9,
  },
  botaoFechar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  imagem: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 12,
  },
  progressoContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressoBarra: {
    height: '100%',
    backgroundColor: COLORS.verde,
    borderRadius: 2,
  },
  acaoTexto: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  botoesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  botaoPrincipal: {
    backgroundColor: COLORS.verde,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    // Sombra
    shadowColor: COLORS.verde,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  botaoPrincipalTexto: {
    color: COLORS.branco,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  botoesSecundarios: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoSecundario: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 7,
  },
  botaoSecundarioTexto: {
    color: COLORS.branco,
    fontSize: 14,
    fontWeight: '500',
  },
  botaoDisabled: {
    opacity: 0.5,
  },
});
