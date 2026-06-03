/**
 * App.js — Ponto de entrada do BomDia Share
 * Configura a navegação principal do aplicativo
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// Importa as telas
import HomeScreen from './src/screens/HomeScreen';

// Cria o navegador de pilha
const Stack = createStackNavigator();

export default function App() {
  return (
    // GestureHandlerRootView necessário para react-native-gesture-handler
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            // Remove o header padrão — a HomeScreen tem seu próprio header
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
