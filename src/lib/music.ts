/**
 * Background music — a gentle, generative chiptune loop synthesized live with
 * the Web Audio API (no audio files, fully offline). Deliberately sparse and
 * low-volume so it sits under the sound effects. Gated by a settings toggle.
 */
let enabled = false;
let playing = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;

// A calm pentatonic loop (two bars), with an occasional bass note.
const MELODY = [440, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25];
const BASS = [110, 0, 146.83, 0, 130.81, 0, 164.81, 0];
const BEAT_MS = 430;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq: number, durMs: number, gain: number, type: OscillatorType): void {
  const c = ctx;
  if (!c || !master || freq <= 0) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

function tick(): void {
  blip(MELODY[step % MELODY.length], 360, 0.5, 'triangle');
  blip(BASS[step % BASS.length], 240, 0.6, 'sine');
  step++;
}

export function startMusic(): void {
  if (!enabled || playing) return;
  const c = ac();
  if (!c || !master) return;
  playing = true;
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setValueAtTime(master.gain.value, c.currentTime);
  master.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.6); // subtle bed
  tick();
  timer = setInterval(tick, BEAT_MS);
}

export function stopMusic(): void {
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  }
}

export function setMusicEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopMusic();
}
