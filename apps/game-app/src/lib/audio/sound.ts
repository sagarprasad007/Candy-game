class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = true;
  public musicVolume: number = 0.5;

  private bgmMasterGain: GainNode | null = null;
  private chordInterval: any = null;
  private isBgmPlaying: boolean = false;
  private currentChordIdx: number = 0;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public resumeContext() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmMasterGain && this.ctx) {
      const targetGain = 0.04 * this.musicVolume;
      this.bgmMasterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.bgmMasterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.2);
    }
  }

  public startBgm() {
    if (!this.musicEnabled || this.isBgmPlaying) return;
    this.resumeContext();
    if (!this.ctx) return;

    try {
      this.bgmMasterGain = this.ctx.createGain();
      const targetGain = 0.04 * this.musicVolume;
      this.bgmMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.bgmMasterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 1.5);
      this.bgmMasterGain.connect(this.ctx.destination);

      // Chords: Cmaj7 -> Am7 -> Fmaj7 -> G7
      const chordProgression = [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [196.0, 246.94, 293.66, 349.23], // G7
      ];

      const playChordStep = () => {
        if (!this.isBgmPlaying || !this.ctx || !this.bgmMasterGain) return;
        const now = this.ctx.currentTime;
        const freqs = chordProgression[this.currentChordIdx];
        this.currentChordIdx = (this.currentChordIdx + 1) % chordProgression.length;

        freqs.forEach((f) => {
          const osc = this.ctx!.createOscillator();
          const noteGain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);

          // Soft attack and release envelope per chord pulse
          noteGain.gain.setValueAtTime(0.001, now);
          noteGain.gain.linearRampToValueAtTime(0.25, now + 1.2);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

          osc.connect(noteGain);
          noteGain.connect(this.bgmMasterGain!);

          osc.start(now);
          osc.stop(now + 3.9);
        });
      };

      this.isBgmPlaying = true;
      playChordStep();
      this.chordInterval = setInterval(playChordStep, 3500);
    } catch (e) {
      console.warn('BGM initialization error', e);
    }
  }

  public stopBgm() {
    if (this.chordInterval) {
      clearInterval(this.chordInterval);
      this.chordInterval = null;
    }
    if (this.bgmMasterGain && this.ctx) {
      try {
        this.bgmMasterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      } catch (_) {}
    }
    this.isBgmPlaying = false;
  }

  public duckBgm(ducking: boolean) {
    if (!this.bgmMasterGain || !this.ctx || !this.isBgmPlaying) return;
    const now = this.ctx.currentTime;
    const targetGain = ducking ? 0.01 * this.musicVolume : 0.04 * this.musicVolume;
    this.bgmMasterGain.gain.cancelScheduledValues(now);
    this.bgmMasterGain.gain.linearRampToValueAtTime(targetGain, now + (ducking ? 0.1 : 0.6));
  }

  playMatchSound(combo = 1, matchCount = 3) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 440 + combo * 110;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    // Sound layering: layer sparkle tail on 4+ matches or combo > 1
    if (matchCount >= 4 || combo > 1) {
      this.playSparkleSound();
    }
  }

  playSpecialSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    this.playSparkleSound();
  }

  playWinSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  playLossSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [400, 350, 300, 250];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  playEnvelopeSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playSparkleSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [880, 1174.66, 1396.91, 1760];
    freqs.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    });
  }
}

export const soundFx = new AudioManager();

