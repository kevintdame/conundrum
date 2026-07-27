// Built-in Web Audio API Sound Synthesizer (Zero External Dependencies)
class AudioEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Soft tactile button tap sound
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Success Chime (C5 -> E5 -> G5 Major Chord)
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + idx * 0.08;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Dramatic Comical Cartoon Failure Sound (Descending Wah-Wah Slide)
  playFailure() {
    try {
      this.init();
      if (!this.ctx) return;

      const steps = [
        { startFreq: 340, endFreq: 300, duration: 0.15, delay: 0 },
        { startFreq: 300, endFreq: 260, duration: 0.15, delay: 0.14 },
        { startFreq: 260, endFreq: 220, duration: 0.15, delay: 0.28 },
        { startFreq: 220, endFreq: 110, duration: 0.45, delay: 0.42 } // Long comical low slide
      ];

      steps.forEach((step) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + step.delay;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(step.startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(step.endFreq, startTime + step.duration);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + step.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + step.duration);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }
}

export const soundEffects = new AudioEffects();
