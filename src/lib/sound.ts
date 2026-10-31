/** C-Cube — Efeitos sonoros sintetizados (WebAudio, sem ficheiros externos). */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean): void {
  muted = v;
}

export function unlockAudio(): void {
  ensureCtx();
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slide = 0.7): void {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseClick(dur: number, gain: number, when = 0): void {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = 1800;
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
}

/** Som de rotação de camada — tom varia com o eixo. */
export function playTurn(axis: "x" | "y" | "z"): void {
  const base = axis === "x" ? 520 : axis === "y" ? 440 : 480;
  blip(base, 0.09, "triangle", 0.16, 0, 0.62);
  noiseClick(0.03, 0.05);
}

/** Clique suave de interface. */
export function playClick(): void {
  blip(300, 0.05, "sine", 0.1, 0, 0.85);
}

/** Arpejo de vitória. */
export function playWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => blip(n, 0.34, "triangle", 0.14, i * 0.09, 1));
  notes.forEach((n, i) => blip(n * 2, 0.2, "sine", 0.05, i * 0.09 + 0.02, 1));
}
