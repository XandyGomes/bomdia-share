/**
 * src/services/shareImage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Serviço de download e compartilhamento — Expo SDK 54
 * IMPORTANTE: usa "expo-file-system/legacy" pois a API principal mudou no SDK 54
 * ─────────────────────────────────────────────────────────────────────────────
 */

// SDK 54: importar do módulo legacy para manter compatibilidade da API antiga
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

function gerarNomeArquivo(imageUrl) {
  const timestamp = Date.now();
  const ext = imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1]?.toLowerCase() || 'jpg';
  return `bomdia_${timestamp}.${ext}`;
}

/**
 * Baixa uma imagem para o cache local
 * @param {string} imageUrl
 * @param {Function} onProgress  (0..1)
 * @returns {Promise<string>} URI local
 */
export async function downloadImagem(imageUrl, onProgress = null) {
  const nomeArquivo = gerarNomeArquivo(imageUrl);
  const caminhoLocal = FileSystem.cacheDirectory + nomeArquivo;

  try {
    // Verifica cache
    const info = await FileSystem.getInfoAsync(caminhoLocal);
    if (info.exists && info.size > 0) {
      if (onProgress) onProgress(1);
      return caminhoLocal;
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      imageUrl,
      caminhoLocal,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36',
        },
      },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (onProgress && totalBytesExpectedToWrite > 0) {
          onProgress(totalBytesWritten / totalBytesExpectedToWrite);
        }
      }
    );

    const resultado = await downloadResumable.downloadAsync();

    if (!resultado?.uri) {
      throw new Error('Download falhou — URI vazia');
    }

    if (onProgress) onProgress(1);
    return resultado.uri;

  } catch (err) {
    // Limpa arquivo corrompido
    try {
      const info = await FileSystem.getInfoAsync(caminhoLocal);
      if (info.exists) await FileSystem.deleteAsync(caminhoLocal, { idempotent: true });
    } catch (_) {}

    throw new Error(
      'Não foi possível baixar a imagem. Verifique sua conexão e tente outra.'
    );
  }
}

/**
 * Compartilha imagem via sheet nativo — abre WhatsApp, Instagram, etc.
 */
export async function compartilharImagem(imagemUrl, onProgress = null) {
  const disponivel = await Sharing.isAvailableAsync();
  if (!disponivel) {
    Alert.alert(
      'Indisponível',
      'Seu dispositivo não suporta compartilhamento de arquivos.',
      [{ text: 'OK' }]
    );
    return false;
  }

  const uri = await downloadImagem(imagemUrl, onProgress);

  await Sharing.shareAsync(uri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Compartilhar mensagem',
    UTI: 'public.jpeg',
  });

  return true;
}

/**
 * Abre o share sheet para compartilhar no WhatsApp (ou qualquer app)
 */
export async function compartilharNoWhatsApp(imagemUrl, onProgress = null) {
  return compartilharImagem(imagemUrl, onProgress);
}

/**
 * Salva imagem na galeria do dispositivo
 */
export async function salvarNaGaleria(imagemUrl, onProgress = null) {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Vá em Configurações e permita o acesso à galeria para salvar imagens.',
      [{ text: 'OK' }]
    );
    return false;
  }

  const uri = await downloadImagem(imagemUrl, onProgress);
  const asset = await MediaLibrary.createAssetAsync(uri);

  try {
    const album = await MediaLibrary.getAlbumAsync('BomDia Share');
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync('BomDia Share', asset, false);
    }
  } catch (_) {
    // Imagem já salva na galeria principal
  }

  return true;
}
