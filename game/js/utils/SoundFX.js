class SoundManager {
  constructor() {
    this.muted = false;
    this.ctx = null;
    this.bgmTimer = null;
    this.currentTrack = null;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopBGM();
    else if (this.currentTrack) this.playBGM(this.currentTrack, true);
    return this.muted;
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // Bombo electrónico (Kick)
  playKick(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.11);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Hi-Hat electrónico
  playHat(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(6200, now);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Bajo synthwave con filtro
  playBass(now, freq, dur) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  // Melodía synth moderna
  playLead(now, freq, dur, wave = 'triangle') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.004, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  playBGM(track, force = false) {
    if (this.currentTrack === track && this.bgmTimer && !force) return;
    this.currentTrack = track;
    this.stopBGM();
    if (this.muted) return;

    this.init();
    this.step = 0;

    // Pistas electrónicas movidas (secuenciador de 16 pasos)
    const tracks = {
      menu: {
        tempo: 135, // ~111 BPM en semicorcheas
        bass: [110, 0, 110, 110, 130.8, 0, 130.8, 0, 98, 0, 98, 98, 146.8, 0, 130.8, 0],
        lead: [440, 0, 523.2, 659.2, 0, 523.2, 440, 0, 392, 0, 493.8, 587.3, 0, 523.2, 440, 0]
      },
      game: {
        tempo: 112, // ~134 BPM bien movido
        bass: [130.8, 130.8, 0, 130.8, 155.6, 0, 174.6, 0, 116.5, 116.5, 0, 116.5, 146.8, 0, 155.6, 174.6],
        lead: [523.2, 0, 622.2, 698.4, 784.0, 0, 698.4, 622.2, 587.3, 0, 698.4, 784.0, 932.3, 0, 784.0, 698.4]
      },
      boss: {
        tempo: 95, // ~158 BPM intenso
        bass: [98, 98, 116.5, 98, 130.8, 98, 146.8, 130.8, 98, 98, 116.5, 98, 155.6, 146.8, 130.8, 116.5],
        lead: [392, 466.1, 587.3, 466.1, 622.2, 587.3, 466.1, 392, 784, 0, 698.4, 622.2, 587.3, 0, 466.1, 587.3]
      }
    };

    const cfg = tracks[track] || tracks.game;

    this.bgmTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;

      const idx = this.step % 16;
      const now = this.ctx.currentTime;
      const dur = (cfg.tempo / 1000) * 0.9;

      // Ritmo electrónico: Kick en 0, 4, 8, 12 | Hi-Hat en contratiempos
      if (idx % 4 === 0) this.playKick(now);
      if (idx % 2 === 1) this.playHat(now);

      // Bajo y melodía
      if (cfg.bass[idx]) this.playBass(now, cfg.bass[idx], dur);
      if (cfg.lead[idx]) this.playLead(now, cfg.lead[idx], dur, track === 'boss' ? 'sawtooth' : 'triangle');

      this.step++;
    }, cfg.tempo);
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'place':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'explode':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.25);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      case 'shard':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      case 'powerup':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.18);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      case 'skill':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1020, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      case 'dialog':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.2);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'dash':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
    }
  }
}

export const SoundFX = new SoundManager();