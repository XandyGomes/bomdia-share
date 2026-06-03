# 🌅 BomDia Share

> Encontre e compartilhe imagens de bom dia, boa tarde, boa noite e mensagens motivacionais diretamente no WhatsApp — em segundos!

![BomDia Share Banner](./assets/banner.png)

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
| Conta Google | Para obter a API Key gratuita |
| Expo Go App | No seu celular (Android ou iOS) |

---

## 🚀 Instalação

### 1. Clone ou baixe o projeto

```bash
# Se tiver Git:
git clone https://github.com/seu-usuario/bomdia-share.git
cd bomdia-share

# Ou simplesmente entre na pasta do projeto:
cd bomdia-share
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a API Key (obrigatório para imagens reais)

> Sem a API Key, o app funciona em **modo demonstração** com imagens aleatórias.

Abra o arquivo `src/config/api.js` e substitua os valores:

```javascript
export const GOOGLE_API_KEY = 'SUA_CHAVE_AQUI';      // ← sua chave
export const SEARCH_ENGINE_ID = 'SEU_CX_AQUI';        // ← seu ID
```

---

## 🔑 Como obter a API Key GRATUITAMENTE

### Passo 1 — Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Criar Projeto"** (ou selecione um existente)
4. Dê um nome como `BomDia Share`

### Passo 2 — Ativar a API

1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Pesquise por: **`Custom Search JSON API`**
3. Clique e depois em **"ATIVAR"**

### Passo 3 — Criar a Chave de API

1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** → **"Chave de API"**
3. Copie a chave gerada (começa com `AIza...`)
4. Cole no arquivo `src/config/api.js` em `GOOGLE_API_KEY`

### Passo 4 — Criar o Mecanismo de Busca (CX)

1. Acesse [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
2. Clique em **"Adicionar"**
3. Em **"Sites para pesquisar"**: marque **"Pesquisar em toda a web"**
4. Em **"Nome do mecanismo"**: escreva `BomDia Search`
5. Clique em **"Criar"**
6. Copie o **"ID do mecanismo de pesquisa"** (CX)
7. Cole no arquivo `src/config/api.js` em `SEARCH_ENGINE_ID`

> ⚠️ **Cota gratuita:** 100 consultas por dia. Cada busca ou página usa 1 cota.
> Para mais, habilite o faturamento no Google Cloud (plano pago).

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
    │   └── api.js              # ⚙️ CONFIGURE AQUI: API Key e Search Engine ID
    ├── screens/
    │   ├── HomeScreen.js       # Tela principal (busca + grid)
    │   └── ImageModal.js       # Modal de preview e compartilhamento
    ├── components/
    │   ├── SearchBar.js        # Barra de busca com lupa
    │   ├── ImageGrid.js        # Grade 2 colunas com FlatList
    │   └── ImageCard.js        # Card individual com skeleton
    ├── services/
    │   ├── imageSearch.js      # Integração Google Custom Search API
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

### App mostra apenas imagens cinzas (modo demo)
- Verifique se editou `src/config/api.js` com suas chaves reais
- Confirme que a `Custom Search JSON API` está **ativada** no Google Cloud
- Teste a chave diretamente: `https://www.googleapis.com/customsearch/v1?key=SUA_CHAVE&cx=SEU_CX&searchType=image&q=teste`

### Erro "Cota excedida" (403)
- A cota gratuita é de 100 consultas/dia
- Aguarde até o dia seguinte ou habilite faturamento

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
| expo | ~51.0.0 | Framework base |
| expo-file-system | ~17.0.1 | Download de imagens |
| expo-sharing | ~12.0.1 | Compartilhamento nativo |
| expo-media-library | ~16.0.3 | Salvar na galeria |
| expo-linear-gradient | ~13.0.2 | Gradiente do header |
| @react-navigation/native | ^6.1.17 | Navegação |
| axios | ^1.7.2 | Requisições HTTP |
| @expo/vector-icons | ^14.0.2 | Ícones (Ionicons) |

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

MIT License — use, modifique e distribua livremente.

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
