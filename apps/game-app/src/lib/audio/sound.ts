class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = true;

  private bgmGainNode: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private isBgmPlaying: boolean = false;
  private isDucked: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startBgm() {
    if (!this.musicEnabled || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.bgmGainNode.connect(this.ctx.destination);

      // Create ambient 3-chord looping synth pad (Cmaj7 -> Am7 -> Fmaj7)
      const freqs = [261.63, 329.63, 392.0, 493.88]; // C, E, G, B
      this.bgmOscs = freqs.map((f) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
        osc.connect(this.bgmGainNode!);
        osc.start();
        return osc;
      });

      this.isBgmPlaying = true;
    } catch (e) {
      console.warn('BGM initialization error', e);
    }
  }

  public stopBgm() {
    if (this.bgmOscs.length > 0) {
      this.bgmOscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      this.bgmOscs = [];
    }
    this.isBgmPlaying = false;
  }

  public duckMusic(durationMs = 600) {
    if (!this.bgmGainNode || !this.ctx || !this.isBgmPlaying) return;
    const now = this.ctx.currentTime;
    this.bgmGainNode.gain.cancelScheduledValues(now);
    this.bgmGainNode.gain.setValueAtTime(0.05, now); // Reduce by >50%
    this.bgmGainNode.gain.exponentialRampToValueAtTime(0.12, now + durationMs / 1000);
  }

  playMatchSound(combo = 1, matchCount = 3) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    this.duckMusic(500);

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

    this.duckMusic(700);

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

