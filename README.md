# BomDia Share

Aplicativo mobile (React Native + Expo) para buscar e compartilhar imagens de bom dia, boa tarde, boa noite, motivação, fé e amor diretamente no WhatsApp — como imagem real, não como link.

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Como rodar](#como-rodar)
- [Configuração opcional (Pexels)](#configuração-opcional-pexels)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Permissões](#permissões)
- [Solução de problemas](#solução-de-problemas)
- [Roadmap](#roadmap)
- [Licença](#licença)

## Visão geral

O app resolve um problema simples: encontrar rapidamente uma imagem bonita de "bom dia" (ou boa tarde, boa noite, motivação...) e mandar no WhatsApp sem sair do fluxo. Ao abrir, ele já detecta a hora do dia e sugere a categoria certa; chips rápidos deixam trocar de categoria com um toque, e o histórico local garante que você nunca reenvie sem querer uma imagem que já compartilhou.

## Funcionalidades

- **Busca combinada de 3 fontes** — DuckDuckGo Images + Bing Images (sem necessidade de cadastro) mescladas e deduplicadas, com Pexels como reforço opcional quando as duas primeiras não trazem imagens suficientes.
- **Categorias rápidas** — bom dia, boa tarde, boa noite, motivação, fé e amor, com detecção automática da categoria pela hora do dia ao abrir o app.
- **Histórico de compartilhamento** — imagens já enviadas pelo WhatsApp ou pelo share sheet genérico somem da busca automaticamente, evitando repetição. Um toggle no cabeçalho revela ou oculta o que já foi enviado.
- **Compartilhamento direto** — toque para abrir o preview fullscreen, toque e segure para enviar na hora; um FAB reenvia a última imagem compartilhada com um toque.
- **Salvar na galeria** — em um álbum próprio ("BomDia Share"), sem contar como compartilhamento.
- **Feedback tátil (haptics)** e animações refinadas nas principais interações.

## Arquitetura

A busca de imagens é um orquestrador (`src/services/imageSearch.js`) que chama três fontes independentes em `src/services/sources/`:

| Fonte | Tipo | Observação |
|---|---|---|
| DuckDuckGo Images | Scraping não-oficial | Fonte primária, sem chave |
| Bing Images | Scraping não-oficial | Segunda fonte primária, sem chave — mantém volume mesmo se o DDG mudar de formato |
| Pexels | API oficial | Só usada como reforço ("top-up") quando as duas primeiras não enchem a página; requer chave gratuita opcional |

Resultados das três fontes são deduplicados por URL e mesclados num único buffer paginado. Se uma fonte falhar (mudança de formato, rate limit), as outras continuam normalmente — a busca só é reportada como erro se todas falharem na primeira página. Essa separação por módulo existe porque scrapers não-oficiais quebram sozinhos com o tempo; isolar cada um facilita consertar sem afetar as outras fontes.

O histórico de compartilhamento (`src/services/sharedHistory.js`) persiste localmente via `AsyncStorage`, independente da busca.

## Como rodar

### Pré-requisitos

| Requisito | Versão mínima |
|---|---|
| Node.js | 18.x ou superior |
| npm | 9+ |
| Expo Go | instalado no celular (Android ou iOS), para rodar sem build |

### Passo a passo

```bash
git clone https://github.com/XandyGomes/bomdia-share.git
cd bomdia-share
npm install
npx expo start
```

Escaneie o QR Code exibido no terminal com o app **Expo Go** (Android) ou a **Câmera** (iOS). Não é necessária nenhuma chave de API para rodar — DuckDuckGo e Bing funcionam sem cadastro.

Outras formas de rodar:

```bash
npx expo start --android   # emulador Android (requer Android Studio)
npx expo start --ios       # simulador iOS (requer Xcode, apenas macOS)
```

## Configuração opcional (Pexels)

O Pexels só entra como reforço quando DDG + Bing não retornam imagens suficientes para preencher uma página. Sem configurar nada, o app funciona normalmente.

Para habilitar:

1. Crie uma chave gratuita em [pexels.com/api](https://www.pexels.com/api/).
2. Copie `.env.example` para `.env`.
3. Preencha a variável:

   ```
   EXPO_PUBLIC_PEXELS_API_KEY=sua_chave_aqui
   ```

O `.env` nunca é versionado (está no `.gitignore`) — cada pessoa que clonar o projeto mantém sua própria chave local.

## Estrutura do projeto

```
bomdia-share/
├── App.js                        # Entrada principal, configuração de navegação
├── app.json                      # Configuração do Expo (ícone, splash, permissões)
├── .env.example                  # Modelo de variáveis de ambiente
├── assets/                       # Ícones e splash screen
└── src/
    ├── config/
    │   └── api.js                # Paginação, timeout, chave do Pexels (via env)
    ├── constants/
    │   └── categorias.js         # Categorias dos chips rápidos
    ├── screens/
    │   ├── HomeScreen.js         # Tela principal (chips + busca + grid)
    │   └── ImageModal.js         # Preview fullscreen e ações de compartilhamento
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
    │   ├── sharedHistory.js      # Histórico local de compartilhamento
    │   └── shareImage.js         # Download + compartilhamento + galeria
    └── utils/
        ├── timeGreeting.js       # Detecta hora e retorna saudação/categoria
        └── url.js                # Normalização de URL para deduplicação
```

## Permissões

| Permissão | Motivo | Obrigatória? |
|---|---|---|
| Galeria (leitura/escrita) | Salvar imagens no álbum "BomDia Share" | Opcional |
| Internet | Buscar e baixar imagens | Sim |

O compartilhamento via WhatsApp funciona mesmo sem permissão de galeria, pois usa o diretório de cache temporário do app.

## Solução de problemas

**Nenhuma imagem aparece na busca**
Verifique sua conexão com a internet. DDG e Bing podem mudar o formato de resposta ocasionalmente — se isso acontecer, a busca continua funcionando pela outra fonte automaticamente; só falha de verdade se as duas (e o Pexels, se configurado) não retornarem nada. Persistindo, confira `src/services/sources/ddgSource.js` (token `vqd`) e `bingSource.js` (blob `m='{...}'` no HTML do Bing).

**Poucas imagens aparecem, sempre parecem as mesmas**
Pode ser o histórico de compartilhamento ocultando o que você já enviou. Toque no ícone de olho no cabeçalho para revelar as já compartilhadas.

**WhatsApp não aparece no share sheet**
Verifique se o WhatsApp está instalado. No iOS, ele precisa estar configurado para aceitar compartilhamentos de outros apps.

**Imagem não baixa**
Algumas imagens têm proteção especial no servidor de origem — tente compartilhar outra imagem da busca.

## Roadmap

- [x] Categorias rápidas (bom dia / boa tarde / boa noite / motivação / fé / amor)
- [x] Histórico de compartilhamento
- [ ] Favoritos locais
- [ ] Histórico de buscas
- [ ] Modo escuro
- [ ] Frases geradas por IA
- [ ] Widget para tela inicial

## Licença

MIT — use, modifique e distribua livremente. Veja o texto completo abaixo.

<details>
<summary>MIT License</summary>

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
