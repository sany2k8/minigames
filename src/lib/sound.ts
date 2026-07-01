/**
 * Tiny offline sound engine. Everything is synthesized with the Web Audio API
 * at call time — no audio assets to download, so it works fully offline (PWA)
 * and adds nothing to the bundle. Mirrors the haptics module: a global setting
 * gates it, and a delegated pointer listener gives every tap a click without
 * wiring each element.
 */
let enabled = true;
let ctx: AudioContext | null = null;

export const setSoundEnabled = (on: boolean) => {
  enabled = on;
};

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // Browsers start the context suspended until a user gesture; resume lazily.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

type Wave = OscillatorType;

/** Play a single shaped tone. Internal building block for the named cues. */
function tone(
  freq: number,
  durMs: number,
  {
    type = 'sine',
    gain = 0.18,
    delayMs = 0,
    slideTo
  }: { type?: Wave; gain?: number; delayMs?: number; slideTo?: number } = {}
): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delayMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + durMs / 1000);
  // Quick attack, smooth exponential release — avoids clicks/pops.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

/** Short noise burst (for hits, explosions, "whack"). */
function noise(durMs: number, gain = 0.18): void {
  const c = ac();
  if (!c) return;
  const frames = Math.floor((c.sampleRate * durMs) / 1000);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(c.destination);
  src.start();
}

/** Play a sequence of [freq, durationMs] steps back to back. */
function arp(steps: [number, number][], opts: { type?: Wave; gain?: number } = {}): void {
  let at = 0;
  for (const [f, d] of steps) {
    tone(f, d, { ...opts, delayMs: at });
    at += d;
  }
}

/* ------------------------------------------------------------------ */
/* Named cues — call these from games / the engine.                    */
/* ------------------------------------------------------------------ */
export const sound = {
  /** Countdown beep (3, 2, 1). */
  tick: () => tone(660, 120, { type: 'triangle', gain: 0.16 }),
  /** "GO!" — bright rising chime that kicks off play. */
  go: () => arp(
    [
      [660, 90],
      [990, 160]
    ],
    { type: 'triangle', gain: 0.2 }
  ),
  /** Generic UI tap. */
  click: () => tone(420, 35, { type: 'square', gain: 0.05 }),
  /** Selecting / picking something up. */
  select: () => tone(560, 60, { type: 'triangle', gain: 0.12 }),
  /** Placing a piece / committing a move. */
  place: () => tone(330, 70, { type: 'sine', gain: 0.14, slideTo: 420 }),
  /** A piece sliding / moving. */
  move: () => tone(300, 55, { type: 'sine', gain: 0.1, slideTo: 360 }),
  /** Light positive pop (merge, pair, capture). */
  pop: () => tone(720, 90, { type: 'triangle', gain: 0.16, slideTo: 900 }),
  /** A distinct musical pad tone, by index — for Simon-style games. */
  pad: (i: number) => tone([329.63, 415.3, 246.94, 523.25][((i % 4) + 4) % 4], 300, { type: 'sine', gain: 0.2 }),
  /** Merge / combine two tiles (rises with the chain length). */
  merge: (step = 0) => tone(440 + step * 70, 110, { type: 'triangle', gain: 0.17, slideTo: 660 + step * 90 }),
  /** Dropping a piece into place (e.g. a disc). */
  drop: () => tone(300, 120, { type: 'sine', gain: 0.16, slideTo: 160 }),
  /** Clearing a line / matching a set. */
  clear: () => arp(
    [
      [600, 70],
      [800, 70],
      [1000, 110]
    ],
    { type: 'triangle', gain: 0.16 }
  ),
  /** Scoring a point / collecting. */
  coin: () => arp(
    [
      [880, 60],
      [1320, 110]
    ],
    { type: 'square', gain: 0.1 }
  ),
  /** A solid hit / impact. */
  hit: () => noise(90, 0.16),
  /** Invalid move / error buzz. */
  error: () => tone(180, 180, { type: 'sawtooth', gain: 0.12, slideTo: 110 }),
  /** Win fanfare. */
  win: () => arp(
    [
      [523, 120],
      [659, 120],
      [784, 120],
      [1047, 260]
    ],
    { type: 'triangle', gain: 0.2 }
  ),
  /** Loss / game-over slump. */
  lose: () => arp(
    [
      [392, 160],
      [330, 160],
      [262, 320]
    ],
    { type: 'sawtooth', gain: 0.14 }
  )
};

/* A small throttle so dragging / rapid taps don't machine-gun clicks. */
let lastClick = 0;
const INTERACTIVE =
  'button, a, [role="button"], .gcard, .tile, .chip, .sm-pad, input[type="button"], .cell, .pane-board';

/** Attach once: a subtle click on taps of interactive elements & game boards. */
export function initGlobalSound(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (!enabled) return;
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest(INTERACTIVE)) return;
      const now = performance.now();
      if (now - lastClick < 45) return;
      lastClick = now;
      sound.click();
    },
    { passive: true }
  );
}
