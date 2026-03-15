class MusicEngine {

  constructor() {
    this.ctx = null;
    this.timers = [];
    this.i = 0;
    this.currentTheme = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play(freq, duration = 0.35, type = "square", volume = 0.15) {

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration
    );

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playChord(freqs, duration = 0.6) {
    freqs.forEach(f => this.play(f, duration, "triangle", 0.08));
  }

  playTheme(theme) {

    this.init();

    this.currentTheme = theme;

    const beat = (60 / theme.tempo) * 1000;

    this.stop();

    this.i = 0;

    const timer = setInterval(() => {

      const m = theme.melody[this.i % theme.melody.length];
      const b = theme.bass[this.i % theme.bass.length];
      const c = theme.chords[this.i % theme.chords.length];

      this.play(m, 0.35, "square", 0.15);     // melodia
      this.play(b, 0.45, "sawtooth", 0.12);   // basso
      this.playChord(c, 0.6);                 // accordo

      this.i++;

    }, beat);

    this.timers.push(timer);

  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
  }

  async resume() {
    this.init();

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (this.currentTheme) {
      this.playTheme(this.currentTheme);
    }
  }
}

export default new MusicEngine();