/**
 * C-Cube — Motor de som realista (WebAudio, sem ficheiros externos).
 *
 * Em vez de bipes sintéticos, cada evento é construído por camadas como uma
 * gravação real de um cubo mágico:
 *  - "snap"   → transiente de plástico (ruído filtrado) + corpo grave ("thock")
 *               + ressonância metálica curta, com variação aleatória de tom
 *               e pan estéreo por eixo — como rodar um cubo de verdade.
 *  - "whoosh" → deslize de ruído ao iniciar a rotação da camada.
 *  - reverb   → convolução com impulso sintético curto (sala pequena).
 *  - limiter  → compressor no master para evitar clipping.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverbSend: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.16;
    comp.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(comp);

    // reverb: impulso sintético (ruído estéreo com decaimento exponencial)
    const irLen = Math.floor(ctx.sampleRate * 0.9);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        const t = i / irLen;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (1 - t * 0.2);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.14;
    reverbSend.connect(conv);
    conv.connect(master);

    // buffer de ruído branco partilhado (2 s)
    const nLen = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
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

// ------------------------------------------------------------------ primitivas

/** Rajada de ruído filtrado — base dos clicks "de plástico". */
function noiseBurst(opts: {
  when: number;
  dur: number;
  gain: number;
  type: BiquadFilterType;
  freq: number;
  freqEnd?: number;
  q?: number;
  pan?: number;
  wet?: number;
}): void {
  const c = ensureCtx();
  if (!c || !master || muted || !noiseBuf) return;
  const t0 = c.currentTime + opts.when;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const filt = c.createBiquadFilter();
  filt.type = opts.type;
  filt.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), t0 + opts.dur);
  filt.Q.value = opts.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  const pan = c.createStereoPanner();
  pan.pan.value = opts.pan ?? 0;
  src.connect(filt).connect(g).connect(pan).connect(master);
  if (reverbSend && opts.wet) {
    const w = c.createGain();
    w.gain.value = opts.wet;
    pan.connect(w).connect(reverbSend);
  }
  src.start(t0);
  src.stop(t0 + opts.dur + 0.05);
}

/** Oscilador com queda de frequência — corpo grave e pings. */
function tone(opts: {
  when: number;
  dur: number;
  gain: number;
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  pan?: number;
  wet?: number;
}): void {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + opts.when;
  const osc = c.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqEnd), t0 + opts.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  const pan = c.createStereoPanner();
  pan.pan.value = opts.pan ?? 0;
  osc.connect(g).connect(pan).connect(master);
  if (reverbSend && opts.wet) {
    const w = c.createGain();
    w.gain.value = opts.wet;
    pan.connect(w).connect(reverbSend);
  }
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

/** Pan estéreo por eixo + alternância aleatória — dá sensação física. */
function axisPan(axis: "x" | "y" | "z"): number {
  const base = axis === "x" ? -0.22 : axis === "z" ? 0.22 : 0;
  return base + (Math.random() * 0.12 - 0.06);
}

// -------------------------------------------------------------------- eventos

/**
 * Início de rotação de camada — "deslize" curto de plástico.
 * @param soft embaralhamento/resolução automática (mais discreto)
 */
export function playTurnStart(axis: "x" | "y" | "z", soft = false): void {
  const pan = axisPan(axis);
  const v = soft ? 0.4 : 1;
  noiseBurst({
    when: 0,
    dur: soft ? 0.05 : 0.09,
    gain: 0.1 * v,
    type: "bandpass",
    freq: 500,
    freqEnd: 1500,
    q: 0.8,
    pan,
  });
  tone({ when: 0, dur: 0.03, gain: 0.05 * v, type: "triangle", freq: 1250, freqEnd: 800, pan });
}

/**
 * Encaixe da camada — o som característico do cubo: transiente + corpo grave
 * + ressonância, com variação aleatória de tom (nenhum snap é igual).
 * @param soft movimentos rápidos (autosolve) soam mais leves
 */
export function playSnap(axis: "x" | "y" | "z", soft = false): void {
  const pan = axisPan(axis);
  const r = 0.92 + Math.random() * 0.16; // variação de tom
  const v = soft ? 0.55 : 1;

  // 1) transiente — click de plástico
  noiseBurst({ when: 0, dur: 0.022, gain: 0.5 * v, type: "highpass", freq: 1400, pan });
  // 2) corpo — "clack" de peças a assentar
  noiseBurst({
    when: 0.004,
    dur: 0.05,
    gain: 0.32 * v,
    type: "bandpass",
    freq: 950 * r,
    q: 0.9,
    pan,
    wet: 0.25,
  });
  // 3) thock grave — o "peso" da camada
  tone({ when: 0.002, dur: 0.075, gain: 0.4 * v, type: "sine", freq: 205 * r, freqEnd: 120, pan });
  // 4) ressonância curta — mola/mecanismo
  tone({ when: 0.006, dur: 0.04, gain: 0.06 * v, type: "triangle", freq: 2900 * r, pan, wet: 0.4 });
}

/** Clique suave de interface. */
export function playClick(): void {
  noiseBurst({ when: 0, dur: 0.014, gain: 0.16, type: "highpass", freq: 2400 });
  tone({ when: 0, dur: 0.035, gain: 0.08, type: "sine", freq: 720, freqEnd: 520 });
}

/** "Tique" de contagem decrescente (últimos segundos do Sprint). */
export function playTick(urgent = false): void {
  tone({ when: 0, dur: 0.05, gain: urgent ? 0.16 : 0.1, type: "square", freq: urgent ? 1150 : 880, freqEnd: 700 });
  noiseBurst({ when: 0, dur: 0.02, gain: 0.08, type: "highpass", freq: 3000 });
}

/** Espreitadela no modo Memória — obturador duplo. */
export function playPeek(open: boolean): void {
  const f = open ? 900 : 620;
  noiseBurst({ when: 0, dur: 0.03, gain: 0.2, type: "bandpass", freq: f * 2, q: 1.4 });
  tone({ when: open ? 0 : 0.07, dur: 0.05, gain: 0.12, type: "sine", freq: f, freqEnd: f * 0.7 });
}

/** Estágio concluído na Maratona — pequena subida. */
export function playStage(): void {
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  notes.forEach((n, i) =>
    tone({ when: i * 0.09, dur: 0.16, gain: 0.14, type: "triangle", freq: n, wet: 0.5 })
  );
}

/** Vitória — arpejo com corpo, reverb e brilho. */
export function playWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((n, i) => {
    const when = i * 0.095;
    tone({ when, dur: 0.42, gain: 0.16, type: "triangle", freq: n, wet: 0.6 });
    tone({ when: when + 0.015, dur: 0.3, gain: 0.07, type: "sine", freq: n * 2, wet: 0.5 });
  });
  // acorde final
  [523.25, 659.25, 783.99, 1046.5].forEach((n) =>
    tone({ when: 0.44, dur: 0.9, gain: 0.09, type: "triangle", freq: n, wet: 0.9 })
  );
  // brilho
  noiseBurst({ when: 0.42, dur: 0.5, gain: 0.045, type: "highpass", freq: 6000, wet: 0.8 });
}

/** Falha (Sprint/Eficiência) — descida grave e abafada. */
export function playFail(): void {
  tone({ when: 0, dur: 0.3, gain: 0.18, type: "sawtooth", freq: 330, freqEnd: 250, wet: 0.4 });
  tone({ when: 0.22, dur: 0.5, gain: 0.18, type: "sawtooth", freq: 233, freqEnd: 155, wet: 0.5 });
  noiseBurst({ when: 0.22, dur: 0.3, gain: 0.06, type: "lowpass", freq: 900, freqEnd: 300 });
}
