/**
 * Boat Race Web Audio Synthesizer
 * Bộ tổng hợp âm thanh chuyên dụng cho Game Chèo Thuyền Đua Ngang
 * Không phụ thuộc file mp3/wav ngoài - chạy tức thì, mượt mà trên mọi trình duyệt
 */

class BoatAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.drumTempo = 110; // BPM
    this.masterGain = null;
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleSound(forceState) {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    if (!this.enabled && this.bgmPlaying) {
      this.stopDrumBgm();
    }
    return this.enabled;
  }

  // ==========================================
  // SFX: TIẾNG CHÈO NƯỚC (PADDLE SPLASH)
  // ==========================================
  playSplash(intensity = 1.0) {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for water turbulence
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to mimic water swoosh
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600 * intensity, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * Math.min(intensity, 1.5), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.18);
    } catch (e) {}
  }

  // ==========================================
  // SFX: TIẾNG TRỐNG NỆNH (DRUM BEAT)
  // ==========================================
  playDrum(isHeavy = false) {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const startFreq = isHeavy ? 140 : 180;
      const endFreq = isHeavy ? 45 : 55;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

      gain.gain.setValueAtTime(isHeavy ? 0.8 : 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.25 : 0.18));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + (isHeavy ? 0.25 : 0.18));
    } catch (e) {}
  }

  // ==========================================
  // SFX: TIẾNG CÒI ĐẾM NGƯỢC (COUNTDOWN BEEP & HORN)
  // ==========================================
  playCountdownBeep(isFinal = false) {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (!isFinal) {
        // 3, 2, 1 Short Beep
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // GO! Air Horn
        const osc2 = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc2.type = "sawtooth";

        osc.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(880, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.7);
        osc2.stop(now + 0.7);
      }
    } catch (e) {}
  }

  // ==========================================
  // SFX: TIẾNG BỨT TỐC (NITRO / COMBO BOOST)
  // ==========================================
  playBoost() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // ==========================================
  // SFX: TIẾNG LỆCH TAY (STUMBLE / MISSED STROKE)
  // ==========================================
  playStumble() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // ==========================================
  // SFX: TIẾNG VỀ ĐÍCH & CHIẾN THẮNG (VICTORY FANFARE)
  // ==========================================
  playVictory() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.15, t: 0 },    // C5
        { f: 659.25, d: 0.15, t: 0.15 }, // E5
        { f: 783.99, d: 0.15, t: 0.3 },  // G5
        { f: 1046.5, d: 0.5, t: 0.45 }   // C6
      ];

      notes.forEach((n) => {
        const now = this.ctx.currentTime + n.t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.d);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + n.d);
      });
    } catch (e) {}
  }

  // ==========================================
  // BGM: TIẾNG TRỐNG HỘI DỒN DẬP (FESTIVAL RACE DRUMS)
  // ==========================================
  startDrumBgm(tempo = 120) {
    if (this.bgmPlaying) return;
    this._initCtx();
    this.bgmPlaying = true;
    this.drumTempo = tempo;

    let step = 0;
    const interval = (60 / this.drumTempo) * 1000 / 2; // 8th notes

    const tick = () => {
      if (!this.bgmPlaying) return;

      // Pattern: Tùng - cắc - Tùng - Tùng - cắc (Dragon boat cadence)
      if (step % 4 === 0) {
        this.playDrum(true); // Tùng lớn
      } else if (step % 4 === 2) {
        this.playDrum(false); // Cắc / gõ nhịp
      } else if (step % 8 === 7) {
        this.playDrum(true); // Giục dã
      }

      step = (step + 1) % 16;
      this.bgmTimer = setTimeout(tick, interval);
    };

    tick();
  }

  setTempo(bpm) {
    this.drumTempo = Math.min(220, Math.max(90, bpm));
  }

  stopDrumBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

if (typeof window !== "undefined") {
  window.BoatAudio = BoatAudio;
}
