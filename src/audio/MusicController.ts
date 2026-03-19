/**
 * MusicController -- procedural ambient music per age using Web Audio API.
 * Uses oscillator drones, arpeggios, and noise bursts. No external files.
 */

export class MusicController {
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private intervals: number[] = [];
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private masterGain: GainNode | null = null;
  private active: boolean = false;

  /**
   * Start age-appropriate ambient music.
   */
  startAge(ctx: AudioContext, destination: AudioNode, age: number): void {
    this.stopImmediate();
    this.ctx = ctx;
    this.destination = destination;
    this.active = true;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.3);
    this.masterGain.connect(destination);

    if (age === 1) {
      this.playAge1(ctx);
    } else if (age <= 3) {
      this.playAge2_3(ctx, age);
    } else if (age <= 5) {
      this.playAge4_5(ctx, age);
    } else if (age <= 7) {
      this.playAge6_7(ctx, age);
    } else {
      this.playAge8(ctx);
    }
  }

  /** Stop music with 500ms fadeout. */
  stop(): void {
    if (!this.active || !this.masterGain || !this.ctx) {
      this.stopImmediate();
      return;
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.5);

    // Clean up after fade
    const ctx = this.ctx;
    const oscs = [...this.oscillators];
    const gains = [...this.gainNodes];
    const intervals = [...this.intervals];
    const master = this.masterGain;

    setTimeout(() => {
      for (const interval of intervals) {
        clearInterval(interval);
      }
      for (const osc of oscs) {
        try { osc.stop(); } catch { /* already stopped */ }
        try { osc.disconnect(); } catch { /* ignore */ }
      }
      for (const g of gains) {
        try { g.disconnect(); } catch { /* ignore */ }
      }
      try { master.disconnect(); } catch { /* ignore */ }
    }, 550);

    this.oscillators = [];
    this.gainNodes = [];
    this.intervals = [];
    this.masterGain = null;
    this.active = false;
  }

  /** Immediately stop all sound without fade. */
  private stopImmediate(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      try { osc.disconnect(); } catch { /* ignore */ }
    }
    for (const g of this.gainNodes) {
      try { g.disconnect(); } catch { /* ignore */ }
    }
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch { /* ignore */ }
    }
    this.oscillators = [];
    this.gainNodes = [];
    this.intervals = [];
    this.masterGain = null;
    this.active = false;
  }

  // ── Age 1: 80Hz drone + sporadic noise bursts every 2s ──

  private playAge1(ctx: AudioContext): void {
    const dest = this.masterGain!;

    // Drone
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(80, ctx.currentTime);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(dest);
    drone.start(ctx.currentTime);
    this.oscillators.push(drone);
    this.gainNodes.push(droneGain);

    // Sporadic drum-like noise bursts
    const interval = window.setInterval(() => {
      if (!this.active) return;
      const noiseLen = 0.08;
      const buffer = this.createNoiseBuffer(ctx, noiseLen);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noiseLen);
      source.connect(g);
      g.connect(dest);
      source.start(ctx.currentTime);
    }, 2000);
    this.intervals.push(interval);
  }

  // ── Age 2-3: drone + 4-note pentatonic arpeggio ──

  private playAge2_3(ctx: AudioContext, age: number): void {
    const dest = this.masterGain!;
    const droneFreq = age === 2 ? 90 : 100;

    // Drone
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(droneFreq, ctx.currentTime);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.06, ctx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(dest);
    drone.start(ctx.currentTime);
    this.oscillators.push(drone);
    this.gainNodes.push(droneGain);

    // Pentatonic arpeggio: C D E G A (262, 294, 330, 392, 440)
    const notes = [262, 294, 330, 392];
    let noteIndex = 0;

    const interval = window.setInterval(() => {
      if (!this.active) return;
      const freq = notes[noteIndex % notes.length];
      noteIndex++;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(g);
      g.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }, 200);
    this.intervals.push(interval);
  }

  // ── Age 4-5: chord progression I-IV-V-I, 2s per chord ──

  private playAge4_5(ctx: AudioContext, age: number): void {
    const dest = this.masterGain!;

    // Chords in C major: I (C-E-G), IV (F-A-C), V (G-B-D), I (C-E-G)
    const chords = [
      [262, 330, 392],
      [349, 440, 523],
      [392, 494, 587],
      [262, 330, 392],
    ];
    let chordIndex = 0;
    let currentOscs: OscillatorNode[] = [];

    const playChord = () => {
      if (!this.active) return;

      // Stop previous chord
      for (const o of currentOscs) {
        try { o.stop(); } catch { /* ignore */ }
      }
      currentOscs = [];

      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      for (const freq of chord) {
        const osc = ctx.createOscillator();
        osc.type = age === 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        g.gain.setValueAtTime(0.05, ctx.currentTime + 1.6);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.95);
        osc.connect(g);
        g.connect(dest);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.0);
        currentOscs.push(osc);
        this.gainNodes.push(g);
      }
    };

    playChord();
    const interval = window.setInterval(playChord, 2000);
    this.intervals.push(interval);
  }

  // ── Age 6-7: faster arpeggio + rhythmic pulse ──

  private playAge6_7(ctx: AudioContext, age: number): void {
    const dest = this.masterGain!;

    // Bass pulse
    const bassInterval = window.setInterval(() => {
      if (!this.active) return;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(age === 6 ? 55 : 50, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(g);
      g.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }, 500);
    this.intervals.push(bassInterval);

    // Fast arpeggio
    const notes = age === 6
      ? [330, 392, 494, 587, 659, 587, 494, 392]
      : [349, 440, 523, 659, 784, 659, 523, 440];
    let noteIndex = 0;

    const arpInterval = window.setInterval(() => {
      if (!this.active) return;
      const freq = notes[noteIndex % notes.length];
      noteIndex++;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.03, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(g);
      g.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }, 150);
    this.intervals.push(arpInterval);
  }

  // ── Age 8: synth pad (2 detuned oscillators) + fast arpeggio ──

  private playAge8(ctx: AudioContext): void {
    const dest = this.masterGain!;

    // Synth pad: two detuned oscillators
    const pad1 = ctx.createOscillator();
    pad1.type = 'sine';
    pad1.frequency.setValueAtTime(220, ctx.currentTime);
    const pad2 = ctx.createOscillator();
    pad2.type = 'sine';
    pad2.frequency.setValueAtTime(223, ctx.currentTime); // slightly detuned

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.06, ctx.currentTime);
    pad1.connect(padGain);
    pad2.connect(padGain);
    padGain.connect(dest);
    pad1.start(ctx.currentTime);
    pad2.start(ctx.currentTime);
    this.oscillators.push(pad1, pad2);
    this.gainNodes.push(padGain);

    // Fast sci-fi arpeggio
    const notes = [523, 659, 784, 1047, 784, 659, 523, 440];
    let noteIndex = 0;

    const arpInterval = window.setInterval(() => {
      if (!this.active) return;
      const freq = notes[noteIndex % notes.length];
      noteIndex++;

      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.025, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(g);
      g.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }, 120);
    this.intervals.push(arpInterval);
  }

  // ── Utility ──

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
