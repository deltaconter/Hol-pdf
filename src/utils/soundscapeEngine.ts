/**
 * Soundscape Engine (Ambiances sonores d'immersion)
 * Synthétiseur audio immersif Web Audio API 100% autonome, sans dépendance externe.
 * Génère des ambiances sonores douces et relaxantes à mixer sous la voix du narrateur.
 */

export type SoundscapeType = 'none' | 'rain' | 'fireplace' | 'cafe' | 'waves' | 'forest' | 'whitenoise';

export interface SoundscapeOption {
  id: SoundscapeType;
  name: string;
  emoji: string;
  description: string;
  tags: string;
}

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: 'none',
    name: 'Aucun (Silence)',
    emoji: '🔇',
    description: 'Lecture vocale pure sans ambiance sonore.',
    tags: 'Neutre',
  },
  {
    id: 'rain',
    name: 'Pluie apaisante',
    emoji: '🌧️',
    description: 'Averse régulière et gouttes douces sur une fenêtre.',
    tags: 'Focus & Détente',
  },
  {
    id: 'fireplace',
    name: 'Feu de cheminée',
    emoji: '🔥',
    description: 'Crépitements chaleureux et braises incandescentes.',
    tags: 'Cosy & Calme',
  },
  {
    id: 'cafe',
    name: 'Café & Murmures',
    emoji: '☕',
    description: 'Bruit de fond feutré d\'un salon de lecture parisien.',
    tags: 'Productivité',
  },
  {
    id: 'waves',
    name: 'Vagues de l\'océan',
    emoji: '🌊',
    description: 'Ressac régulier de la marée et brise marine.',
    tags: 'Méditation',
  },
  {
    id: 'forest',
    name: 'Forêt & Brise',
    emoji: '🌲',
    description: 'Vent doux dans les cimes et chants d\'oiseaux lointains.',
    tags: 'Nature',
  },
  {
    id: 'whitenoise',
    name: 'Bruit blanc & Ondes Alpha',
    emoji: '🌌',
    description: 'Fréquences harmoniques pour masquer les bruits parasites.',
    tags: 'Concentration max',
  },
];

class SoundscapeEngine {
  private audioCtx: AudioContext | null = null;
  private currentType: SoundscapeType = 'none';
  private masterGain: GainNode | null = null;
  private volume: number = 0.35; // 0.0 to 1.0 (default 35%)
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private listeners: ((type: SoundscapeType, isPlaying: boolean, volume: number) => void)[] = [];
  private playOnlyWithVoice: boolean = false;
  private isVoiceSpeaking: boolean = false;

  constructor() {
    // Lazy init on first user interaction
  }

  private initContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public subscribe(fn: (type: SoundscapeType, isPlaying: boolean, volume: number) => void) {
    this.listeners.push(fn);
    fn(this.currentType, this.isPlaying, this.volume);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.currentType, this.isPlaying, this.volume);
      } catch (err) {
        console.error('Soundscape listener error:', err);
      }
    });
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.audioCtx.currentTime,
        0.05
      );
    }
    this.notify();
  }

  public setVoiceSpeaking(speaking: boolean) {
    this.isVoiceSpeaking = speaking;
    if (this.playOnlyWithVoice) {
      if (speaking && !this.isPlaying && this.currentType !== 'none') {
        this.play(this.currentType);
      } else if (!speaking && this.isPlaying) {
        this.pause();
      }
    }
  }

  public setPlayOnlyWithVoice(onlyWithVoice: boolean) {
    this.playOnlyWithVoice = onlyWithVoice;
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else if (this.currentType !== 'none') {
      this.play(this.currentType);
    } else {
      this.play('rain'); // Default to rain if none chosen
    }
  }

  public setSoundscape(type: SoundscapeType) {
    if (type === 'none') {
      this.stop();
      this.currentType = 'none';
      this.notify();
      return;
    }

    this.currentType = type;
    this.play(type);
  }

  public play(type?: SoundscapeType) {
    const targetType = type || this.currentType;
    if (targetType === 'none') return;

    this.stopAudioNodes();
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.currentType = targetType;
    this.isPlaying = true;

    try {
      switch (targetType) {
        case 'rain':
          this.buildRainSoundscape(ctx);
          break;
        case 'fireplace':
          this.buildFireplaceSoundscape(ctx);
          break;
        case 'cafe':
          this.buildCafeSoundscape(ctx);
          break;
        case 'waves':
          this.buildWavesSoundscape(ctx);
          break;
        case 'forest':
          this.buildForestSoundscape(ctx);
          break;
        case 'whitenoise':
          this.buildWhiteNoiseSoundscape(ctx);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('Failed to build procedural soundscape:', err);
    }

    this.notify();
  }

  public pause() {
    this.stopAudioNodes();
    this.isPlaying = false;
    this.notify();
  }

  public stop() {
    this.stopAudioNodes();
    this.isPlaying = false;
    this.notify();
  }

  private stopAudioNodes() {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore node stop errors
      }
    });
    this.activeNodes = [];
  }

  // --- AUDIO SYNTHESIS GENERATORS (Web Audio API) ---

  /**
   * Helper: Creates pink noise buffer (warm continuous spectrum)
   */
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Helper: Creates brown noise buffer (deep, rumbling spectrum)
   */
  private createBrownNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }
    return buffer;
  }

  /**
   * 1. 🌧️ RAIN SOUNDSCAPE: Filtered pink noise + sporadic high droplets
   */
  private buildRainSoundscape(ctx: AudioContext) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    // Gentle rain low-pass filter
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1100, ctx.currentTime);

    // High droplet resonance filter
    const dropletFilter = ctx.createBiquadFilter();
    dropletFilter.type = 'peaking';
    dropletFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    dropletFilter.gain.setValueAtTime(4, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.75, ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(dropletFilter);
    dropletFilter.connect(rainGain);
    rainGain.connect(this.masterGain!);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lowpass, dropletFilter, rainGain);

    // Soft sporadic rain modulation (wind drift)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start();
    this.activeNodes.push(lfo, lfoGain);
  }

  /**
   * 2. 🔥 FIREPLACE SOUNDSCAPE: Warm low rumble + random crackle impulses
   */
  private buildFireplaceSoundscape(ctx: AudioContext) {
    // 1. Warm bed rumble (brown noise filtered)
    const brownBuffer = this.createBrownNoiseBuffer(ctx, 4);
    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = brownBuffer;
    rumbleSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(350, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.65, ctx.currentTime);

    rumbleSource.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(this.masterGain!);
    rumbleSource.start();
    this.activeNodes.push(rumbleSource, lowpass, rumbleGain);

    // 2. Periodic natural wood crackles using short filtered bursts
    const crackleInterval = setInterval(() => {
      if (!this.isPlaying || this.currentType !== 'fireplace' || !this.audioCtx) return;
      const count = Math.random() > 0.4 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          this.triggerWoodCrackle(this.audioCtx!);
        }, Math.random() * 180);
      }
    }, 450);

    this.activeNodes.push({
      stop: () => clearInterval(crackleInterval),
    });
  }

  private triggerWoodCrackle(ctx: AudioContext) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 1800, ctx.currentTime);
      filter.Q.setValueAtTime(6, ctx.currentTime);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 260, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22 + Math.random() * 0.15, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio node may be closing
    }
  }

  /**
   * 3. ☕ COFFEE SHOP SOUNDSCAPE: Warm ambient hubbub with gentle harmonics
   */
  private buildCafeSoundscape(ctx: AudioContext) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    // Filtered to sound like distant muffled conversations & warm acoustics
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(650, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain!);
    noiseSource.start();
    this.activeNodes.push(noiseSource, bandpass, gain);

    // Gentle random cup/plate chime simulation every few seconds
    const chimeInterval = setInterval(() => {
      if (!this.isPlaying || this.currentType !== 'cafe' || !this.audioCtx) return;
      if (Math.random() > 0.45) {
        this.triggerPorcelainChime(this.audioCtx);
      }
    }, 4500);

    this.activeNodes.push({
      stop: () => clearInterval(chimeInterval),
    });
  }

  private triggerPorcelainChime(ctx: AudioContext) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800 + Math.random() * 400, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // ignore
    }
  }

  /**
   * 4. 🌊 OCEAN WAVES SOUNDSCAPE: Modulated pink noise sweeping like incoming tides
   */
  private buildWavesSoundscape(ctx: AudioContext) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 6);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(450, ctx.currentTime);

    const wavesGain = ctx.createGain();
    wavesGain.gain.setValueAtTime(0.65, ctx.currentTime);

    // LFO for wave ebb and flow (7.5 second cycle)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.13, ctx.currentTime); // ~7.7s period
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(380, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    noiseSource.connect(lowpass);
    lowpass.connect(wavesGain);
    wavesGain.connect(this.masterGain!);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, lowpass, wavesGain, lfo, lfoGain);
  }

  /**
   * 5. 🌲 FOREST SOUNDSCAPE: Gentle wind breeze with harmonic rustling
   */
  private buildForestSoundscape(ctx: AudioContext) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const forestGain = ctx.createGain();
    forestGain.gain.setValueAtTime(0.4, ctx.currentTime);

    // Breeze fluctuation
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(280, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    noiseSource.connect(bandpass);
    bandpass.connect(forestGain);
    forestGain.connect(this.masterGain!);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, bandpass, forestGain, lfo, lfoGain);
  }

  /**
   * 6. 🌌 WHITE NOISE / ALPHA WAVES SOUNDSCAPE: Pure clean soothing frequencies
   */
  private buildWhiteNoiseSoundscape(ctx: AudioContext) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(750, ctx.currentTime);

    // Warm alpha tone generator at 10 Hz (binaural relaxation feel)
    const toneOsc = ctx.createOscillator();
    toneOsc.type = 'sine';
    toneOsc.frequency.setValueAtTime(174, ctx.currentTime); // Solfeggio soothing frequency 174 Hz
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.06, ctx.currentTime);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.5, ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(mainGain);
    mainGain.connect(this.masterGain!);

    toneOsc.connect(toneGain);
    toneGain.connect(this.masterGain!);

    noiseSource.start();
    toneOsc.start();
    this.activeNodes.push(noiseSource, lowpass, mainGain, toneOsc, toneGain);
  }
}

export const soundscapeEngine = new SoundscapeEngine();
