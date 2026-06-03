/**
 * src/components/SearchBar.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de barra de busca com ícone de lupa e botão limpar
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Cores do tema
const COLORS = {
  verde: '#25D366',      // Verde WhatsApp
  verdeDark: '#1DA851', // Verde escuro
  cinzaClaro: '#F5F5F5',
  cinzaMedio: '#E0E0E0',
  cinzaTexto: '#757575',
  texto: '#212121',
  branco: '#FFFFFF',
};

/**
 * @param {Object} props
 * @param {string} props.value — Texto atual da busca
 * @param {Function} props.onChangeText — Callback ao digitar
 * @param {Function} props.onSubmit — Callback ao pressionar buscar
 * @param {boolean} props.loading — Exibe spinner quando carregando
 */
export default function SearchBar({ value, onChangeText, onSubmit, loading }) {
  const inputRef = useRef(null);

  // Limpa o campo e foca novamente
  function handleLimpar() {
    onChangeText('');
    inputRef.current?.focus();
  }

  // Dispara a busca e fecha o teclado
  function handleBuscar() {
    Keyboard.dismiss();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  }

  return (
    <View style={styles.container}>
      {/* Ícone de lupa */}
      <Ionicons
        name="search"
        size={20}
        color={COLORS.cinzaTexto}
        style={styles.iconeLupa}
      />

      {/* Campo de texto */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="buscar imagens (ex: bom dia, motivação...)"
        placeholderTextColor={COLORS.cinzaTexto}
        returnKeyType="search"
        onSubmitEditing={handleBuscar}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never" // Usamos nosso próprio botão limpar
      />

      {/* Botão limpar (X) — visível quando há texto */}
      {value.length > 0 && !loading && (
        <TouchableOpacity
          onPress={handleLimpar}
          style={styles.botaoLimpar}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.cinzaTexto} />
        </TouchableOpacity>
      )}

      {/* Spinner de carregamento */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={COLORS.verde}
          style={styles.spinner}
        />
      )}

      {/* Botão de busca verde */}
      <TouchableOpacity
        style={[styles.botaoBusca, loading && styles.botaoBuscaDisabled]}
        onPress={handleBuscar}
        disabled={loading || !value.trim()}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={18} color={COLORS.branco} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cinzaClaro,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginVertical: 10,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.cinzaMedio,
  },
  iconeLupa: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.texto,
    paddingVertical: 10,
    // Remove outline no web
    outlineStyle: 'none',
  },
  botaoLimpar: {
    padding: 4,
    marginRight: 4,
  },
  spinner: {
    marginRight: 8,
  },
  botaoBusca: {
    backgroundColor: COLORS.verde,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  botaoBuscaDisabled: {
    backgroundColor: COLORS.cinzaMedio,
  },
});
