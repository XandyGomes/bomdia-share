/**
 * src/components/CategoryChips.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Chips horizontais de categorias rápidas (bom dia, boa tarde, motivação...)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const COLORS = {
  verde: '#25D366',
  verdeDark: '#128C7E',
  cinzaClaro: '#F0F2F1',
  texto: '#212121',
  branco: '#FFFFFF',
};

/**
 * @param {Object} props
 * @param {Array} props.categorias — Lista de { id, label, emoji, termo }
 * @param {string|null} props.categoriaAtivaId — id da categoria selecionada
 * @param {Function} props.onSelecionar — Callback(categoria)
 */
export default function CategoryChips({ categorias, categoriaAtivaId, onSelecionar }) {
  function handlePress(categoria) {
    Haptics.selectionAsync();
    onSelecionar(categoria);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {categorias.map((categoria) => {
        const ativa = categoria.id === categoriaAtivaId;
        return (
          <TouchableOpacity
            key={categoria.id}
            style={[styles.chip, ativa && styles.chipAtivo]}
            onPress={() => handlePress(categoria)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{categoria.emoji}</Text>
            <Text style={[styles.label, ativa && styles.labelAtivo]}>
              {categoria.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 52,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cinzaClaro,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipAtivo: {
    backgroundColor: COLORS.verde,
    borderColor: COLORS.verdeDark,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.texto,
  },
  labelAtivo: {
    color: COLORS.branco,
  },
});
