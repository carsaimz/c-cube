/**
 * C-Cube — Internacionalização (pt / en / fr / es).
 *
 * Dicionário plano de chaves → texto, com interpolação simples {var}.
 * pt é a língua de origem e serve de fallback para as restantes.
 */

export type Locale = "pt" | "en" | "fr" | "es";

export const LOCALES: { id: Locale; label: string }[] = [
  { id: "pt", label: "Português" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
];

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

type Dict = Record<string, string>;

const pt: Dict = {
  "app.title": "C-Cube — Cubo Mágico 3D",
  "app.tagline": "Cubo Mágico 3D — arrasta, gira, resolve",

  // HUD
  "hud.memorize": "Memoriza {s}s",
  "aria.soundOff": "Desativar som",
  "aria.soundOn": "Ativar som",
  "aria.help": "Ajuda",
  "aria.settings": "Definições",
  "aria.back": "Voltar ao menu",
  "busy.scrambling": "A embaralhar…",
  "busy.solving": "A resolver…",

  // Dock + botões flutuantes
  "dock.scramble": "Embaralhar",
  "dock.solve": "Resolver",
  "dock.undo": "Desfazer",
  "dock.redo": "Refazer",
  "dock.reset": "Reiniciar",
  "float.peek": "Espiar cores (+5 segundos)",
  "float.peekShort": "Espiar cores (+5 s)",
  "float.recenter": "Recentrar câmara e repor zoom",
  "float.recenterTitle": "Recentrar câmara (duplo clique no fundo)",

  // Menu
  "section.size": "Tamanho",
  "section.difficulty": "Dificuldade",
  "section.mode": "Modo",
  "group.size": "Tamanho do cubo",
  "group.difficulty": "Dificuldade",
  "group.mode": "Modo de jogo",
  "group.theme": "Tema",

  "diff.easy": "Fácil",
  "diff.normal": "Normal",
  "diff.hard": "Difícil",
  "diff.extreme": "Extremo",

  "mode.classic.name": "Clássico",
  "mode.classic.desc": "Resolve ao teu ritmo, cronómetro a contar.",
  "mode.sprint.name": "Sprint",
  "mode.sprint.desc": "Contra-relógio — resolve antes de o tempo acabar.",
  "mode.efficiency.name": "Eficiência",
  "mode.efficiency.desc": "Orçamento limitado de movimentos.",
  "mode.marathon.name": "Maratona",
  "mode.marathon.desc": "2×2 → 3×3 → 4×4, tempo acumulado.",
  "mode.memory.name": "Memória",
  "mode.memory.desc": "Memoriza o scramble — depois ficas cego.",

  "theme.classic": "Clássico",
  "theme.neon": "Neon",
  "theme.pastel": "Pastel",
  "theme.carbon": "Carbono",
  "aria.theme": "Tema {name}",

  "rules.classic": "{n} movimentos de embaralhamento",
  "rules.sprint": "Limite: {t}",
  "rules.efficiency": "Orçamento: {n} movimentos",
  "rules.memory": "Memorização: {s}s · espreitar +5s",
  "rules.marathon": "Etapa 1/{n} · tempo acumulado",
  "best.time": "Melhor: {t} · {n} mov.",
  "best.moves": "Melhor: {n} movimentos",
  "best.none": "Sem recorde ainda",
  "action.play": "Jogar",
  "action.start": "Começar a jogar",
  "footer.records": "Os recordes ficam guardados neste dispositivo.",

  // Vitória
  "win.stage": "Etapa {a}/{b}!",
  "win.final": "Maratona concluída!",
  "win.solved": "Resolvido!",
  "win.next": "A seguir: {n}×{n} — o tempo continua a contar.",
  "win.record": "Novo recorde",
  "stat.time": "Tempo",
  "stat.budget": "Orçamento",
  "stat.moves": "Movimentos",
  "stat.best": "Melhor",
  "action.continue": "Continuar",
  "action.playAgain": "Jogar de novo",
  "action.menu": "Menu",

  // Falha
  "fail.time.title": "Tempo esgotado!",
  "fail.time.desc": "O cronómetro chegou a zero antes de terminares.",
  "fail.moves.title": "Sem movimentos!",
  "fail.moves.desc": "Usaste todo o orçamento de movimentos.",
  "action.retry": "Tentar de novo",

  // Ajuda
  "help.title": "Como jogar",
  "help.layer.t": "Rodar uma camada",
  "help.layer.d":
    "Arrasta o dedo (ou o rato) sobre um adesivo na direção em que queres que essa camada gire.",
  "help.orbit.t": "Orbitar a câmara",
  "help.orbit.d":
    "Arrasta fora do cubo para olhar para qualquer ângulo. Usa a pinça (ou a roda do rato) para aproximar.",
  "help.recenter.t": "Recentrar a câmara",
  "help.recenter.d1": "O botão",
  "help.recenter.d2":
    "(canto inferior direito) repõe o cubo ao centro com o zoom padrão. Também podes fazer",
  "help.recenter.d3": "fora do cubo.",
  "help.recenter.dbl": "duplo clique",
  "help.keyboard.t": "Teclado (PC)",
  "help.keyboard.d1": "Teclas",
  "help.keyboard.d2": "rodam as faces. Com",
  "help.keyboard.d3": ", faz o movimento inverso (ex.: R').",
  "help.goal.t": "Objetivo",
  "help.goal.d":
    "Deixa cada face com uma única cor. O cronómetro começa no teu primeiro movimento após o embaralhamento.",
  "help.modes": "Modos de jogo",
  "help.memory.t": "Modo Memória",
  "help.memory.d1":
    "Tens alguns segundos para memorizar o cubo; depois os adesivos ficam cinzentos. O botão",
  "help.memory.d2": "mostra as cores por 2 s — cada espreitadela custa +5 s.",
  "help.memory.peek": "Espiar",
  "help.tip.label": "Dica:",
  "help.tip.d1": "o botão",
  "help.tip.d2":
    "devolve o cubo ao estado resolvido passo a passo — útil para aprender. Usa",
  "help.tip.d3": "para corrigir um movimento.",
  "help.tip.solve": "Resolver",
  "help.tip.undo": "Desfazer",
  "help.difficulty.label": "dificuldade",
  "help.difficulty.d":
    "muda o tamanho do embaralhamento e os limites de tempo/movimentos. Cada combinação de modo + tamanho + dificuldade tem recorde próprio.",

  // Definições
  "settings.title": "Definições",
  "section.theme": "Tema",
  "theme.tag.glow": "Adesivos brilhantes",
  "theme.tag.soft": "Visual suave",
  "settings.sound": "Som",
  "settings.sound.desc": "Efeitos sonoros discretos",
  "settings.haptics": "Vibração",
  "settings.haptics.desc": "Resposta tátil ao rodar (Android)",
  "settings.language": "Idioma",
  "settings.updates": "Atualizações",
  "updates.current": "Versão atual: v{v}",
  "updates.check": "Verificar agora",
  "updates.checking": "A verificar…",
  "updates.upToDate": "Está atualizado ✓",
  "updates.available": "Nova versão disponível: v{v}",
  "updates.error": "Não foi possível verificar",
  "updates.view": "Ver novidades",
  "settings.about": "Sobre",
  "about.version": "versão {v}",

  // Diálogo de atualização
  "upd.title": "Nova versão disponível",
  "upd.subtitle": "C-Cube v{v} está disponível — tens a v{cur}.",
  "upd.notes": "Novidades",
  "upd.download": "Descarregar atualização",
  "upd.page": "Abrir página da versão",
  "upd.later": "Mais tarde",
};

const en: Dict = {
  "app.title": "C-Cube — 3D Magic Cube",
  "app.tagline": "3D magic cube — swipe, twist, solve",

  "hud.memorize": "Memorize {s}s",
  "aria.soundOff": "Mute sound",
  "aria.soundOn": "Unmute sound",
  "aria.help": "Help",
  "aria.settings": "Settings",
  "aria.back": "Back to menu",
  "busy.scrambling": "Scrambling…",
  "busy.solving": "Solving…",

  "dock.scramble": "Scramble",
  "dock.solve": "Solve",
  "dock.undo": "Undo",
  "dock.redo": "Redo",
  "dock.reset": "Restart",
  "float.peek": "Peek colors (+5 seconds)",
  "float.peekShort": "Peek colors (+5 s)",
  "float.recenter": "Recentre camera and reset zoom",
  "float.recenterTitle": "Recentre camera (double-click the background)",

  "section.size": "Size",
  "section.difficulty": "Difficulty",
  "section.mode": "Mode",
  "group.size": "Cube size",
  "group.difficulty": "Difficulty",
  "group.mode": "Game mode",
  "group.theme": "Theme",

  "diff.easy": "Easy",
  "diff.normal": "Normal",
  "diff.hard": "Hard",
  "diff.extreme": "Extreme",

  "mode.classic.name": "Classic",
  "mode.classic.desc": "Solve at your own pace, timer counting up.",
  "mode.sprint.name": "Sprint",
  "mode.sprint.desc": "Race the clock — solve before time runs out.",
  "mode.efficiency.name": "Efficiency",
  "mode.efficiency.desc": "Limited move budget.",
  "mode.marathon.name": "Marathon",
  "mode.marathon.desc": "2×2 → 3×3 → 4×4, cumulative time.",
  "mode.memory.name": "Memory",
  "mode.memory.desc": "Memorize the scramble — then you go blind.",

  "theme.classic": "Classic",
  "theme.neon": "Neon",
  "theme.pastel": "Pastel",
  "theme.carbon": "Carbon",
  "aria.theme": "{name} theme",

  "rules.classic": "{n} scramble moves",
  "rules.sprint": "Limit: {t}",
  "rules.efficiency": "Budget: {n} moves",
  "rules.memory": "Memorization: {s}s · peek +5s",
  "rules.marathon": "Stage 1/{n} · cumulative time",
  "best.time": "Best: {t} · {n} moves",
  "best.moves": "Best: {n} moves",
  "best.none": "No record yet",
  "action.play": "Play",
  "action.start": "Start playing",
  "footer.records": "Records are stored on this device.",

  "win.stage": "Stage {a}/{b}!",
  "win.final": "Marathon complete!",
  "win.solved": "Solved!",
  "win.next": "Next: {n}×{n} — the clock keeps running.",
  "win.record": "New record",
  "stat.time": "Time",
  "stat.budget": "Budget",
  "stat.moves": "Moves",
  "stat.best": "Best",
  "action.continue": "Continue",
  "action.playAgain": "Play again",
  "action.menu": "Menu",

  "fail.time.title": "Time's up!",
  "fail.time.desc": "The clock hit zero before you finished.",
  "fail.moves.title": "Out of moves!",
  "fail.moves.desc": "You used the whole move budget.",
  "action.retry": "Try again",

  "help.title": "How to play",
  "help.layer.t": "Turn a layer",
  "help.layer.d":
    "Swipe (or drag with the mouse) across a sticker in the direction you want that layer to turn.",
  "help.orbit.t": "Orbit the camera",
  "help.orbit.d":
    "Drag outside the cube to look from any angle. Pinch (or mouse wheel) to zoom.",
  "help.recenter.t": "Recentre the camera",
  "help.recenter.d1": "The",
  "help.recenter.d2":
    "button (bottom-right corner) puts the cube back in the centre at the default zoom. You can also",
  "help.recenter.d3": "outside the cube.",
  "help.recenter.dbl": "double-click",
  "help.keyboard.t": "Keyboard (PC)",
  "help.keyboard.d1": "Keys",
  "help.keyboard.d2": "turn the faces. With",
  "help.keyboard.d3": ", do the inverse move (e.g. R').",
  "help.goal.t": "Goal",
  "help.goal.d":
    "Make every face a single colour. The timer starts on your first move after the scramble.",
  "help.modes": "Game modes",
  "help.memory.t": "Memory mode",
  "help.memory.d1":
    "You get a few seconds to memorize the cube; then the stickers turn grey. The",
  "help.memory.d2": "button shows the colours for 2 s — each peek costs +5 s.",
  "help.memory.peek": "Peek",
  "help.tip.label": "Tip:",
  "help.tip.d1": "the",
  "help.tip.d2":
    "button walks the cube back to the solved state step by step — great for learning. Use",
  "help.tip.d3": "to fix a move.",
  "help.tip.solve": "Solve",
  "help.tip.undo": "Undo",
  "help.difficulty.label": "Difficulty",
  "help.difficulty.d":
    "changes the scramble length and the time/move limits. Every mode + size + difficulty combination has its own record.",

  "settings.title": "Settings",
  "section.theme": "Theme",
  "theme.tag.glow": "Glowing stickers",
  "theme.tag.soft": "Soft look",
  "settings.sound": "Sound",
  "settings.sound.desc": "Discreet sound effects",
  "settings.haptics": "Vibration",
  "settings.haptics.desc": "Haptic feedback while turning (Android)",
  "settings.language": "Language",
  "settings.updates": "Updates",
  "updates.current": "Current version: v{v}",
  "updates.check": "Check now",
  "updates.checking": "Checking…",
  "updates.upToDate": "Up to date ✓",
  "updates.available": "New version available: v{v}",
  "updates.error": "Couldn't check",
  "updates.view": "See what's new",
  "settings.about": "About",
  "about.version": "version {v}",

  "upd.title": "New version available",
  "upd.subtitle": "C-Cube v{v} is available — you have v{cur}.",
  "upd.notes": "What's new",
  "upd.download": "Download update",
  "upd.page": "Open release page",
  "upd.later": "Later",
};

const fr: Dict = {
  "app.title": "C-Cube — Cube Magique 3D",
  "app.tagline": "Cube magique 3D — glisse, tourne, résous",

  "hud.memorize": "Mémorise {s}s",
  "aria.soundOff": "Couper le son",
  "aria.soundOn": "Activer le son",
  "aria.help": "Aide",
  "aria.settings": "Paramètres",
  "aria.back": "Retour au menu",
  "busy.scrambling": "Mélange…",
  "busy.solving": "Résolution…",

  "dock.scramble": "Mélanger",
  "dock.solve": "Résoudre",
  "dock.undo": "Annuler",
  "dock.redo": "Rétablir",
  "dock.reset": "Recommencer",
  "float.peek": "Aperçu des couleurs (+5 secondes)",
  "float.peekShort": "Aperçu des couleurs (+5 s)",
  "float.recenter": "Recentrer la caméra et réinitialiser le zoom",
  "float.recenterTitle": "Recentrer la caméra (double-clic sur le fond)",

  "section.size": "Taille",
  "section.difficulty": "Difficulté",
  "section.mode": "Mode",
  "group.size": "Taille du cube",
  "group.difficulty": "Difficulté",
  "group.mode": "Mode de jeu",
  "group.theme": "Thème",

  "diff.easy": "Facile",
  "diff.normal": "Normal",
  "diff.hard": "Difficile",
  "diff.extreme": "Extrême",

  "mode.classic.name": "Classique",
  "mode.classic.desc": "Résous à ton rythme, chrono en marche.",
  "mode.sprint.name": "Sprint",
  "mode.sprint.desc": "Contre la montre — résous avant la fin du temps.",
  "mode.efficiency.name": "Efficacité",
  "mode.efficiency.desc": "Budget de coups limité.",
  "mode.marathon.name": "Marathon",
  "mode.marathon.desc": "2×2 → 3×3 → 4×4, temps cumulé.",
  "mode.memory.name": "Mémoire",
  "mode.memory.desc": "Mémorise le mélange — ensuite, à l'aveugle.",

  "theme.classic": "Classique",
  "theme.neon": "Néon",
  "theme.pastel": "Pastel",
  "theme.carbon": "Carbone",
  "aria.theme": "Thème {name}",

  "rules.classic": "{n} coups de mélange",
  "rules.sprint": "Limite : {t}",
  "rules.efficiency": "Budget : {n} coups",
  "rules.memory": "Mémorisation : {s}s · aperçu +5 s",
  "rules.marathon": "Étape 1/{n} · temps cumulé",
  "best.time": "Record : {t} · {n} coups",
  "best.moves": "Record : {n} coups",
  "best.none": "Pas encore de record",
  "action.play": "Jouer",
  "action.start": "Commencer à jouer",
  "footer.records": "Les records sont enregistrés sur cet appareil.",

  "win.stage": "Étape {a}/{b} !",
  "win.final": "Marathon terminé !",
  "win.solved": "Résolu !",
  "win.next": "Ensuite : {n}×{n} — le chrono continue.",
  "win.record": "Nouveau record",
  "stat.time": "Temps",
  "stat.budget": "Budget",
  "stat.moves": "Coups",
  "stat.best": "Record",
  "action.continue": "Continuer",
  "action.playAgain": "Rejouer",
  "action.menu": "Menu",

  "fail.time.title": "Temps écoulé !",
  "fail.time.desc": "Le chrono est tombé à zéro avant la fin.",
  "fail.moves.title": "Plus de coups !",
  "fail.moves.desc": "Tu as utilisé tout le budget de coups.",
  "action.retry": "Réessayer",

  "help.title": "Comment jouer",
  "help.layer.t": "Tourner une tranche",
  "help.layer.d":
    "Glisse le doigt (ou la souris) sur un autocollant dans la direction voulue pour tourner la tranche.",
  "help.orbit.t": "Orbiter la caméra",
  "help.orbit.d":
    "Glisse hors du cube pour changer d'angle. Pince (ou molette) pour zoomer.",
  "help.recenter.t": "Recentrer la caméra",
  "help.recenter.d1": "Le bouton",
  "help.recenter.d2":
    "(coin inférieur droit) recentre le cube avec le zoom par défaut. Tu peux aussi faire un",
  "help.recenter.d3": "hors du cube.",
  "help.recenter.dbl": "double-clic",
  "help.keyboard.t": "Clavier (PC)",
  "help.keyboard.d1": "Les touches",
  "help.keyboard.d2": "tournent les faces. Avec",
  "help.keyboard.d3": ", effectue le mouvement inverse (ex. R').",
  "help.goal.t": "Objectif",
  "help.goal.d":
    "Fais de chaque face une seule couleur. Le chrono démarre au premier coup après le mélange.",
  "help.modes": "Modes de jeu",
  "help.memory.t": "Mode Mémoire",
  "help.memory.d1":
    "Tu as quelques secondes pour mémoriser le cube ; ensuite les autocollants deviennent gris. Le bouton",
  "help.memory.d2": "affiche les couleurs pendant 2 s — chaque aperçu coûte +5 s.",
  "help.memory.peek": "Aperçu",
  "help.tip.label": "Astuce :",
  "help.tip.d1": "le bouton",
  "help.tip.d2":
    "ramène le cube à l'état résolu pas à pas — idéal pour apprendre. Utilise",
  "help.tip.d3": "pour corriger un coup.",
  "help.tip.solve": "Résoudre",
  "help.tip.undo": "Annuler",
  "help.difficulty.label": "Difficulté",
  "help.difficulty.d":
    "change la longueur du mélange et les limites de temps/coups. Chaque combinaison mode + taille + difficulté a son record.",

  "settings.title": "Paramètres",
  "section.theme": "Thème",
  "theme.tag.glow": "Autocollants lumineux",
  "theme.tag.soft": "Rendu doux",
  "settings.sound": "Son",
  "settings.sound.desc": "Effets sonores discrets",
  "settings.haptics": "Vibration",
  "settings.haptics.desc": "Retour haptique en tournant (Android)",
  "settings.language": "Langue",
  "settings.updates": "Mises à jour",
  "updates.current": "Version actuelle : v{v}",
  "updates.check": "Vérifier",
  "updates.checking": "Vérification…",
  "updates.upToDate": "À jour ✓",
  "updates.available": "Nouvelle version : v{v}",
  "updates.error": "Vérification impossible",
  "updates.view": "Voir les nouveautés",
  "settings.about": "À propos",
  "about.version": "version {v}",

  "upd.title": "Nouvelle version disponible",
  "upd.subtitle": "C-Cube v{v} est disponible — tu as la v{cur}.",
  "upd.notes": "Nouveautés",
  "upd.download": "Télécharger la mise à jour",
  "upd.page": "Ouvrir la page de la version",
  "upd.later": "Plus tard",
};

const es: Dict = {
  "app.title": "C-Cube — Cubo Mágico 3D",
  "app.tagline": "Cubo mágico 3D — arrastra, gira, resuelve",

  "hud.memorize": "Memoriza {s}s",
  "aria.soundOff": "Desactivar sonido",
  "aria.soundOn": "Activar sonido",
  "aria.help": "Ayuda",
  "aria.settings": "Ajustes",
  "aria.back": "Volver al menú",
  "busy.scrambling": "Mezclando…",
  "busy.solving": "Resolviendo…",

  "dock.scramble": "Mezclar",
  "dock.solve": "Resolver",
  "dock.undo": "Deshacer",
  "dock.redo": "Rehacer",
  "dock.reset": "Reiniciar",
  "float.peek": "Ver colores (+5 segundos)",
  "float.peekShort": "Ver colores (+5 s)",
  "float.recenter": "Recentrar cámara y restablecer zoom",
  "float.recenterTitle": "Recentrar cámara (doble clic en el fondo)",

  "section.size": "Tamaño",
  "section.difficulty": "Dificultad",
  "section.mode": "Modo",
  "group.size": "Tamaño del cubo",
  "group.difficulty": "Dificultad",
  "group.mode": "Modo de juego",
  "group.theme": "Tema",

  "diff.easy": "Fácil",
  "diff.normal": "Normal",
  "diff.hard": "Difícil",
  "diff.extreme": "Extremo",

  "mode.classic.name": "Clásico",
  "mode.classic.desc": "Resuelve a tu ritmo, cronómetro en marcha.",
  "mode.sprint.name": "Sprint",
  "mode.sprint.desc": "Contrarreloj — resuelve antes de que acabe el tiempo.",
  "mode.efficiency.name": "Eficiencia",
  "mode.efficiency.desc": "Presupuesto limitado de movimientos.",
  "mode.marathon.name": "Maratón",
  "mode.marathon.desc": "2×2 → 3×3 → 4×4, tiempo acumulado.",
  "mode.memory.name": "Memoria",
  "mode.memory.desc": "Memoriza la mezcla — luego quedas ciego.",

  "theme.classic": "Clásico",
  "theme.neon": "Neón",
  "theme.pastel": "Pastel",
  "theme.carbon": "Carbono",
  "aria.theme": "Tema {name}",

  "rules.classic": "{n} movimientos de mezcla",
  "rules.sprint": "Límite: {t}",
  "rules.efficiency": "Presupuesto: {n} movimientos",
  "rules.memory": "Memorización: {s}s · mirar +5s",
  "rules.marathon": "Etapa 1/{n} · tiempo acumulado",
  "best.time": "Mejor: {t} · {n} mov.",
  "best.moves": "Mejor: {n} movimientos",
  "best.none": "Sin récord aún",
  "action.play": "Jugar",
  "action.start": "Empezar a jugar",
  "footer.records": "Los récords se guardan en este dispositivo.",

  "win.stage": "¡Etapa {a}/{b}!",
  "win.final": "¡Maratón completada!",
  "win.solved": "¡Resuelto!",
  "win.next": "Siguiente: {n}×{n} — el tiempo sigue corriendo.",
  "win.record": "Nuevo récord",
  "stat.time": "Tiempo",
  "stat.budget": "Presupuesto",
  "stat.moves": "Movimientos",
  "stat.best": "Mejor",
  "action.continue": "Continuar",
  "action.playAgain": "Jugar otra vez",
  "action.menu": "Menú",

  "fail.time.title": "¡Tiempo agotado!",
  "fail.time.desc": "El cronómetro llegó a cero antes de terminar.",
  "fail.moves.title": "¡Sin movimientos!",
  "fail.moves.desc": "Usaste todo el presupuesto de movimientos.",
  "action.retry": "Intentar de nuevo",

  "help.title": "Cómo jugar",
  "help.layer.t": "Girar una capa",
  "help.layer.d":
    "Arrastra el dedo (o el ratón) sobre una pegatina en la dirección en que quieres girar la capa.",
  "help.orbit.t": "Orbitar la cámara",
  "help.orbit.d":
    "Arrastra fuera del cubo para mirar desde cualquier ángulo. Pellizca (o usa la rueda) para acercar.",
  "help.recenter.t": "Recentrar la cámara",
  "help.recenter.d1": "El botón",
  "help.recenter.d2":
    "(esquina inferior derecha) centra el cubo con el zoom predeterminado. También puedes hacer doble clic",
  "help.recenter.d3": "fuera del cubo.",
  "help.recenter.dbl": "doble clic",
  "help.keyboard.t": "Teclado (PC)",
  "help.keyboard.d1": "Las teclas",
  "help.keyboard.d2": "giran las caras. Con",
  "help.keyboard.d3": ", haces el movimiento inverso (p. ej., R').",
  "help.goal.t": "Objetivo",
  "help.goal.d":
    "Deja cada cara de un solo color. El cronómetro arranca con tu primer movimiento tras la mezcla.",
  "help.modes": "Modos de juego",
  "help.memory.t": "Modo Memoria",
  "help.memory.d1":
    "Tienes unos segundos para memorizar el cubo; luego las pegatinas se vuelven grises. El botón",
  "help.memory.d2": "muestra los colores durante 2 s; cada vistazo cuesta +5 s.",
  "help.memory.peek": "Mirar",
  "help.tip.label": "Consejo:",
  "help.tip.d1": "el botón",
  "help.tip.d2":
    "devuelve el cubo al estado resuelto paso a paso; útil para aprender. Usa",
  "help.tip.d3": "para corregir un movimiento.",
  "help.tip.solve": "Resolver",
  "help.tip.undo": "Deshacer",
  "help.difficulty.label": "Dificultad",
  "help.difficulty.d":
    "cambia el tamaño de la mezcla y los límites de tiempo/movimientos. Cada combinación de modo + tamaño + dificultad tiene su propio récord.",

  "settings.title": "Ajustes",
  "section.theme": "Tema",
  "theme.tag.glow": "Pegatinas brillantes",
  "theme.tag.soft": "Aspecto suave",
  "settings.sound": "Sonido",
  "settings.sound.desc": "Efectos de sonido discretos",
  "settings.haptics": "Vibración",
  "settings.haptics.desc": "Respuesta tátil al girar (Android)",
  "settings.language": "Idioma",
  "settings.updates": "Actualizaciones",
  "updates.current": "Versión actual: v{v}",
  "updates.check": "Comprobar ahora",
  "updates.checking": "Comprobando…",
  "updates.upToDate": "Al día ✓",
  "updates.available": "Nueva versión: v{v}",
  "updates.error": "No se pudo comprobar",
  "updates.view": "Ver novedades",
  "settings.about": "Acerca de",
  "about.version": "versión {v}",

  "upd.title": "Nueva versión disponible",
  "upd.subtitle": "C-Cube v{v} está disponible — tienes la v{cur}.",
  "upd.notes": "Novedades",
  "upd.download": "Descargar actualización",
  "upd.page": "Abrir página de la versión",
  "upd.later": "Más tarde",
};

const DICTS: Record<Locale, Dict> = { pt, en, fr, es };

/** Devolve uma função t() fixada ao locale indicado (com fallback pt). */
export function tFor(locale: Locale): TFn {
  const dict = DICTS[locale] ?? pt;
  return (key, vars) => {
    let s = dict[key] ?? pt[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(String(v));
      }
    }
    return s;
  };
}

/** Deteta o idioma do navegador (fallback: português). */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "pt";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || "pt"];
  for (const raw of langs) {
    const n = (raw || "").toLowerCase();
    if (n.startsWith("pt")) return "pt";
    if (n.startsWith("en")) return "en";
    if (n.startsWith("fr")) return "fr";
    if (n.startsWith("es")) return "es";
  }
  return "pt";
}
