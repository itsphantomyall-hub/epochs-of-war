/**
 * SFXLibrary -- procedural sound effects using Web Audio API.
 * Each function creates oscillator + gain envelope combos and plays them immediately.
 * No external audio files required.
 */

type SFXFunction = (ctx: AudioContext, destination: AudioNode) => void;

/** Create a noise buffer (white noise) of the given duration in seconds. */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Play a noise burst with gain envelope. */
function playNoise(
  ctx: AudioContext,
  destination: AudioNode,
  duration: number,
  volume: number = 0.3,
): void {
  const buffer = createNoiseBuffer(ctx, duration);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(gain);
  gain.connect(destination);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration);
}

/** Play an oscillator with attack/decay envelope. */
function playTone(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume: number = 0.3,
  startTime: number = 0,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);

  return osc;
}

// ── SFX Definitions ──────────────────────────────────────────

const hit_light: SFXFunction = (ctx, dest) => {
  playTone(ctx, dest, 80, 'sine', 0.05, 0.25);
};

const hit_heavy: SFXFunction = (ctx, dest) => {
  playTone(ctx, dest, 60, 'sine', 0.15, 0.35);
  playNoise(ctx, dest, 0.15, 0.2);
};

const explosion_small: SFXFunction = (ctx, dest) => {
  playNoise(ctx, dest, 0.3, 0.4);
  playTone(ctx, dest, 100, 'sine', 0.3, 0.3);
};

const explosion_large: SFXFunction = (ctx, dest) => {
  playNoise(ctx, dest, 0.5, 0.5);
  playTone(ctx, dest, 60, 'sine', 0.5, 0.4);
};

const coin: SFXFunction = (ctx, dest) => {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

const evolve: SFXFunction = (ctx, dest) => {
  // C-E-G arpeggio (523, 659, 784 Hz)
  const notes = [523, 659, 784];
  const noteLen = 0.15;
  for (let i = 0; i < notes.length; i++) {
    playTone(ctx, dest, notes[i], 'sine', noteLen + 0.05, 0.25, i * noteLen);
  }
};

const spawn: SFXFunction = (ctx, dest) => {
  playTone(ctx, dest, 200, 'sine', 0.03, 0.15);
};

const death: SFXFunction = (ctx, dest) => {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
};

const button_click: SFXFunction = (ctx, dest) => {
  playTone(ctx, dest, 1000, 'sine', 0.02, 0.15);
};

const ability: SFXFunction = (ctx, dest) => {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
  osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
};

const special_fire: SFXFunction = (ctx, dest) => {
  // Explosion + sine tail
  playNoise(ctx, dest, 0.4, 0.4);
  playTone(ctx, dest, 200, 'sine', 0.4, 0.3);
  playTone(ctx, dest, 80, 'sine', 0.4, 0.2);
};

const warning: SFXFunction = (ctx, dest) => {
  // Two short square wave pulses at 440Hz
  playTone(ctx, dest, 440, 'square', 0.08, 0.15, 0);
  playTone(ctx, dest, 440, 'square', 0.08, 0.15, 0.12);
};

const victory: SFXFunction = (ctx, dest) => {
  // C major chord (C4=262, E4=330, G4=392) sustained 1s
  const notes = [262, 330, 392];
  for (const freq of notes) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
  }
};

const defeat: SFXFunction = (ctx, dest) => {
  // C minor chord descending (C4=262, Eb4=311, G4=392) → lower
  const notes = [392, 311, 262];
  const noteLen = 0.3;
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(notes[i], ctx.currentTime + i * noteLen);
    osc.frequency.linearRampToValueAtTime(
      notes[i] * 0.7,
      ctx.currentTime + i * noteLen + noteLen,
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * noteLen);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + i * noteLen + noteLen,
    );

    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime + i * noteLen);
    osc.stop(ctx.currentTime + i * noteLen + noteLen + 0.05);
  }
};

// ── Export map ──────────────────────────────────────────

export const SFX_LIBRARY: Record<string, SFXFunction> = {
  hit_light,
  hit_heavy,
  explosion_small,
  explosion_large,
  coin,
  evolve,
  spawn,
  death,
  button_click,
  ability,
  special_fire,
  warning,
  victory,
  defeat,
};
