# C-Cube

<div align="center">

**C-Cube** — jogo de Cubo Mágico 3D, interativo e sem distrações.

*React · Three.js · Capacitor (Android) · Electron (PC)*

</div>

---

## Sobre

O C-Cube é um jogo de cubo mágico (2×2, 3×3 e 4×4) com gestos diretos: **arrasta sobre a peça
na direção em que queres rodar a camada**. Fora do cubo, arrastar orbita a câmara. Tudo com
animações suaves, efeitos sonoros discretos, vibração (Android), temas visuais, cronómetro e
recordes guardados no dispositivo.

## Funcionalidades

- **Cubo 3D real** (Three.js) com peças arredondadas, adesivos texturizados e sombras suaves
- **Gestos naturais** — roda camadas arrastando sobre a peça; orbita e faz zoom livremente
- **Animações fluidas** — easing em todas as rotações, flutuação no menu, pulso de vitória
- **Tamanhos** 2×2, 3×3 e 4×4 (com movimentos de camadas largas nos grandes)
- **Embaralhar** com notação SiGN visível e **Resolver** passo a passo (reverte o histórico)
- **Desfazer / Refazer / Reiniciar** ilimitados
- **Cronómetro e contador de movimentos** — o tempo começa no teu primeiro movimento
- **Recordes** por tamanho, guardados no dispositivo (localStorage)
- **4 temas**: Clássico, Neon (adesivos brilhantes), Pastel e Carbono
- **Som sintetizado** (WebAudio, sem ficheiros) e **vibração** — ambos desativáveis
- **Teclado no PC**: `U D L R F B` (com `Shift` para o movimento inverso)
- Instalável como **app Android** (Capacitor) e **app de desktop** (Electron)

## Controlos

| Ação | Rato / toque | Teclado |
| --- | --- | --- |
| Rodar camada | Arrastar sobre o cubo | `U` `D` `L` `R` `F` `B` (+`Shift` = inverso) |
| Orbitar câmara | Arrastar fora do cubo | — |
| Zoom | Pinça / roda do rato | — |
| Embaralhar / Resolver / Desfazer / Refazer / Reiniciar | Barra inferior | — |

## Estrutura

```
src/
  app/                  # Next.js (App Router)
  components/game/      # Cena 3D, HUD, menu, ecrãs de vitória/ajuda/definições
  lib/cube/
    engine.ts           # Matemática do cubo (matrizes inteiras exatas, notação, scramble)
    cube-view.ts        # Renderizador three.js, fila de animações, gestos
    themes.ts           # Temas visuais
  lib/sound.ts          # Efeitos sonoros sintetizados (WebAudio)
  store/game.ts         # Estado do jogo (zustand)
electron/               # Processo principal do Electron (servidor estático embutido)
android/                # Projeto nativo Capacitor (com.carsaimz.cube)
```

## Requisitos

- Node.js 20+ (ou Bun 1.2+)
- Para Android: Android Studio + JDK 17
- Para PC: os binários do Electron são instalados com `npm install`

## Correr em desenvolvimento (web)

```bash
npm install
npm run dev          # http://localhost:3000
```

## Android (Capacitor)

```bash
npm run build:static     # exportação estática do Next para .next-static/
npx cap sync android     # copia os assets para o projeto nativo
npx cap open android     # abre no Android Studio → Run
```

Para gerar um APK de testes diretamente:

```bash
cd android && ./gradlew assembleDebug
# APK em android/app/build/outputs/apk/debug/
```

## PC (Electron)

```bash
npm run electron:dev     # desenvolvimento (Next dev + Electron)
npm run electron:start   # janela com a build estática
npm run electron:build   # instaladores (NSIS/AppImage/DMG) em release/
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento web |
| `npm run lint` | ESLint |
| `npm run build:static` | Exportação estática (usada por Android/Electron) |
| `npm run cap:sync` | Build estática + sincroniza com os projetos nativos |
| `npm run electron:dev` | Electron em desenvolvimento |
| `npm run electron:build` | Empacotamento para Windows/Linux/macOS |

## Licença

[MIT](LICENSE) © carsaimz
