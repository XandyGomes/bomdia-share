<div align="center">

# ☀️ BomDia Share

**App mobile para buscar e compartilhar imagens de bom dia, boa tarde, boa noite, motivação, fé e amor direto no WhatsApp — como imagem real, com frase gerada por IA quando a foto não tem texto.**

React Native · Expo SDK 54 · EAS Build

[Funcionalidades](#-funcionalidades) · [Arquitetura](#-arquitetura) · [Como rodar](#-como-rodar) · [Stack técnica](#-stack-técnica)

</div>

---

## 📱 Sobre o projeto

A maioria dos apps desse nicho depende de uma única fonte de imagens (geralmente uma API paga) e para de funcionar assim que ela muda ou fica indisponível. O BomDia Share foi construído pra ser resiliente: combina três fontes de imagem diferentes, se recupera sozinho quando uma delas falha, mantém um histórico local pra nunca reenviar a mesma imagem duas vezes, e usa IA generativa pra criar uma frase na hora quando a foto escolhida não tem nenhum texto — tudo isso rodando 100% no cliente, sem backend próprio.

## ✨ Funcionalidades

- **Busca combinada e resiliente** — DuckDuckGo Images + Bing Images (scraping não-oficial, sem chave) mescladas e deduplicadas por URL, com a API do Pexels entrando como reforço automático só quando as duas primeiras não trazem imagens suficientes. Se uma fonte quebrar (mudança de formato, rate limit), as outras continuam sozinhas.
- **Frase gerada por IA sobre a foto** — imagens de banco de imagens (Pexels) não vêm com texto, então o app usa o Google Gemini pra escrever uma frase curta e original na hora, com prompt que varia o estilo a cada chamada (evita a IA cair sempre no mesmo clichê). A frase é composta visualmente sobre a foto (`react-native-view-shot`) virando uma imagem só antes de enviar — com um banco de frases prontas como reserva caso a IA falhe ou não esteja configurada.
- **Categorias rápidas** — bom dia, boa tarde, boa noite, motivação, fé e amor, com detecção automática da categoria certa pela hora do dia ao abrir o app.
- **Histórico de compartilhamento** — imagens já enviadas somem da busca automaticamente (persistido localmente), evitando repetição sem o usuário perceber. Toggle no cabeçalho pra revelar ou ocultar o que já foi enviado.
- **Compartilhamento nativo** — toque abre o preview fullscreen, toque-e-segure envia direto pro WhatsApp; salvar na galeria em um álbum próprio; FAB reenvia a última imagem com um toque.
- **Feedback tátil e animações** em todas as interações principais (`expo-haptics`).

## 🏗️ Arquitetura

### Busca de imagens

```
HomeScreen ──▶ imageSearch.js (orquestrador)
                    │
                    ├──▶ sources/ddgSource.js    (DuckDuckGo, scraping)
                    ├──▶ sources/bingSource.js   (Bing, scraping)
                    └──▶ sources/pexelsSource.js (API oficial, reforço)
```

Cada fonte é um módulo isolado porque scrapers não-oficiais quebram sozinhos com o tempo (mudança de markup, token, rate limit) — isolar facilita consertar uma sem arriscar as outras. O orquestrador busca DDG+Bing em paralelo, deduplica por URL normalizada e só aciona o Pexels quando uma rodada inteira de DDG+Bing não traz **nenhum item novo** (não basta a fonte "dizer" que tem mais — se na prática só devolve duplicata, o app trata como esgotada e cai pro reforço). Um erro de rede lançado por qualquer fonte nunca derruba a busca inteira; só é reportado como falha real se todas as fontes vierem vazias na primeira página.

### Frase sobre a foto

```
ImageModal ──▶ geminiPhrase.js (Gemini, prompt com estilo sorteado)
                    │  (falha ou sem chave)
                    ▼
              constants/frases.js (banco fixo local, fallback)
```

A imagem final (foto + frase) é composta em tempo real com `react-native-view-shot`: a mesma `View` que o usuário vê no preview é capturada como um único arquivo `.jpg` antes de compartilhar/salvar — sem re-render separado, garantindo que o que aparece na tela é exatamente o que é enviado.

### Persistência

Histórico de compartilhamento e preferências ficam em `AsyncStorage`, local ao dispositivo — sem backend, sem conta de usuário.

## 🚀 Como rodar

### Pré-requisitos

| Requisito | Versão |
|---|---|
| Node.js | 18.x ou superior |
| npm | 9+ |
| Expo Go | no celular, **apenas** pra testar sem a funcionalidade de frase sobre a foto (veja nota abaixo) |

### Passo a passo

```bash
git clone https://github.com/XandyGomes/bomdia-share.git
cd bomdia-share
npm install
npx expo start
```

Escaneie o QR Code com o app **Expo Go** (Android) ou a **Câmera** (iOS). Não é necessária nenhuma chave de API pra rodar — DuckDuckGo e Bing funcionam sem cadastro.

> ⚠️ **Sobre o Expo Go:** a composição de frase sobre a foto usa `react-native-view-shot`, um módulo nativo que não está disponível no binário pré-compilado do Expo Go. Pra testar essa funcionalidade específica é preciso gerar um build de desenvolvimento/preview com EAS (veja abaixo) — o resto do app funciona normalmente no Expo Go.

### Gerar um APK (EAS Build)

```bash
npx eas-cli build -p android --profile preview
```

O link de download (e QR code) aparecem no terminal ao final do build. O `eas.json` já vem configurado com o profile `preview` gerando `.apk` de instalação direta (sem passar pela Play Store).

## ⚙️ Configuração opcional (Pexels + Gemini)

Sem nenhuma chave configurada, o app funciona: busca via DDG+Bing e frases do banco fixo local. As duas integrações abaixo são reforços opcionais.

| Serviço | Uso | Onde criar a chave |
|---|---|---|
| **Pexels** | Fotos de reforço quando DDG+Bing não bastam | [pexels.com/api](https://www.pexels.com/api/) (grátis, aprovação imediata) |
| **Google Gemini** | Gera frases originais sob demanda | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (grátis) |

Pra habilitar, copie `.env.example` para `.env` e preencha:

```
EXPO_PUBLIC_PEXELS_API_KEY=sua_chave_aqui
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
```

O `.env` nunca é versionado (está no `.gitignore`). Pra builds na nuvem via EAS, as mesmas variáveis precisam ser cadastradas no ambiente do projeto:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_PEXELS_API_KEY --value SUA_CHAVE --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_GEMINI_API_KEY --value SUA_CHAVE --environment preview --visibility plaintext
```

## 📁 Estrutura do projeto

```
bomdia-share/
├── App.js                        # Entrada principal, configuração de navegação
├── app.json                      # Configuração do Expo (ícone, splash, permissões)
├── eas.json                      # Perfis de build (development/preview/production)
├── .env.example                  # Modelo de variáveis de ambiente
├── assets/                       # Ícones e splash screen
└── src/
    ├── config/
    │   └── api.js                # Paginação, timeout, chaves do Pexels/Gemini (via env)
    ├── constants/
    │   ├── categorias.js         # Categorias dos chips rápidos
    │   └── frases.js             # Banco de frases fixo (fallback da IA)
    ├── screens/
    │   ├── HomeScreen.js         # Tela principal (chips + busca + grid)
    │   └── ImageModal.js         # Preview fullscreen, overlay de frase e compartilhamento
    ├── components/
    │   ├── CategoryChips.js      # Chips de categoria rápida
    │   ├── SearchBar.js          # Barra de busca
    │   ├── ImageGrid.js          # Grade 2 colunas com paginação infinita
    │   └── ImageCard.js          # Card individual com skeleton loading
    ├── services/
    │   ├── imageSearch.js        # Orquestrador: mescla e deduplica as 3 fontes
    │   ├── sources/
    │   │   ├── ddgSource.js      # DuckDuckGo Images
    │   │   ├── bingSource.js     # Bing Images
    │   │   └── pexelsSource.js   # Pexels (reforço opcional)
    │   ├── geminiPhrase.js       # Geração de frase sob demanda via Gemini
    │   ├── sharedHistory.js      # Histórico local de compartilhamento
    │   └── shareImage.js         # Download + compartilhamento + galeria
    └── utils/
        ├── timeGreeting.js       # Detecta hora e retorna saudação/categoria
        └── url.js                # Normalização de URL para deduplicação
```

## 🧰 Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navegação | React Navigation (stack) |
| Busca de imagens | Scraping (DuckDuckGo, Bing) + REST (Pexels), via `axios` |
| IA generativa | Google Gemini (`gemini-flash-latest`, REST) |
| Composição de imagem | `react-native-view-shot` |
| Persistência local | `@react-native-async-storage/async-storage` |
| Mídia nativa | `expo-sharing`, `expo-media-library`, `expo-file-system` |
| UX | `expo-linear-gradient`, `expo-haptics`, animações com `Animated` |
| Build/distribuição | EAS Build (perfil `preview`, APK de instalação direta) |

## 🔒 Permissões

| Permissão | Motivo | Obrigatória? |
|---|---|---|
| Galeria (leitura/escrita) | Salvar imagens no álbum "BomDia Share" | Opcional |
| Internet | Buscar/baixar imagens e chamar as APIs de IA | Sim |

O compartilhamento via WhatsApp funciona mesmo sem permissão de galeria, pois usa o diretório de cache temporário do app.

## 🐛 Solução de problemas

**Nenhuma imagem aparece na busca**
Verifique sua conexão. Se uma fonte (DDG ou Bing) mudar de formato, a busca continua funcionando pela outra automaticamente — só falha de verdade se todas vierem vazias na primeira página.

**Poucas imagens, sempre parecidas**
Pode ser o histórico ocultando o que você já compartilhou. Toque no ícone de olho no cabeçalho pra revelar.

**Frase da IA vem genérica ou repetida**
Confirme que `EXPO_PUBLIC_GEMINI_API_KEY` está configurada (local e/ou no ambiente do EAS). Sem chave, o app usa o banco de frases fixo silenciosamente.

**WhatsApp não aparece no share sheet**
Verifique se o WhatsApp está instalado; no iOS ele precisa estar configurado pra aceitar compartilhamentos de outros apps.

## 🗺️ Roadmap

- [x] Busca combinada com múltiplas fontes e fallback automático
- [x] Categorias rápidas com detecção por hora do dia
- [x] Histórico de compartilhamento
- [x] Frase gerada por IA sobre a foto
- [ ] Favoritos locais
- [ ] Modo escuro
- [ ] Widget para tela inicial

## 📄 Licença

MIT — use, modifique e distribua livremente.

<details>
<summary>Ver texto completo da licença</summary>

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

</details>

---

<div align="center">

Feito com ☀️ por [Xandy Gomes](https://github.com/XandyGomes)

</div>
