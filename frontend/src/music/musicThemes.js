// ── RPG Music Themes ──────────────────────────────────────────────────────────
// Frequenze Hz (temperamento equabile, A4=440)
// C3=130.8  D3=146.8  E3=164.8  F3=174.6  G3=196.0  A3=220.0  Bb3=233.1  B3=246.9
// C4=261.6  Db4=277.2 D4=293.7  Eb4=311.1 E4=329.6  F4=349.2  F#4=370.0  G4=392.0
// Ab4=415.3 A4=440.0  Bb4=466.2 B4=493.9
// C5=523.3  D5=587.3  Eb5=622.3 E5=659.3  F5=698.5  F#5=740.0 G5=784.0  A5=880.0
// B5=987.8

export const themes = {

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // La minore • 65 BPM • Mistico, sereno, etereo
  // Flauto alto + pad atmosferico + archi tenui
  login: {
    tempo:       65,
    reverb:      0.48,
    melodyInstr: 'flute',
    melodyVol:   0.17,
    melodyDur:   2.0,
    melody: [
      880.00, null,   783.99, 659.25,  // A5 - G5 E5
      587.33, null,   null,   null,    // D5 (tenuta)
      523.25, 659.25, 783.99, 659.25,  // C5 E5 G5 E5
      440.00, null,   659.25, null,    // A4 - E5
    ],
    bassInstr: 'bass',
    bassVol:   0.12,
    bassDur:   3.6,
    bass: [
      220.00, null, null, null,   // A3
      196.00, null, null, null,   // G3
      130.81, null, null, null,   // C3
      164.81, null, null, null,   // E3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.075,
    chordDur:   3.8,
    chords: [
      [220.00, 261.63, 329.63], // Am  (A3 C4 E4)
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
      [196.00, 246.94, 293.66], // G   (G3 B3 D4)
      [196.00, 246.94, 293.66],
      [196.00, 246.94, 293.66],
      [196.00, 246.94, 293.66],
      [130.81, 164.81, 196.00], // C   (C3 E3 G3)
      [130.81, 164.81, 196.00],
      [130.81, 164.81, 196.00],
      [130.81, 164.81, 196.00],
      [164.81, 220.00, 261.63], // Em  (E3 A3 C4) → colore ambiguo
      [164.81, 220.00, 261.63],
      [164.81, 220.00, 261.63],
      [164.81, 220.00, 261.63],
    ],
    counterInstr: 'strings',
    counterVol:   0.085,
    counterDur:   1.8,
    counter: [
      null,   329.63, null,   392.00, // E4 G4
      440.00, null,   493.88, null,   // A4 B4
      null,   null,   329.63, null,   // E4
      293.66, 329.63, null,   null,   // D4 E4
    ],
    padVol: 0.055,
    padDur: 4.5,
    pad: [
      220.00, null, null, null,
      196.00, null, null, null,
      130.81, null, null, null,
      164.81, null, null, null,
    ],
  },

  // ── REGISTRAZIONE ─────────────────────────────────────────────────────────
  // Sol maggiore • 82 BPM • Speranzoso, fresco, nuovo inizio
  // Arpa brillante + archi caldi
  registrazione: {
    tempo:       82,
    reverb:      0.25,
    melodyInstr: 'harp',
    melodyVol:   0.20,
    melodyDur:   0.80,
    melody: [
      392.00, 493.88, 587.33, 493.88,  // G4 B4 D5 B4
      440.00, 392.00, null,   null,    // A4 G4
      392.00, 440.00, 493.88, 440.00,  // G4 A4 B4 A4
      392.00, null,   293.66, null,    // G4 - D4
    ],
    bassInstr: 'bass',
    bassVol:   0.15,
    bassDur:   1.8,
    bass: [
      196.00, null, 146.83, null,   // G3 D3
      130.81, null, 196.00, null,   // C3 G3
      196.00, null, 220.00, null,   // G3 A3
      146.83, null, 196.00, null,   // D3 G3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.10,
    chordDur:   1.9,
    chords: [
      [196.00, 246.94, 293.66], // G  (G3 B3 D4)
      [196.00, 246.94, 293.66],
      [146.83, 185.00, 220.00], // D  (D3 F#3 A3)
      [146.83, 185.00, 220.00],
      [130.81, 164.81, 196.00], // C  (C3 E3 G3)
      [130.81, 164.81, 196.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [164.81, 207.65, 246.94], // Em (E3 Ab3 B3)
      [164.81, 207.65, 246.94],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [146.83, 185.00, 220.00], // D
      [146.83, 185.00, 220.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
    ],
    counterInstr: 'flute',
    counterVol:   0.11,
    counterDur:   0.9,
    counter: [
      null,   587.33, null,   null,   // D5
      392.00, 440.00, 493.88, null,   // G4 A4 B4
      null,   null,   392.00, null,   // G4
      440.00, 493.88, null,   null,   // A4 B4
    ],
  },

  // ── MAIN MENU ─────────────────────────────────────────────────────────────
  // Sol maggiore • 108 BPM • Avventura epica, grandioso
  // Ottoni protagonisti + basso + archi + percussioni
  mainmenu: {
    tempo:       108,
    reverb:      0.20,
    melodyInstr: 'brass',
    melodyVol:   0.20,
    melodyDur:   0.85,
    melody: [
      783.99, 659.25, 587.33, 493.88,  // G5 E5 D5 B4
      523.25, 587.33, 659.25, 783.99,  // C5 D5 E5 G5
      880.00, 783.99, 659.25, 587.33,  // A5 G5 E5 D5
      523.25, 493.88, 440.00, 392.00,  // C5 B4 A4 G4
    ],
    bassInstr: 'bass',
    bassVol:   0.17,
    bassDur:   1.7,
    bass: [
      196.00, 196.00, 164.81, 164.81,  // G3 G3 E3 E3
      130.81, 130.81, 146.83, 146.83,  // C3 C3 D3 D3
      196.00, 196.00, 164.81, 164.81,
      130.81, 146.83, 130.81, 196.00,
    ],
    chordInstr: 'strings_light',
    chordVol:   0.10,
    chordDur:   1.8,
    chords: [
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [164.81, 207.65, 246.94], // Em
      [164.81, 207.65, 246.94],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [146.83, 185.00, 220.00], // D
      [146.83, 185.00, 220.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [164.81, 207.65, 246.94], // Em
      [164.81, 207.65, 246.94],
      [130.81, 164.81, 196.00], // C
      [146.83, 185.00, 220.00], // D
      [130.81, 164.81, 196.00], // C
      [196.00, 246.94, 293.66], // G
    ],
    counterInstr: 'strings',
    counterVol:   0.11,
    counterDur:   0.85,
    counter: [
      null,   null,   493.88, 392.00,  // B4 G4
      440.00, 392.00, null,   null,
      null,   587.33, null,   null,    // D5
      523.25, null,   329.63, null,    // C5 E4
    ],
    rhythm: [
      'kick','hihat','snare','hihat',
      'kick','hihat','snare','hihat',
      'kick','hihat','snare','hihat',
      'kick','hihat','snare','hihat',
    ],
  },

  // ── DUNGEON ───────────────────────────────────────────────────────────────
  // La minore • 95 BPM • Oscuro, teso, minaccioso
  // Ottoni cupi + basso profondo + archi spettrali
  dungeon: {
    tempo:       95,
    reverb:      0.42,
    melodyInstr: 'brass',
    melodyVol:   0.15,
    melodyDur:   1.2,
    melody: [
      440.00, null,   null,   null,    // A4 (tenuta)
      392.00, null,   349.23, null,    // G4 F4
      329.63, null,   null,   null,    // E4 (tenuta)
      293.66, 329.63, null,   null,    // D4 E4
    ],
    bassInstr: 'bass',
    bassVol:   0.18,
    bassDur:   3.8,
    bass: [
      220.00, null, null, null,   // A3
      164.81, null, null, null,   // E3
      220.00, null, null, null,   // A3
      146.83, null, null, null,   // D3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.08,
    chordDur:   3.6,
    chords: [
      [220.00, 261.63, 329.63], // Am
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
      [164.81, 196.00, 246.94], // Em
      [164.81, 196.00, 246.94],
      [164.81, 196.00, 246.94],
      [164.81, 196.00, 246.94],
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [146.83, 174.61, 220.00],
      [146.83, 174.61, 220.00],
      [220.00, 261.63, 329.63], // Am
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63],
    ],
    counterInstr: 'flute',
    counterVol:   0.09,
    counterDur:   1.8,
    counter: [
      659.25, null,   null,   null,   // E5
      587.33, null,   523.25, null,   // D5 C5
      493.88, null,   null,   null,   // B4
      null,   440.00, null,   null,   // A4
    ],
    rhythm: [
      'kick', null, null, null,
      null,   null, null, null,
      'kick', null, null, null,
      null,   null, null, null,
    ],
    padVol: 0.045,
    padDur: 4.8,
    pad: [
      220.00, null, null, null,
      null,   null, null, null,
      130.81, null, null, null,
      null,   null, null, null,
    ],
  },

  // ── LOCANDA ───────────────────────────────────────────────────────────────
  // Fa maggiore • 96 BPM • Taverna calda, accogliente
  // Pizzico/liuto + archi + percussione leggera
  locanda: {
    tempo:       96,
    reverb:      0.30,
    melodyInstr: 'pluck',
    melodyVol:   0.22,
    melodyDur:   0.75,
    melody: [
      523.25, null,   440.00, 392.00,  // C5 A4 G4
      349.23, 392.00, 440.00, null,    // F4 G4 A4
      349.23, 392.00, 440.00, 523.25,  // F4 G4 A4 C5
      null,   null,   440.00, null,    // A4
    ],
    bassInstr: 'bass',
    bassVol:   0.15,
    bassDur:   1.8,
    bass: [
      174.61, null, 130.81, null,   // F3 C3
      174.61, null, 130.81, null,   // F3 C3
      233.08, null, 174.61, null,   // Bb3 F3
      130.81, null, 174.61, null,   // C3 F3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.095,
    chordDur:   1.9,
    chords: [
      [174.61, 220.00, 261.63], // F  (F3 A3 C4)
      [174.61, 220.00, 261.63],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [174.61, 220.00, 261.63], // F
      [174.61, 220.00, 261.63],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [116.54, 146.83, 174.61], // Bb (Bb2 D3 F3)
      [116.54, 146.83, 174.61],
      [174.61, 220.00, 261.63], // F
      [174.61, 220.00, 261.63],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [174.61, 220.00, 261.63], // F
      [174.61, 220.00, 261.63],
    ],
    counterInstr: 'flute',
    counterVol:   0.10,
    counterDur:   0.85,
    counter: [
      null,   null,   698.46, null,   // F5
      659.25, null,   587.33, 523.25, // E5 D5 C5
      null,   null,   440.00, null,   // A4
      466.16, null,   523.25, null,   // Bb4 C5
    ],
    rhythm: [
      null,   'hihat', null,   'hihat',
      'kick', 'hihat', null,   'hihat',
      null,   'hihat', null,   'hihat',
      'kick', 'hihat', 'hat2', 'hihat',
    ],
  },

  // ── FABBRO ────────────────────────────────────────────────────────────────
  // Re minore • 112 BPM • Forgia, martellante, determinato
  // Ottoni potenti + basso pesante + percussioni ritmiche
  fabbro: {
    tempo:       112,
    reverb:      0.16,
    melodyInstr: 'brass',
    melodyVol:   0.20,
    melodyDur:   0.80,
    melody: [
      587.33, null,   587.33, 698.46,  // D5 D5 F5
      659.25, 587.33, 523.25, null,    // E5 D5 C5
      440.00, null,   466.16, null,    // A4 Bb4
      440.00, 392.00, null,   null,    // A4 G4
    ],
    bassInstr: 'bass',
    bassVol:   0.19,
    bassDur:   1.6,
    bass: [
      146.83, null, 220.00, null,   // D3 A3
      146.83, null, 220.00, null,
      196.00, null, 146.83, null,   // G3 D3
      220.00, null, 146.83, null,   // A3 D3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.09,
    chordDur:   1.6,
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [220.00, 277.18, 329.63], // A  (A3 C#4 E4)
      [220.00, 277.18, 329.63],
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [196.00, 233.08, 293.66], // Gm (G3 Bb3 D4)
      [196.00, 233.08, 293.66],
      [116.54, 146.83, 174.61], // Bb
      [116.54, 146.83, 174.61],
      [220.00, 277.18, 329.63], // A
      [220.00, 277.18, 329.63],
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [220.00, 277.18, 329.63], // A
      [220.00, 277.18, 329.63],
    ],
    rhythm: [
      'kick', null,   'snare', null,
      'kick', 'kick', 'snare', null,
      'kick', null,   'snare', null,
      'kick', 'kick', 'snare', 'kick',
    ],
  },

  // ── FORMAZIONE ────────────────────────────────────────────────────────────
  // Re minore • 100 BPM • Marcia strategica, concentrata
  // Ottoni da marcia + basso solido + archi
  formazione: {
    tempo:       100,
    reverb:      0.22,
    melodyInstr: 'brass',
    melodyVol:   0.19,
    melodyDur:   0.82,
    melody: [
      587.33, null,   698.46, 659.25,  // D5 F5 E5
      587.33, null,   440.00, null,    // D5 A4
      523.25, null,   659.25, 587.33,  // C5 E5 D5
      523.25, null,   587.33, null,    // C5 D5
    ],
    bassInstr: 'bass',
    bassVol:   0.17,
    bassDur:   1.7,
    bass: [
      146.83, null, 220.00, null,   // D3 A3
      146.83, null, 220.00, null,
      220.00, null, 164.81, null,   // A3 E3
      220.00, null, 146.83, null,   // A3 D3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.095,
    chordDur:   1.8,
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [220.00, 277.18, 329.63], // A
      [220.00, 277.18, 329.63],
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
      [196.00, 233.08, 293.66], // Gm
      [196.00, 233.08, 293.66],
      [220.00, 261.63, 329.63], // Am
      [220.00, 261.63, 329.63],
      [164.81, 196.00, 246.94], // Em
      [164.81, 196.00, 246.94],
      [220.00, 261.63, 329.63], // Am
      [220.00, 261.63, 329.63],
      [146.83, 174.61, 220.00], // Dm
      [146.83, 174.61, 220.00],
    ],
    counterInstr: 'harp',
    counterVol:   0.10,
    counterDur:   0.75,
    counter: [
      null,   440.00, null,   null,   // A4
      349.23, null,   null,   null,   // F4
      null,   329.63, null,   null,   // E4
      392.00, 440.00, null,   null,   // G4 A4
    ],
    rhythm: [
      'kick', null,   'snare', null,
      'kick', 'kick', 'snare', null,
      'kick', null,   'snare', null,
      'kick', null,   'snare', 'kick',
    ],
  },

  // ── QUESTBOARD ────────────────────────────────────────────────────────────
  // Mi minore • 132 BPM • Battaglia intensa, eroica
  // Ottoni eroici + basso trascinante + archi + percussioni pesanti
  questboard: {
    tempo:       132,
    reverb:      0.16,
    melodyInstr: 'brass',
    melodyVol:   0.22,
    melodyDur:   0.78,
    melody: [
      659.25, 783.99, 493.88, 783.99,  // E5 G5 B4 G5
      739.99, 659.25, null,   587.33,  // F#5 E5 D5
      493.88, 587.33, 659.25, 587.33,  // B4 D5 E5 D5
      493.88, 440.00, null,   null,    // B4 A4
    ],
    bassInstr: 'bass',
    bassVol:   0.18,
    bassDur:   1.6,
    bass: [
      164.81, null, 246.94, null,   // E3 B3
      196.00, null, 220.00, null,   // G3 A3
      164.81, null, 246.94, null,   // E3 B3
      261.63, null, 246.94, null,   // C4 B3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.10,
    chordDur:   1.6,
    chords: [
      [329.63, 392.00, 493.88], // Em  (E4 G4 B4)
      [329.63, 392.00, 493.88],
      [293.66, 369.99, 440.00], // D   (D4 F#4 A4)
      [293.66, 369.99, 440.00],
      [261.63, 329.63, 392.00], // C   (C4 E4 G4)
      [261.63, 329.63, 392.00],
      [246.94, 311.13, 369.99], // B   (B3 Eb4 F#4)
      [246.94, 311.13, 369.99],
      [329.63, 392.00, 493.88], // Em
      [329.63, 392.00, 493.88],
      [293.66, 369.99, 440.00], // D
      [293.66, 369.99, 440.00],
      [261.63, 329.63, 392.00], // C
      [261.63, 329.63, 392.00],
      [246.94, 311.13, 369.99], // B
      [246.94, 311.13, 369.99],
    ],
    counterInstr: 'flute',
    counterVol:   0.11,
    counterDur:   0.75,
    counter: [
      987.77, null,   null,   null,   // B5
      880.00, null,   783.99, null,   // A5 G5
      739.99, null,   null,   null,   // F#5
      659.25, null,   null,   null,   // E5
    ],
    rhythm: [
      'kick', 'hihat', 'kick',  'snare',
      'kick', 'hihat', 'kick',  'snare',
      'kick', 'hihat', 'kick',  'snare',
      'kick', 'kick',  'snare', 'hihat',
    ],
  },

  // ── GILDA ─────────────────────────────────────────────────────────────────
  // Do maggiore • 90 BPM • Folk accogliente, caldo, narrativo
  // Pizzico morbido + archi + percussione leggera
  gilda: {
    tempo:       90,
    reverb:      0.28,
    melodyInstr: 'pluck',
    melodyVol:   0.21,
    melodyDur:   0.80,
    melody: [
      523.25, 659.25, 783.99, 659.25,  // C5 E5 G5 E5
      587.33, 523.25, null,   null,    // D5 C5
      392.00, 440.00, 493.88, 523.25,  // G4 A4 B4 C5
      587.33, null,   523.25, null,    // D5 C5
    ],
    bassInstr: 'bass',
    bassVol:   0.15,
    bassDur:   1.8,
    bass: [
      130.81, null, 196.00, null,   // C3 G3
      130.81, null, 196.00, null,
      174.61, null, 196.00, null,   // F3 G3
      130.81, null, 196.00, null,   // C3 G3
    ],
    chordInstr: 'strings_light',
    chordVol:   0.095,
    chordDur:   1.9,
    chords: [
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [174.61, 220.00, 261.63], // F
      [174.61, 220.00, 261.63],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
    ],
    counterInstr: 'flute',
    counterVol:   0.10,
    counterDur:   0.85,
    counter: [
      null,   null,   329.63, null,   // E4
      392.00, 440.00, null,   null,   // G4 A4
      null,   null,   293.66, null,   // D4
      329.63, null,   null,   null,   // E4
    ],
    rhythm: [
      'kick', null,   'hihat', null,
      'snare', null,  'hihat', null,
      'kick', null,   'hihat', null,
      'snare', null,  'hihat', null,
    ],
  },

  // ── CITTÀ ─────────────────────────────────────────────────────────────────
  // Sol maggiore • 118 BPM • Vivace, brulicante, folk medievale
  // Flauto agile + accordi arpeggiati + percussioni folk
  citta: {
    tempo:       118,
    reverb:      0.22,
    melodyInstr: 'flute',
    melodyVol:   0.19,
    melodyDur:   0.80,
    melody: [
      783.99, null,   493.88, 587.33,  // G5 B4 D5
      783.99, null,   880.00, 783.99,  // G5 A5 G5
      659.25, null,   587.33, null,    // E5 D5
      392.00, 440.00, 493.88, null,    // G4 A4 B4
    ],
    bassInstr: 'bass',
    bassVol:   0.15,
    bassDur:   1.7,
    bass: [
      196.00, null, 196.00, null,   // G3
      146.83, null, 146.83, null,   // D3
      130.81, null, 130.81, null,   // C3
      196.00, null, 146.83, null,   // G3 D3
    ],
    arpChords:  true,
    chordInstr: 'harp',
    chordVol:   0.095,
    chordDur:   1.8,
    chords: [
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [146.83, 185.00, 220.00], // D
      [146.83, 185.00, 220.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [146.83, 185.00, 220.00], // D
      [146.83, 185.00, 220.00],
      [130.81, 164.81, 196.00], // C
      [130.81, 164.81, 196.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
      [146.83, 185.00, 220.00], // D
      [146.83, 185.00, 220.00],
      [196.00, 246.94, 293.66], // G
      [196.00, 246.94, 293.66],
    ],
    counterInstr: 'strings',
    counterVol:   0.09,
    counterDur:   0.80,
    counter: [
      null,   587.33, null,   null,   // D5
      493.88, null,   null,   null,   // B4
      null,   null,   493.88, 587.33, // B4 D5
      null,   null,   null,   null,
    ],
    rhythm: [
      'kick', 'hihat', 'snare', 'hihat',
      'kick', 'hihat', 'snare', 'hihat',
      'kick', 'hihat', 'snare', 'hihat',
      'kick', 'hihat', 'snare', 'hihat',
    ],
  },

};
