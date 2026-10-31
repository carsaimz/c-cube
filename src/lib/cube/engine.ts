/**
 * C-Cube — Motor lógico do Cubo Mágico (tamanhos 2x2 a 5x5)
 *
 * Convenções:
 *  - Eixos: x = direita (+X), y = cima (+Y), z = frente (+Z). Sistema destro.
 *  - Posições lógicas: coordenadas inteiras 0..size-1 em cada eixo.
 *  - Rotação de uma camada: (axis, layer, dir) onde dir=+1 é 90° no sentido
 *    anti-horário visto de fora do eixo positivo (regra da mão direita) e
 *    dir=-1 é horário.
 *  - Faces (faceId): 0:+X R, 1:-X L, 2:+Y U, 3:-Y D, 4:+Z F, 5:-Z B
 *  - Orientação de cada peça: matriz inteira 3x3 (exata, sem deriva numérica).
 */

export type Axis = "x" | "y" | "z";
export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

export type MoveSource = "user" | "undo" | "redo" | "scramble" | "autosolve";

export interface Move {
  axis: Axis;
  layer: number;
  dir: 1 | -1;
  source: MoveSource;
  /** duração da animação em ms (opcional — a cena escolhe por defeito) */
  duration?: number;
}

export const FACE_DIRS: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function faceIdOfDir(d: Vec3): number {
  if (d[0] === 1) return 0;
  if (d[0] === -1) return 1;
  if (d[1] === 1) return 2;
  if (d[1] === -1) return 3;
  if (d[2] === 1) return 4;
  return 5;
}

/** Matriz de rotação inteira de 90° em torno do eixo. */
export function rotationMatrix(axis: Axis, dir: 1 | -1): Mat3 {
  const s = dir;
  if (axis === "x") {
    // (y,z) -> (-s*z, s*y)
    return [
      [1, 0, 0],
      [0, 0, -s],
      [0, s, 0],
    ];
  }
  if (axis === "y") {
    // (x,z) -> (s*z, -s*x)
    return [
      [0, 0, s],
      [0, 1, 0],
      [-s, 0, 0],
    ];
  }
  // (x,y) -> (-s*y, s*x)
  return [
    [0, -s, 0],
    [s, 0, 0],
    [0, 0, 1],
  ];
}

export function matMul(A: Mat3, B: Mat3): Mat3 {
  const out: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let v = 0;
      for (let k = 0; k < 3; k++) v += A[i][k] * B[k][j];
      out[i][j] = v;
    }
  }
  return out as Mat3;
}

export function matVec(M: Mat3, v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

/** Roda uma posição lógica (0..size-1) — mesma matemática da matriz acima. */
export function rotateLogicalPos(p: Vec3, axis: Axis, dir: 1 | -1, size: number): Vec3 {
  const c = (size - 1) / 2;
  const cx = p[0] - c;
  const cy = p[1] - c;
  const cz = p[2] - c;
  let rx = cx;
  let ry = cy;
  let rz = cz;
  if (axis === "x") {
    ry = -dir * cz;
    rz = dir * cy;
  } else if (axis === "y") {
    rx = dir * cz;
    rz = -dir * cx;
  } else {
    rx = -dir * cy;
    ry = dir * cx;
  }
  return [Math.round(rx + c), Math.round(ry + c), Math.round(rz + c)];
}

export function sameVec(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Verifica se uma peça está "alinhada" (orientação idêntica à original).
 * Peça alinhada => adesivos apontam para as direções originais.
 * (Peça alinhada implica posição original — ver notas de conceção.)
 */
export function cubieAligned(stickerDirs: Vec3[], M: Mat3): boolean {
  for (const d of stickerDirs) {
    if (!sameVec(matVec(M, d), d)) return false;
  }
  return true;
}

/** Notação SiGN simplificada: R, U', 2L, 3F, … */
export function notationFor(size: number, axis: Axis, layer: number, dir: 1 | -1): string {
  const last = size - 1;
  const mid = (size - 1) / 2;
  const positive = axis === "x" ? "R" : axis === "y" ? "U" : "F";
  const negative = axis === "x" ? "L" : axis === "y" ? "D" : "B";
  let face: string;
  let depth = 1;
  let prime: boolean;
  if (layer === last) {
    face = positive;
    prime = dir === 1;
  } else if (layer === 0) {
    face = negative;
    prime = dir === -1;
  } else if (layer > mid) {
    face = positive;
    depth = size - layer;
    prime = dir === 1;
  } else {
    face = negative;
    depth = layer + 1;
    prime = dir === -1;
  }
  return `${depth > 1 ? depth : ""}${face}${prime ? "'" : ""}`;
}

export interface FaceMove {
  axis: Axis;
  layer: number;
  dir: 1 | -1;
}

/** Converte letra de face (com ' opcional) para movimento da camada externa. */
export function faceLetterToMove(letter: string, size: number): FaceMove | null {
  const ch = letter[0]?.toUpperCase();
  const prime = letter.includes("'");
  const last = size - 1;
  switch (ch) {
    case "R":
      return { axis: "x", layer: last, dir: prime ? 1 : -1 };
    case "L":
      return { axis: "x", layer: 0, dir: prime ? -1 : 1 };
    case "U":
      return { axis: "y", layer: last, dir: prime ? 1 : -1 };
    case "D":
      return { axis: "y", layer: 0, dir: prime ? -1 : 1 };
    case "F":
      return { axis: "z", layer: last, dir: prime ? 1 : -1 };
    case "B":
      return { axis: "z", layer: 0, dir: prime ? -1 : 1 };
    default:
      return null;
  }
}

export function inverseOf(m: Move): Move {
  return { ...m, dir: (m.dir === 1 ? -1 : 1) as 1 | -1 };
}

/** Gera um scramble: evita repetir a mesma face consecutivamente. */
export function generateScramble(size: number, count: number): Move[] {
  const maxDepth = size >= 4 ? 2 : 1;
  const faces: { axis: Axis; positive: boolean }[] = [
    { axis: "x", positive: true },
    { axis: "x", positive: false },
    { axis: "y", positive: true },
    { axis: "y", positive: false },
    { axis: "z", positive: true },
    { axis: "z", positive: false },
  ];
  const moves: Move[] = [];
  let prev = -1;
  let prevAxis: Axis | null = null;
  for (let i = 0; i < count; i++) {
    let fi = Math.floor(Math.random() * 6);
    let guard = 0;
    while ((fi === prev || (faces[fi].axis === prevAxis && Math.random() < 0.6)) && guard++ < 30) {
      fi = Math.floor(Math.random() * 6);
    }
    prev = fi;
    prevAxis = faces[fi].axis;
    const depth = 1 + Math.floor(Math.random() * maxDepth);
    const layer = faces[fi].positive ? size - depth : depth - 1;
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    moves.push({ axis: faces[fi].axis, layer, dir, source: "scramble" });
  }
  return moves;
}

export function movesToNotation(size: number, moves: Move[]): string {
  return moves.map((m) => notationFor(size, m.axis, m.layer, m.dir)).join(" ");
}

export const SCRAMBLE_LENGTH: Record<number, number> = { 2: 14, 3: 24, 4: 32, 5: 36 };

// ------------------------------------------------------------------ dificuldade

export type Difficulty = "easy" | "normal" | "hard" | "extreme";

export interface DifficultyInfo {
  id: Difficulty;
  name: string;
  /** cor tailwind para o chip */
  color: string;
}

export const DIFFICULTIES: DifficultyInfo[] = [
  { id: "easy", name: "Fácil", color: "#4ade80" },
  { id: "normal", name: "Normal", color: "#fbbf24" },
  { id: "hard", name: "Difícil", color: "#fb923c" },
  { id: "extreme", name: "Extremo", color: "#f87171" },
];

/** Fator de comprimento do embaralhamento por dificuldade. */
const SCRAMBLE_FACTOR: Record<Difficulty, number> = {
  easy: 0.5,
  normal: 0.75,
  hard: 1,
  extreme: 1.35,
};

/** Comprimento do embaralhamento (tamanho + dificuldade). */
export function scrambleLength(size: number, diff: Difficulty): number {
  const base = SCRAMBLE_LENGTH[size] ?? 24;
  return Math.max(4, Math.round(base * SCRAMBLE_FACTOR[diff]));
}

/** Multiplicador de tempo por tamanho (cubos maiores precisam de mais tempo). */
const SIZE_TIME_FACTOR: Record<number, number> = { 2: 0.55, 3: 1, 4: 1.8, 5: 2.6 };

/** Limite de tempo do modo Sprint (ms). */
export function sprintTimeLimit(size: number, diff: Difficulty): number {
  const base: Record<Difficulty, number> = { easy: 480_000, normal: 300_000, hard: 180_000, extreme: 90_000 };
  return Math.round(base[diff] * (SIZE_TIME_FACTOR[size] ?? 1));
}

/** Orçamento de movimentos do modo Eficiência. */
export function moveBudget(size: number, diff: Difficulty): number {
  const factor: Record<Difficulty, number> = { easy: 2.6, normal: 2, hard: 1.7, extreme: 1.4 };
  return Math.ceil(scrambleLength(size, diff) * factor[diff]);
}

/** Tempo de memorização do modo Memória (ms). */
export function memoryStudyMs(diff: Difficulty): number {
  return { easy: 12_000, normal: 8_000, hard: 5_000, extreme: 3_000 }[diff];
}

/** Penalização (ms) de cada espreitadela no modo Memória. */
export const PEEK_PENALTY_MS = 5_000;
/** Duração de uma espreitadela (ms). */
export const PEEK_DURATION_MS = 2_000;

/** Etapas da Maratona (tamanhos por ordem). */
export const MARATHON_STAGES: number[] = [2, 3, 4];

export function formatTime(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const d = Math.floor((total % 1000) / 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${d}`;
}

/** Cronómetro de contagem decrescente (mm:ss). */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
