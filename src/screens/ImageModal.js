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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import { compartilharImagem, compartilharNoWhatsApp, salvarNaGaleria } from '../services/shareImage';
import { marcarComoCompartilhada } from '../services/sharedHistory';
import { getFrasesPorCategoria } from '../constants/frases';

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
 * @param {string|null} props.categoriaAtivaId — Categoria ativa, pra escolher o banco de frases certo
 * @param {Function} props.onClose — Callback ao fechar o modal
 * @param {Function} props.onCompartilhado — Callback quando a imagem é marcada como compartilhada
 */
export default function ImageModal({ visible, image, categoriaAtivaId, onClose, onCompartilhado }) {
  const [baixando, setBaixando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [acaoAtual, setAcaoAtual] = useState('');
  const [imagemCarregada, setImagemCarregada] = useState(false);

  // ── Frase sobre a foto ──────────────────────────────────────────────────────
  const [fraseAtiva, setFraseAtiva] = useState(false);
  const [fraseIndex, setFraseIndex] = useState(0);
  const capturaRef = useRef(null);
  const frases = getFrasesPorCategoria(categoriaAtivaId);
  const fraseTexto = frases[fraseIndex % frases.length];

  // Animação de entrada do modal
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setImagemCarregada(false);
      // Fotos do Pexels não têm texto embutido — liga a frase por padrão.
      // DDG/Bing já vêm com frase própria, então começa desligado.
      setFraseAtiva(image?.source === 'pexels');
      setFraseIndex(0);
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
  }, [visible, image?.id]);

  if (!image) return null;

  function handleToggleFrase() {
    Haptics.selectionAsync();
    setFraseAtiva(prev => !prev);
  }

  function handleEmbaralharFrase() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFraseIndex(prev => prev + 1);
  }

  /**
   * Se a frase estiver ativa, captura a view (foto + frase) como uma imagem
   * só; senão usa a URL original da foto
   */
  async function resolverUriParaCompartilhar() {
    if (!fraseAtiva) return image.url;
    return await captureRef(capturaRef, {
      format: 'jpg',
      quality: 0.92,
      result: 'tmpfile',
    });
  }

  /**
   * Compartilha a imagem via share sheet nativo
   */
  async function handleCompartilhar() {
    if (baixando || salvando) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBaixando(true);
      setAcaoAtual(fraseAtiva ? 'Preparando imagem...' : 'Baixando imagem...');
      setProgresso(0);

      const uriParaEnvio = await resolverUriParaCompartilhar();
      await compartilharImagem(uriParaEnvio, (p) => {
        setProgresso(p);
        if (p > 0.5) setAcaoAtual('Preparando para compartilhar...');
      });

      setAcaoAtual('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await marcarComoCompartilhada(image.url);
      onCompartilhado?.(image.url);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setBaixando(true);
      setAcaoAtual(fraseAtiva ? 'Preparando imagem...' : 'Baixando para o WhatsApp...');
      setProgresso(0);

      const uriParaEnvio = await resolverUriParaCompartilhar();
      await compartilharNoWhatsApp(uriParaEnvio, (p) => {
        setProgresso(p);
        if (p > 0.5) setAcaoAtual('Abrindo WhatsApp...');
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await marcarComoCompartilhada(image.url);
      onCompartilhado?.(image.url);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSalvando(true);
      setAcaoAtual(fraseAtiva ? 'Preparando imagem...' : 'Salvando na galeria...');
      setProgresso(0);

      const uriParaSalvar = await resolverUriParaCompartilhar();
      const salvo = await salvarNaGaleria(uriParaSalvar, (p) => {
        setProgresso(p);
      });

      if (salvo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

          {/* View capturável: foto + frase sobreposta viram uma imagem só */}
          <View ref={capturaRef} collapsable={false} style={styles.imagemCapturavel}>
            <Image
              source={{ uri: image.url }}
              style={styles.imagem}
              resizeMode="contain"
              onLoad={() => setImagemCarregada(true)}
            />

            {fraseAtiva && imagemCarregada && (
              <View style={styles.fraseOverlay} pointerEvents="none">
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  style={styles.fraseTexto}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {fraseTexto}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Controles da frase */}
        <View style={styles.fraseControles}>
          <TouchableOpacity
            style={[styles.fraseChip, fraseAtiva && styles.fraseChipAtivo]}
            onPress={handleToggleFrase}
            disabled={emCarregamento}
            activeOpacity={0.8}
          >
            <Ionicons name="text" size={15} color={COLORS.branco} />
            <Text style={styles.fraseChipTexto}>
              {fraseAtiva ? 'Frase ligada' : 'Adicionar frase'}
            </Text>
          </TouchableOpacity>

          {fraseAtiva && (
            <TouchableOpacity
              style={styles.fraseBotaoTrocar}
              onPress={handleEmbaralharFrase}
              disabled={emCarregamento}
              activeOpacity={0.8}
            >
              <Ionicons name="shuffle" size={18} color={COLORS.branco} />
              <Text style={styles.fraseChipTexto}>Trocar frase</Text>
            </TouchableOpacity>
          )}
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
  imagemCapturavel: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  fraseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 22,
  },
  fraseTexto: {
    color: COLORS.branco,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  fraseControles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  fraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  fraseChipAtivo: {
    backgroundColor: COLORS.verde,
    borderColor: COLORS.verdeDark,
  },
  fraseChipTexto: {
    color: COLORS.branco,
    fontSize: 13,
    fontWeight: '600',
  },
  fraseBotaoTrocar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
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
