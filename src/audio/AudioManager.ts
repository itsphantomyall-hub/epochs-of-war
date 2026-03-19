/**
 * AudioManager -- singleton that owns the AudioContext and routes all game audio.
 * Lazy-inits AudioContext on first user interaction (browser autoplay policy).
 * Master GainNode → SFX GainNode + Music GainNode.
 * Reads SettingsManager for volume levels.
 * No external audio files -- all sounds are procedural via Web Audio API.
 */

import { SettingsManager } from '../core/managers/SettingsManager';
import { SFX_LIBRARY } from './SFXLibrary';
import { MusicController } from './MusicController';

let instance: AudioManager | null = null;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicController: MusicController;
  private settings: SettingsManager;
  private contextResumed: boolean = false;
  private pendingMusicTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.musicController = new MusicController();
    this.settings = SettingsManager.getInstance();
  }

  static getInstance(): AudioManager {
    if (!instance) {
      instance = new AudioManager();
    }
    return instance;
  }

  // ── Context lifecycle ──────────────────────────────────

  /** Lazily create the AudioContext and gain node graph. */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;

    try {
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
    } catch {
      // Web Audio not available
      return null;
    }
    return this.ctx;
  }

  /**
   * Resume the AudioContext. Call on first user click / pointerdown
   * to satisfy browser autoplay policy.
   */
  resumeContext(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* ignore */ });
    }
    this.contextResumed = true;
  }

  // ── Volume control ─────────────────────────────────────

  /** Read volumes from SettingsManager and apply to gain nodes. */
  private applyVolumes(): void {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;

    const master = this.settings.get('masterVolume') / 100;
    const sfx = this.settings.get('sfxVolume') / 100;
    const music = this.settings.get('musicVolume') / 100;

    this.masterGain.gain.value = master;
    this.sfxGain.gain.value = sfx;
    this.musicGain.gain.value = music;
  }

  setMasterVolume(v: number): void {
    this.settings.set('masterVolume', Math.round(v * 100));
    this.applyVolumes();
  }

  setSFXVolume(v: number): void {
    this.settings.set('sfxVolume', Math.round(v * 100));
    this.applyVolumes();
  }

  setMusicVolume(v: number): void {
    this.settings.set('musicVolume', Math.round(v * 100));
    this.applyVolumes();
  }

  // ── SFX ────────────────────────────────────────────────

  /** Play a named sound effect from SFXLibrary. */
  playSFX(name: string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    // Re-read settings volumes each call
    this.applyVolumes();

    const fn = SFX_LIBRARY[name];
    if (fn) {
      fn(ctx, this.sfxGain);
    }
  }

  // ── Music ──────────────────────────────────────────────

  /** Start age-appropriate ambient music loop. */
  playMusic(age: number): void {
    // Cancel any pending music start to avoid race conditions on rapid evolution
    if (this.pendingMusicTimeout) {
      clearTimeout(this.pendingMusicTimeout);
      this.pendingMusicTimeout = null;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    this.applyVolumes();
    this.musicController.stop();

    // Small delay to let previous fade finish
    this.pendingMusicTimeout = setTimeout(() => {
      this.pendingMusicTimeout = null;
      if (this.ctx && this.musicGain) {
        this.musicController.startAge(this.ctx, this.musicGain, age);
      }
    }, 100);
  }

  /** Stop current music with 500ms fadeout. */
  stopMusic(): void {
    if (this.pendingMusicTimeout) {
      clearTimeout(this.pendingMusicTimeout);
      this.pendingMusicTimeout = null;
    }
    this.musicController.stop();
  }
}
