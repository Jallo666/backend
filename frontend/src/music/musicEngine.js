// ── RPG Music Engine ─────────────────────────────────────────────────────────
// Ogni tema può avere: melody, bass, chords, counter, pad, rhythm
// Ogni traccia è configurabile: strumento, volume, durata nota (in beat)

class MusicEngine {
  constructor() {
    this.ctx          = null;
    this.timers       = [];
    this.step         = 0;
    this.currentTheme = null;
    this.masterGain   = null;
    this.compressor   = null;
    this.reverbNode   = null;
    this.reverbReturn = null;
  }

  // ── Setup ─────────────────────────────────────────────────────────────────
  _initCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Compressor – coesione del mix
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value      = 10;
    this.compressor.ratio.value     = 4;
    this.compressor.attack.value    = 0.003;
    this.compressor.release.value   = 0.25;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.82;

    // Reverb convolver con impulso sintetico
    this.reverbNode   = this._buildReverb(2.0, 0.38);
    this.reverbReturn = this.ctx.createGain();
    this.reverbReturn.gain.value = 0.2; // sovrascritto per tema

    this.compressor.connect(this.masterGain);
    this.reverbNode.connect(this.reverbReturn);
    this.reverbReturn.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  init() { this._initCtx(); }

  _buildReverb(durSec, decay) {
    const sr  = this.ctx.sampleRate;
    const len = Math.floor(sr * durSec);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay * 3);
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  // Manda gain node sia al dry bus che al reverb
  _send(g) {
    g.connect(this.compressor);
    g.connect(this.reverbNode);
  }

  // ADSR semplificato
  _env(g, t, vol, atk, dec, sus, rel, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol,       t + atk);
    g.gain.linearRampToValueAtTime(vol * sus, t + atk + dec);
    const rs = Math.max(t + atk + dec + 0.001, t + dur - rel);
    g.gain.setValueAtTime(vol * sus, rs);
    g.gain.linearRampToValueAtTime(0.0001,    t + dur);
  }

  // ── Strumenti ─────────────────────────────────────────────────────────────

  // Flauto: sine + 2° armonica debole + vibrato LFO
  _flute(freq, t, dur, vol) {
    const ctx = this.ctx;
    const g   = ctx.createGain();
    const os  = ctx.createOscillator();
    const os2 = ctx.createOscillator();
    const g2  = ctx.createGain();

    os.type  = 'sine'; os.frequency.value  = freq;
    os2.type = 'sine'; os2.frequency.value = freq * 2;

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 5.2;
    lfoG.gain.value = freq * 0.011;
    lfo.connect(lfoG); lfoG.connect(os.frequency);

    g2.gain.value = 0.13;
    os2.connect(g2); g2.connect(g); os.connect(g);
    this._env(g, t, vol, 0.04, 0.05, 0.84, 0.07, dur);
    this._send(g);

    const e = t + dur + 0.1;
    os.start(t); os.stop(e);
    os2.start(t); os2.stop(e);
    lfo.start(t); lfo.stop(e);
  }

  // Archi: 3 triangle detuned + vibrato → suono ricco e caldo
  _strings(freq, t, dur, vol) {
    [0, 7, -7].forEach((cents, k) => {
      const ctx = this.ctx;
      const os  = ctx.createOscillator();
      const g   = ctx.createGain();
      os.type = 'triangle';
      os.frequency.value = freq * Math.pow(2, cents / 1200);

      const lfo  = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 4.8 + k * 0.4;
      lfoG.gain.value = freq * 0.007;
      lfo.connect(lfoG); lfoG.connect(os.frequency);

      os.connect(g);
      this._env(g, t, vol / 3, 0.06, 0.08, 0.8, 0.1, dur);
      this._send(g);

      const e = t + dur + 0.12;
      os.start(t); os.stop(e);
      lfo.start(t); lfo.stop(e);
    });
  }

  // Archi leggeri: 1 triangle + vibrato (per accordi, risparmia CPU)
  _stringsLight(freq, t, dur, vol) {
    const ctx = this.ctx;
    const os  = ctx.createOscillator();
    const g   = ctx.createGain();
    os.type = 'triangle'; os.frequency.value = freq;

    const lfo  = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 4.5;
    lfoG.gain.value = freq * 0.006;
    lfo.connect(lfoG); lfoG.connect(os.frequency);

    os.connect(g);
    this._env(g, t, vol, 0.06, 0.08, 0.75, 0.1, dur);
    this._send(g);

    const e = t + dur + 0.12;
    os.start(t); os.stop(e);
    lfo.start(t); lfo.stop(e);
  }

  // Ottoni: sawtooth + lowpass filter → potente e tagliente
  _brass(freq, t, dur, vol) {
    const ctx  = this.ctx;
    const os   = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g    = ctx.createGain();

    os.type = 'sawtooth'; os.frequency.value = freq;
    filt.type = 'lowpass'; filt.frequency.value = freq * 5; filt.Q.value = 1.8;

    os.connect(filt); filt.connect(g);
    this._env(g, t, vol, 0.015, 0.05, 0.75, 0.05, dur);
    this._send(g);
    os.start(t); os.stop(t + dur + 0.08);
  }

  // Basso: sine + ottava superiore → rotondo e profondo
  _bass(freq, t, dur, vol) {
    const ctx = this.ctx;
    const os  = ctx.createOscillator();
    const os2 = ctx.createOscillator();
    const g   = ctx.createGain();
    const g2  = ctx.createGain();

    os.type  = 'sine'; os.frequency.value  = freq;
    os2.type = 'sine'; os2.frequency.value = freq * 2;
    g2.gain.value = 0.18;
    os2.connect(g2); g2.connect(g); os.connect(g);
    this._env(g, t, vol, 0.012, 0.09, 0.72, 0.12, dur);
    this._send(g);

    const e = t + dur + 0.1;
    os.start(t); os.stop(e); os2.start(t); os2.stop(e);
  }

  // Pad: stack sine (fondamentale + 5a + 8a + 8a bassa) → atmosferico
  _pad(freq, t, dur, vol) {
    [1, 1.5, 2, 0.5].forEach((ratio, k) => {
      const ctx = this.ctx;
      const os  = ctx.createOscillator();
      const g   = ctx.createGain();
      os.type = 'sine'; os.frequency.value = freq * ratio;
      os.connect(g);
      const v = vol * [1, 0.45, 0.28, 0.38][k];
      this._env(g, t, v, 0.2, 0.1, 0.9, 0.22, dur);
      this._send(g);
      os.start(t); os.stop(t + dur + 0.3);
    });
  }

  // Pizzico/liuto: triangle, decay rapido
  _pluck(freq, t, dur, vol) {
    const ctx = this.ctx;
    const os  = ctx.createOscillator();
    const g   = ctx.createGain();
    os.type = 'triangle'; os.frequency.value = freq;
    os.connect(g);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.65, 0.55));
    this._send(g);
    os.start(t); os.stop(t + 0.65);
  }

  // Arpa: sine+triangle blend, decay medio
  _harp(freq, t, dur, vol) {
    const ctx = this.ctx;
    const os  = ctx.createOscillator();
    const os2 = ctx.createOscillator();
    const g   = ctx.createGain();
    const g2  = ctx.createGain();
    os.type  = 'sine';     os.frequency.value  = freq;
    os2.type = 'triangle'; os2.frequency.value = freq;
    g2.gain.value = 0.35; os2.connect(g2); g2.connect(g); os.connect(g);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur * 0.85, 0.75));
    this._send(g);
    const e = t + 0.85;
    os.start(t); os.stop(e); os2.start(t); os2.stop(e);
  }

  // ── Percussioni ───────────────────────────────────────────────────────────
  _kick(t) {
    const ctx = this.ctx;
    const os  = ctx.createOscillator();
    const g   = ctx.createGain();
    os.type = 'sine';
    os.frequency.setValueAtTime(105, t);
    os.frequency.exponentialRampToValueAtTime(38, t + 0.16);
    g.gain.setValueAtTime(0.40, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    os.connect(g); g.connect(this.masterGain);
    os.start(t); os.stop(t + 0.26);
  }

  _snare(t) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.14);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = 1600; filt.Q.value = 0.9;
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(filt); filt.connect(g); g.connect(this.masterGain);
    src.start(t);
  }

  _hihat(t, vol = 0.055) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.048);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    src.buffer = buf;
    filt.type = 'highpass'; filt.frequency.value = 8500;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.048);
    src.connect(filt); filt.connect(g); g.connect(this.masterGain);
    src.start(t);
  }

  _perc(t, type) {
    if (!type) return;
    if (type === 'kick')  this._kick(t);
    if (type === 'snare') this._snare(t);
    if (type === 'hihat') this._hihat(t);
    if (type === 'hat2')  this._hihat(t, 0.035);
  }

  // ── Dispatch strumenti ────────────────────────────────────────────────────
  _instr(type, freq, t, dur, vol) {
    if (!freq) return;
    switch (type) {
      case 'flute':         this._flute(freq, t, dur, vol);        break;
      case 'strings':       this._strings(freq, t, dur, vol);      break;
      case 'strings_light': this._stringsLight(freq, t, dur, vol); break;
      case 'brass':         this._brass(freq, t, dur, vol);        break;
      case 'bass':          this._bass(freq, t, dur, vol);         break;
      case 'pad':           this._pad(freq, t, dur, vol);          break;
      case 'pluck':         this._pluck(freq, t, dur, vol);        break;
      case 'harp':          this._harp(freq, t, dur, vol);         break;
      default:              this._pluck(freq, t, dur, vol);
    }
  }

  // ── Playback ──────────────────────────────────────────────────────────────
  playTheme(theme) {
    this._initCtx();
    this.stop();
    this.currentTheme = theme;
    this.step = 0;

    if (this.reverbReturn)
      this.reverbReturn.gain.value = theme.reverb ?? 0.22;

    const bSec = 60 / theme.tempo;
    const bMs  = bSec * 1000;

    const tick = () => {
      const t = this.ctx.currentTime + 0.012;
      const i = this.step;

      // Melodia principale
      if (theme.melody?.length) {
        const f = theme.melody[i % theme.melody.length];
        if (f) {
          const dur = (theme.melodyDur ?? 0.85) * bSec;
          this._instr(theme.melodyInstr ?? 'flute', f, t, dur, theme.melodyVol ?? 0.18);
        }
      }

      // Basso
      if (theme.bass?.length) {
        const f = theme.bass[i % theme.bass.length];
        if (f) {
          const dur = (theme.bassDur ?? 1.7) * bSec;
          this._instr(theme.bassInstr ?? 'bass', f, t, dur, theme.bassVol ?? 0.16);
        }
      }

      // Accordi (block o arpeggiati)
      if (theme.chords?.length) {
        const chord = theme.chords[i % theme.chords.length];
        if (chord?.length) {
          const arp = theme.arpChords ?? false;
          const dur = (theme.chordDur ?? 1.6) * bSec;
          chord.forEach((f, k) => {
            const delay = arp ? k * 0.042 : 0;
            this._instr(
              theme.chordInstr ?? 'strings_light',
              f, t + delay, dur,
              theme.chordVol ?? 0.095
            );
          });
        }
      }

      // Contromelodia
      if (theme.counter?.length) {
        const f = theme.counter[i % theme.counter.length];
        if (f) {
          const dur = (theme.counterDur ?? 0.85) * bSec;
          this._instr(
            theme.counterInstr ?? 'strings',
            f, t, dur,
            theme.counterVol ?? 0.1
          );
        }
      }

      // Pad atmosferico (fuoco ogni N beat tramite null nel array)
      if (theme.pad?.length) {
        const f = theme.pad[i % theme.pad.length];
        if (f) {
          const dur = (theme.padDur ?? 3.8) * bSec;
          this._pad(f, t, dur, theme.padVol ?? 0.065);
        }
      }

      // Percussioni
      if (theme.rhythm?.length) {
        const hit = theme.rhythm[i % theme.rhythm.length];
        this._perc(t, hit);
      }

      this.step++;
    };

    tick();
    const timer = setInterval(tick, bMs);
    this.timers.push(timer);
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
  }

  async resume() {
    this._initCtx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.currentTheme) this.playTheme(this.currentTheme);
  }
}

export default new MusicEngine();
