# 🌅 BomDia Share

> Encontre e compartilhe imagens de bom dia, boa tarde, boa noite e mensagens motivacionais diretamente no WhatsApp, em segundos!

---

## 📱 Sobre o App

O **BomDia Share** é um aplicativo mobile desenvolvido em React Native (Expo) que permite:

- 🔍 **Buscar imagens** motivacionais e de saudação da internet
- ⏰ **Detecção automática** da hora do dia (bom dia / boa tarde / boa noite)
- 📤 **Compartilhar diretamente** no WhatsApp como imagem real (não como link!)
- 💾 **Salvar na galeria** do seu dispositivo
- 🖼️ **Preview fullscreen** antes de compartilhar

---

## 🛠️ Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 18.x ou superior |
| npm ou yarn | npm 9+ |
| Expo CLI | `npx expo` (sem instalação global) |
| Expo Go App | No seu celular (Android ou iOS) |

---

## 🚀 Instalação

### 1. Clone ou baixe o projeto

```bash
# Se tiver Git:
git clone https://github.com/XandyGomes/bomdia-share.git
cd bomdia-share

# Ou simplesmente entre na pasta do projeto:
cd bomdia-share
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Pronto! Não precisa de API Key

A busca de imagens usa a API não-oficial de imagens do **DuckDuckGo**, que não exige cadastro, chave ou cota diária. Configurações opcionais (itens por página, timeout de busca) ficam em `src/config/api.js`.

---

## ▶️ Como Rodar

### No seu celular físico (recomendado)

```bash
# Inicia o servidor de desenvolvimento
npx expo start

# Escaneie o QR Code com:
# - Android: App Expo Go
# - iOS: Câmera nativa do iPhone
```

### No emulador Android

```bash
npx expo start --android
```

> Requer Android Studio com um emulador configurado.

### No simulador iOS (apenas Mac)

```bash
npx expo start --ios
```

> Requer Xcode instalado.

---

## 📁 Estrutura do Projeto

```
bomdia-share/
├── App.js                      # Entrada principal, configuração de navegação
├── app.json                    # Configuração do Expo (ícone, splash, permissões)
├── package.json                # Dependências
├── babel.config.js             # Configuração do Babel
├── assets/                     # Ícones e splash screen
└── src/
    ├── config/
    │   └── api.js              # Configurações gerais (itens por página, timeout)
    ├── screens/
    │   ├── HomeScreen.js       # Tela principal (busca + grid)
    │   └── ImageModal.js       # Modal de preview e compartilhamento
    ├── components/
    │   ├── SearchBar.js        # Barra de busca com lupa
    │   ├── ImageGrid.js        # Grade 2 colunas com FlatList
    │   └── ImageCard.js        # Card individual com skeleton
    ├── services/
    │   ├── imageSearch.js      # Busca de imagens via DuckDuckGo Images (sem API key)
    │   └── shareImage.js       # Download + compartilhamento + galeria
    └── utils/
        └── timeGreeting.js     # Detecta hora e retorna saudação
```

---

## 🎨 Funcionalidades em Detalhes

### Busca Automática por Hora
| Horário | Busca automática |
|---------|-----------------|
| 05h – 11h59 | "bom dia mensagem motivacional" |
| 12h – 17h59 | "boa tarde mensagem motivacional" |
| 18h – 04h59 | "boa noite mensagem motivacional" |

### Modos de Compartilhamento
| Ação | Resultado |
|------|-----------|
| **Toque na imagem** | Abre modal fullscreen |
| **Toque longo** | Compartilha diretamente (sem abrir modal) |
| **Botão "Enviar no WhatsApp"** | Abre share sheet com imagem anexada |
| **Botão "Compartilhar"** | Share sheet genérico (qualquer app) |
| **Botão "Salvar"** | Salva no álbum "BomDia Share" da galeria |
| **FAB (botão verde flutuante)** | Recompartilha o último item |

---

## 🐛 Solução de Problemas

### Nenhuma imagem aparece na busca
- Verifique sua conexão com a internet
- O DuckDuckGo pode alterar seu formato de resposta ocasionalmente. Se as buscas pararem de retornar resultados, verifique se `src/services/imageSearch.js` ainda extrai o token `vqd` corretamente

### WhatsApp não aparece no share sheet
- Verifique se o WhatsApp está instalado no dispositivo
- No iOS, o WhatsApp precisa ter sido configurado para aceitar compartilhamentos

### Imagem não baixa / erro de rede
- Algumas imagens têm proteção CORS ou requisitos especiais
- Tente compartilhar outra imagem da busca

---

## 🔒 Permissões

| Permissão | Motivo | Obrigatória? |
|-----------|--------|--------------|
| Galeria (leitura) | Salvar imagens | ❌ Opcional |
| Galeria (escrita) | Salvar na galeria | ❌ Opcional |
| Internet | Buscar e baixar imagens | ✅ Sim |

> O compartilhamento via WhatsApp funciona mesmo **sem** permissão de galeria,
> pois usa o diretório de cache temporário do app.

---

## 📦 Dependências Principais

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| expo | ~54.0.0 | Framework base |
| expo-file-system | ~19.0.23 | Download de imagens |
| expo-sharing | ~14.0.8 | Compartilhamento nativo |
| expo-media-library | ~18.2.1 | Salvar na galeria |
| expo-linear-gradient | ~15.0.8 | Gradiente do header |
| @react-navigation/native | ^6.1.18 | Navegação |
| axios | ^1.7.2 | Requisições HTTP |
| @expo/vector-icons | ^15.0.3 | Ícones (Ionicons) |

---

## 📸 Screenshots

| Tela Inicial | Busca | Modal de Compartilhamento |
|---|---|---|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## 🗺️ Roadmap (Futuras Melhorias)

- [ ] Favoritos locais (AsyncStorage)
- [ ] Categorias rápidas (bom dia / boa tarde / boa noite / motivação)
- [ ] Histórico de buscas
- [ ] Modo escuro
- [ ] Frases geradas por IA
- [ ] Widget para tela inicial

---

## 📄 Licença

MIT License: use, modifique e distribua livremente.

```
MIT License

Copyright (c) 2024 BomDia Share

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Feito com ☀️ e 💚 para o Brasil.
