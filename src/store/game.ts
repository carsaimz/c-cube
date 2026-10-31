"use client";
/**
 * C-Cube — Estado global do jogo (zustand).
 * A vista 3D (CubeView) é a fonte de verdade do estado físico do cubo;
 * esta store gere fluxo de jogo, modos, dificuldade, cronómetro, recordes e definições.
 *
 * Modos:
 *  - classic    → resolver livre, cronómetro a contar para cima
 *  - sprint     → contra-relógio (limite por dificuldade/tamanho)
 *  - efficiency → orçamento de movimentos limitado
 *  - marathon   → sequência 2×2 → 3×3 → 4×4, tempo acumulado
 *  - memory     → memorizar o scramble; adesivos ficam cinzentos (espreitar custa +5 s)
 */
import { create } from "zustand";
import {
  type Difficulty,
  type Move,
  MARATHON_STAGES,
  PEEK_DURATION_MS,
  PEEK_PENALTY_MS,
  faceLetterToMove,
  generateScramble,
  inverseOf,
  memoryStudyMs,
  moveBudget,
  movesToNotation,
  scrambleLength,
  sprintTimeLimit,
} from "@/lib/cube/engine";
import { CubeView } from "@/lib/cube/cube-view";
import { themeById } from "@/lib/cube/themes";
import {
  playClick,
  playFail,
  playPeek,
  playSnap,
  playStage,
  playTick,
  playTurnStart,
  playWin,
  setMuted,
} from "@/lib/sound";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export type GameMode = "classic" | "sprint" | "efficiency" | "marathon" | "memory";
export type GameStatus = "menu" | "idle" | "scrambling" | "playing" | "solving" | "won" | "failed";
export type MemoryPhase = "none" | "study" | "blind";
export type FailReason = "time" | "moves";

export interface ModeInfo {
  id: GameMode;
  name: string;
  desc: string;
}

export const MODES: ModeInfo[] = [
  { id: "classic", name: "Clássico", desc: "Resolve ao teu ritmo, cronómetro a contar." },
  { id: "sprint", name: "Sprint", desc: "Contra-relógio — resolve antes de o tempo acabar." },
  { id: "efficiency", name: "Eficiência", desc: "Orçamento limitado de movimentos." },
  { id: "marathon", name: "Maratona", desc: "2×2 → 3×3 → 4×4, tempo acumulado." },
  { id: "memory", name: "Memória", desc: "Memoriza o scramble — depois ficas cego." },
];

export interface BestRecord {
  timeMs: number;
  moves: number;
  date: string;
}

export interface WinInfo {
  timeMs: number;
  moves: number;
  newRecord: boolean;
  mode: GameMode;
  stageDone?: number; // maratona: etapa concluída (1-based)
  stagesTotal?: number;
  final?: boolean; // maratona: última etapa
}

interface Settings {
  themeId: string;
  soundOn: boolean;
  hapticsOn: boolean;
  mode: GameMode;
  difficulty: Difficulty;
}

const SETTINGS_KEY = "ccube:v1:settings";
const BESTS_KEY = "ccube:v1:bests";

function loadSettings(): Settings {
  const fallback: Settings = { themeId: "classic", soundOn: true, hapticsOn: true, mode: "classic", difficulty: "normal" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      return {
        themeId: p.themeId ?? "classic",
        soundOn: p.soundOn ?? true,
        hapticsOn: p.hapticsOn ?? true,
        mode: p.mode ?? "classic",
        difficulty: p.difficulty ?? "normal",
      };
    }
  } catch {
    /* ignorar */
  }
  return fallback;
}

/** Chave de recorde: modo:tamanho:dificuldade (maratona usa tamanho 0). */
export function recordKey(mode: GameMode, size: number, diff: Difficulty): string {
  return `${mode}:${mode === "marathon" ? 0 : size}:${diff}`;
}

function loadBests(): Record<string, BestRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BESTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BestRecord>;
    // migração v1: chaves antigas eram só o tamanho ("3") → classic:normal
    const out: Record<string, BestRecord> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (/^\d+$/.test(k)) out[`classic:${k}:normal`] = v;
      else out[k] = v;
    }
    return out;
  } catch {
    /* ignorar */
  }
  return {};
}

function saveSettings(s: Settings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignorar */
  }
}

function saveBests(b: Record<string, BestRecord>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BESTS_KEY, JSON.stringify(b));
  } catch {
    /* ignorar */
  }
}

function buzz(): void {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    /* web: sem efeito */
  });
}

interface GameState {
  status: GameStatus;
  size: number;
  mode: GameMode;
  difficulty: Difficulty;
  themeId: string;
  soundOn: boolean;
  hapticsOn: boolean;
  moveCount: number;
  startedAt: number | null;
  elapsedMs: number;
  timerRunning: boolean;
  scrambled: boolean;
  history: Move[];
  redoStack: Move[];
  scrambleStr: string | null;
  lastWin: WinInfo | null;
  bests: Record<string, BestRecord>;
  view: CubeView | null;

  // modos
  budget: number | null; // eficiência: orçamento de movimentos
  failReason: FailReason | null;
  marathonStage: number; // índice em MARATHON_STAGES
  memoryPhase: MemoryPhase;
  studyEndsAt: number | null;
  studyTotalMs: number;
  peekUntil: number | null;
  penaltyMs: number;

  setView: (v: CubeView | null) => void;
  startGame: () => void;
  goMenu: () => void;
  retry: () => void;
  setSize: (n: number) => void;
  setMode: (m: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setTheme: (id: string) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  scramble: (opts?: { keepClock?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  solve: () => void;
  userMove: (m: Move) => void;
  keyMove: (letter: string) => void;
  commitMove: (m: Move) => void;
  onQueueEmpty: () => void;
  tick: () => void;
  dismissWin: () => void;
  continueMarathon: () => void;
  peek: () => void;
  resetView: () => void;
}

export const useGameStore = create<GameState>((set, get) => {
  const initialSettings = loadSettings();
  setMuted(!initialSettings.soundOn);

  const vibrate = () => {
    if (get().hapticsOn) buzz();
  };

  // último segundo anunciado no countdown do Sprint (para não repetir tiques)
  let lastCountdownSec = -1;

  const persist = () => {
    const s = get();
    saveSettings({ themeId: s.themeId, soundOn: s.soundOn, hapticsOn: s.hapticsOn, mode: s.mode, difficulty: s.difficulty });
  };

  /** Limpa o estado de modos temporários (memória/cego). */
  const clearMemory = () => {
    set({ memoryPhase: "none", studyEndsAt: null, studyTotalMs: 0, peekUntil: null, penaltyMs: 0 });
    get().view?.setBlind(false);
  };

  const enterFail = (reason: FailReason) => {
    if (get().status !== "playing") return;
    playFail();
    set({ status: "failed", failReason: reason, timerRunning: false });
  };

  return {
    status: "menu",
    size: 3,
    mode: initialSettings.mode,
    difficulty: initialSettings.difficulty,
    themeId: initialSettings.themeId,
    soundOn: initialSettings.soundOn,
    hapticsOn: initialSettings.hapticsOn,
    moveCount: 0,
    startedAt: null,
    elapsedMs: 0,
    timerRunning: false,
    scrambled: false,
    history: [],
    redoStack: [],
    scrambleStr: null,
    lastWin: null,
    bests: loadBests(),
    view: null,

    budget: null,
    failReason: null,
    marathonStage: 0,
    memoryPhase: "none",
    studyEndsAt: null,
    studyTotalMs: 0,
    peekUntil: null,
    penaltyMs: 0,

    setView: (v) => set({ view: v }),

    startGame: () => {
      playClick();
      const st = get();
      if (st.mode === "marathon" && st.size !== MARATHON_STAGES[0]) {
        st.view?.setSize(MARATHON_STAGES[0]);
        set({ size: MARATHON_STAGES[0] });
      }
      set({
        status: "idle",
        scrambled: false,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        lastWin: null,
        failReason: null,
        redoStack: [],
        marathonStage: 0,
      });
      clearMemory();
      get().scramble();
    },

    retry: () => get().startGame(),

    goMenu: () => {
      playClick();
      set({ status: "menu" });
      clearMemory();
      get().view?.setIdle(true);
    },

    setSize: (n) => {
      if (get().size === n) return;
      playClick();
      set({
        size: n,
        history: [],
        redoStack: [],
        scrambled: false,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        scrambleStr: null,
        budget: null,
        status: get().status === "menu" ? "menu" : "idle",
      });
      clearMemory();
      get().view?.setSize(n);
    },

    setMode: (m) => {
      playClick();
      const st = get();
      if (m === "marathon" && st.size !== MARATHON_STAGES[0]) {
        st.view?.setSize(MARATHON_STAGES[0]);
      }
      set({
        mode: m,
        size: m === "marathon" ? MARATHON_STAGES[0] : st.size,
        history: [],
        redoStack: [],
        scrambled: false,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        scrambleStr: null,
        budget: null,
        failReason: null,
        marathonStage: 0,
        status: "menu",
      });
      clearMemory();
      persist();
    },

    setDifficulty: (d) => {
      playClick();
      set({ difficulty: d });
      persist();
    },

    setTheme: (id) => {
      set({ themeId: id });
      persist();
      get().view?.setTheme(themeById(id));
    },

    toggleSound: () => {
      const soundOn = !get().soundOn;
      set({ soundOn });
      setMuted(!soundOn);
      persist();
    },

    toggleHaptics: () => {
      const hapticsOn = !get().hapticsOn;
      set({ hapticsOn });
      persist();
    },

    scramble: (opts) => {
      const { status, size, mode, difficulty, view } = get();
      if (status === "menu" || status === "scrambling" || status === "solving" || !view) return;
      const len = scrambleLength(size, difficulty);
      const moves = generateScramble(size, len);
      const keepClock = opts?.keepClock ?? false;
      lastCountdownSec = -1;
      set({
        status: "scrambling",
        scrambled: true,
        moveCount: 0,
        redoStack: [],
        budget: mode === "efficiency" ? moveBudget(size, difficulty) : null,
        failReason: null,
        // maratona: o relógio acumulado continua a correr entre etapas
        ...(keepClock ? { timerRunning: true } : { elapsedMs: 0, startedAt: null, timerRunning: false, penaltyMs: 0 }),
        scrambleStr: movesToNotation(size, moves),
      });
      clearMemory();
      view.setIdle(false);
      view.enqueueMoves(moves);
    },

    undo: () => {
      const { status, history, view } = get();
      if ((status !== "idle" && status !== "playing") || history.length === 0 || !view) return;
      const last = history[history.length - 1];
      set({ history: history.slice(0, -1), redoStack: [...get().redoStack, last] });
      view.enqueueMove({ ...inverseOf(last), source: "undo" });
      vibrate();
    },

    redo: () => {
      const { status, redoStack, view } = get();
      if ((status !== "idle" && status !== "playing") || redoStack.length === 0 || !view) return;
      const next = redoStack[redoStack.length - 1];
      set({ redoStack: redoStack.slice(0, -1), history: [...get().history, next] });
      view.enqueueMove({ ...next, source: "redo" });
      vibrate();
    },

    reset: () => {
      const { status, view } = get();
      if (status === "menu" || !view) return;
      playClick();
      view.resetToSolved();
      set({
        status: "idle",
        history: [],
        redoStack: [],
        scrambled: false,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        scrambleStr: null,
        budget: null,
        failReason: null,
        marathonStage: 0,
      });
      clearMemory();
    },

    solve: () => {
      const { status, history, view } = get();
      if (status === "menu" || status === "scrambling" || status === "solving" || !view) return;
      if (history.length === 0) return;
      playClick();
      const moves = [...history].reverse().map((m) => ({ ...inverseOf(m), source: "autosolve" as const }));
      set({
        status: "solving",
        history: [],
        redoStack: [],
        timerRunning: false,
      });
      clearMemory();
      view.enqueueMoves(moves);
    },

    userMove: (m) => {
      const { status, view, memoryPhase } = get();
      if ((status !== "idle" && status !== "playing") || !view) return;
      if (memoryPhase === "study") {
        // no modo Memória, mover durante a memorização inicia o jogo imediatamente
        set({ memoryPhase: "blind", studyEndsAt: null });
        view.setBlind(true);
        playPeek(false);
      }
      view.enqueueMove({ ...m, source: "user" });
    },

    keyMove: (letter) => {
      const fm = faceLetterToMove(letter, get().size);
      if (!fm) return;
      get().userMove({ ...fm, source: "user" });
    },

    commitMove: (m) => {
      playSnap(m.axis, m.source === "scramble" || m.source === "autosolve");
      const state = get();
      // após uma falha, os movimentos já enfileirados apenas animam — sem contabilidade
      if (m.source === "user" && (state.status === "idle" || state.status === "playing")) {
        const startedAt =
          state.scrambled && !state.timerRunning ? Date.now() - state.penaltyMs : state.startedAt;
        const moveCount = state.moveCount + 1;
        set({
          history: [...state.history, m],
          redoStack: [],
          moveCount,
          timerRunning: state.scrambled ? true : state.timerRunning,
          startedAt,
          status: state.scrambled ? "playing" : state.status,
        });
        vibrate();
        // Eficiência: esgotou o orçamento sem resolver → falha
        const after = get();
        if (after.mode === "efficiency" && after.budget !== null && moveCount >= after.budget) {
          const view = after.view;
          if (view && !view.isSolved()) {
            enterFail("moves");
            return;
          }
        }
      } else if (m.source === "scramble" && (state.status === "scrambling" || state.status === "playing")) {
        set({ history: [...state.history, m] });
      }
      // undo/redo: contabilidade feita no ato do clique

      const after = get();
      if (
        (m.source === "user" || m.source === "redo") &&
        after.status === "playing" &&
        after.view?.isSolved()
      ) {
        const timeMs = after.timerRunning && after.startedAt ? Date.now() - after.startedAt : after.elapsedMs;
        const key = recordKey(after.mode, after.size, after.difficulty);
        const prev = after.bests[key];
        // Eficiência: o recorde é por movimentos; restantes por tempo
        const better =
          after.mode === "efficiency"
            ? !prev || after.moveCount < prev.moves
            : !prev || timeMs < prev.timeMs;
        const newRecord = better;
        const bests = { ...after.bests };
        if (newRecord) {
          bests[key] = { timeMs, moves: after.moveCount, date: new Date().toISOString() };
          saveBests(bests);
        }

        // Maratona: ainda há etapas?
        if (after.mode === "marathon" && after.marathonStage < MARATHON_STAGES.length - 1) {
          playStage();
          set({
            status: "won",
            timerRunning: false,
            elapsedMs: timeMs,
            lastWin: {
              timeMs,
              moves: after.moveCount,
              newRecord: false,
              mode: "marathon",
              stageDone: after.marathonStage + 1,
              stagesTotal: MARATHON_STAGES.length,
              final: false,
            },
          });
          after.view?.celebrate();
          return;
        }

        if (after.soundOn) playWin();
        set({
          status: "won",
          timerRunning: false,
          elapsedMs: timeMs,
          lastWin: {
            timeMs,
            moves: after.moveCount,
            newRecord,
            mode: after.mode,
            final: after.mode === "marathon" ? true : undefined,
          },
          bests,
        });
        after.view?.celebrate();
      }
    },

    onQueueEmpty: () => {
      const { status, mode, difficulty } = get();
      if (status === "scrambling") {
        set({ status: "idle" });
        // Memória: começar fase de memorização assim que o scramble termina
        if (mode === "memory") {
          const ms = memoryStudyMs(difficulty);
          set({ memoryPhase: "study", studyEndsAt: Date.now() + ms, studyTotalMs: ms });
        }
      } else if (status === "solving") {
        set({
          status: "idle",
          scrambled: false,
          moveCount: 0,
          elapsedMs: 0,
          startedAt: null,
          timerRunning: false,
          scrambleStr: null,
          budget: null,
        });
      }
    },

    tick: () => {
      const s = get();
      const now = Date.now();

      // cronómetro a contar para cima
      if (s.timerRunning && s.startedAt) set({ elapsedMs: now - s.startedAt });

      // Memória: fim da fase de memorização → cubo fica cego
      if (s.memoryPhase === "study" && s.studyEndsAt !== null && now >= s.studyEndsAt) {
        set({ memoryPhase: "blind", studyEndsAt: null });
        s.view?.setBlind(true);
        playPeek(false);
      }

      // Memória: fim da espreitadela → voltar a ficar cego
      if (s.peekUntil !== null && now >= s.peekUntil) {
        set({ peekUntil: null });
        if (s.mode === "memory" && s.memoryPhase === "blind" && (s.status === "playing" || s.status === "idle")) {
          s.view?.setBlind(true);
          playPeek(false);
        }
      }

      // Sprint: contagem decrescente + falha ao esgotar + tiques nos últimos segundos
      if (s.mode === "sprint" && s.status === "playing" && s.startedAt) {
        const limit = sprintTimeLimit(s.size, s.difficulty);
        const left = limit - (now - s.startedAt);
        if (left <= 0) {
          enterFail("time");
          return;
        }
        const sec = Math.ceil(left / 1000);
        if (sec <= 5 && sec !== lastCountdownSec) {
          lastCountdownSec = sec;
          playTick(sec <= 3);
        }
      }
    },

    dismissWin: () => set({ lastWin: null }),

    continueMarathon: () => {
      const s = get();
      if (s.mode !== "marathon") return;
      const nextStage = s.marathonStage + 1;
      const nextSize = MARATHON_STAGES[nextStage];
      playClick();
      s.view?.setSize(nextSize);
      set({
        marathonStage: nextStage,
        size: nextSize,
        lastWin: null,
        status: "idle",
        history: [],
        redoStack: [],
        moveCount: 0,
        scrambled: false,
        // o tempo acumula entre etapas — startedAt/elapsedMs preservados
      });
      get().scramble({ keepClock: true });
    },

    peek: () => {
      const s = get();
      if (s.mode !== "memory" || s.memoryPhase !== "blind" || s.status === "menu") return;
      playPeek(true);
      set({
        peekUntil: Date.now() + PEEK_DURATION_MS,
        penaltyMs: s.penaltyMs + PEEK_PENALTY_MS,
        startedAt: s.startedAt ? s.startedAt - PEEK_PENALTY_MS : null,
      });
      s.view?.setBlind(false);
    },

    resetView: () => {
      get().view?.resetView();
    },
  };
});

/** Callbacks ligados à vista 3D (chamados a cada movimento animado). */
export const viewCallbacks = {
  onMoveStart: (m: Move) => {
    playTurnStart(m.axis, m.source === "scramble" || m.source === "autosolve");
  },
  onMoveCommitted: (m: Move) => useGameStore.getState().commitMove(m),
  onUserGestureMove: (m: Move) => useGameStore.getState().userMove(m),
  onQueueEmpty: () => useGameStore.getState().onQueueEmpty(),
};
