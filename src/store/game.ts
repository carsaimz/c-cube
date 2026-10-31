"use client";
/**
 * C-Cube — Estado global do jogo (zustand).
 * A vista 3D (CubeView) é a fonte de verdade do estado físico do cubo;
 * esta store gere fluxo de jogo, histórico, cronómetro, recordes e definições.
 */
import { create } from "zustand";
import {
  type Move,
  SCRAMBLE_LENGTH,
  faceLetterToMove,
  generateScramble,
  inverseOf,
  movesToNotation,
} from "@/lib/cube/engine";
import { CubeView } from "@/lib/cube/cube-view";
import { themeById } from "@/lib/cube/themes";
import { playClick, playTurn, playWin, setMuted } from "@/lib/sound";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export type GameStatus = "menu" | "idle" | "scrambling" | "playing" | "solving" | "won";

export interface BestRecord {
  timeMs: number;
  moves: number;
  date: string;
}

export interface WinInfo {
  timeMs: number;
  moves: number;
  newRecord: boolean;
}

interface Settings {
  themeId: string;
  soundOn: boolean;
  hapticsOn: boolean;
}

const SETTINGS_KEY = "ccube:v1:settings";
const BESTS_KEY = "ccube:v1:bests";

function loadSettings(): Settings {
  if (typeof window === "undefined") return { themeId: "classic", soundOn: true, hapticsOn: true };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      return {
        themeId: p.themeId ?? "classic",
        soundOn: p.soundOn ?? true,
        hapticsOn: p.hapticsOn ?? true,
      };
    }
  } catch {
    /* ignorar */
  }
  return { themeId: "classic", soundOn: true, hapticsOn: true };
}

function loadBests(): Record<string, BestRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BESTS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, BestRecord>;
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

  setView: (v: CubeView | null) => void;
  startGame: () => void;
  goMenu: () => void;
  setSize: (n: number) => void;
  setTheme: (id: string) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  scramble: () => void;
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
}

export const useGameStore = create<GameState>((set, get) => {
  const initialSettings = loadSettings();
  setMuted(!initialSettings.soundOn);

  const vibrate = () => {
    if (get().hapticsOn) buzz();
  };

  return {
    status: "menu",
    size: 3,
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

    setView: (v) => set({ view: v }),

    startGame: () => {
      playClick();
      set({
        status: "idle",
        scrambled: false,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        lastWin: null,
        redoStack: [],
      });
      get().scramble();
    },

    goMenu: () => {
      playClick();
      set({ status: "menu" });
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
        status: get().status === "menu" ? "menu" : "idle",
      });
      get().view?.setSize(n);
    },

    setTheme: (id) => {
      set({ themeId: id });
      saveSettings({ themeId: id, soundOn: get().soundOn, hapticsOn: get().hapticsOn });
      get().view?.setTheme(themeById(id));
    },

    toggleSound: () => {
      const soundOn = !get().soundOn;
      set({ soundOn });
      setMuted(!soundOn);
      saveSettings({ themeId: get().themeId, soundOn, hapticsOn: get().hapticsOn });
    },

    toggleHaptics: () => {
      const hapticsOn = !get().hapticsOn;
      set({ hapticsOn });
      saveSettings({ themeId: get().themeId, soundOn: get().soundOn, hapticsOn });
    },

    scramble: () => {
      const { status, size, view } = get();
      if (status === "menu" || status === "scrambling" || status === "solving" || !view) return;
      const moves = generateScramble(size, SCRAMBLE_LENGTH[size] ?? 24);
      set({
        status: "scrambling",
        scrambled: true,
        moveCount: 0,
        elapsedMs: 0,
        startedAt: null,
        timerRunning: false,
        redoStack: [],
        scrambleStr: movesToNotation(size, moves),
      });
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
      });
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
      view.enqueueMoves(moves);
    },

    userMove: (m) => {
      const { status, view } = get();
      if ((status !== "idle" && status !== "playing") || !view) return;
      view.enqueueMove({ ...m, source: "user" });
    },

    keyMove: (letter) => {
      const fm = faceLetterToMove(letter, get().size);
      if (!fm) return;
      get().userMove({ ...fm, source: "user" });
    },

    commitMove: (m) => {
      const state = get();
      if (m.source === "user") {
        const startedAt = state.scrambled && !state.timerRunning ? Date.now() : state.startedAt;
        set({
          history: [...state.history, m],
          redoStack: [],
          moveCount: state.moveCount + 1,
          timerRunning: state.scrambled ? true : state.timerRunning,
          startedAt,
          status: state.scrambled ? "playing" : state.status,
        });
        vibrate();
      } else if (m.source === "scramble") {
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
        const key = String(after.size);
        const prev = after.bests[key];
        const newRecord = !prev || timeMs < prev.timeMs;
        const bests = { ...after.bests };
        if (newRecord) {
          bests[key] = { timeMs, moves: after.moveCount, date: new Date().toISOString() };
          saveBests(bests);
        }
        set({
          status: "won",
          timerRunning: false,
          elapsedMs: timeMs,
          lastWin: { timeMs, moves: after.moveCount, newRecord },
          bests,
        });
        if (after.soundOn) playWin();
        after.view?.celebrate();
      }
    },

    onQueueEmpty: () => {
      const { status } = get();
      if (status === "scrambling") {
        set({ status: "idle" });
      } else if (status === "solving") {
        set({
          status: "idle",
          scrambled: false,
          moveCount: 0,
          elapsedMs: 0,
          startedAt: null,
          timerRunning: false,
          scrambleStr: null,
        });
      }
    },

    tick: () => {
      const { timerRunning, startedAt } = get();
      if (timerRunning && startedAt) set({ elapsedMs: Date.now() - startedAt });
    },

    dismissWin: () => {
      set({ lastWin: null });
    },
  };
});

/** Callbacks ligados à vista 3D (chamados a cada movimento animado). */
export const viewCallbacks = {
  onMoveStart: (m: Move) => {
    if (useGameStore.getState().soundOn) playTurn(m.axis);
  },
  onMoveCommitted: (m: Move) => useGameStore.getState().commitMove(m),
  onUserGestureMove: (m: Move) => useGameStore.getState().userMove(m),
  onQueueEmpty: () => useGameStore.getState().onQueueEmpty(),
};
