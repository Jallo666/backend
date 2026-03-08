let _ctx = null, _mTick = null, _mPlay = false, _muted = false;

export const getMuted = ()    => _muted;
export const setMuted = (val) => { _muted = val; };

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

export function beep(freq, dur, type = "square", vol = 0.15, t0 = 0) {
  if (_muted) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type; o.frequency.value = freq;
    const s = c.currentTime + t0;
    g.gain.setValueAtTime(vol, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + dur);
    o.start(s); o.stop(s + dur + 0.01);
  } catch (_) {}
}

export function sfx(name) {
  const sq = "square", tr = "triangle", sw = "sawtooth";
  const seq = (arr, type, vol, dt = 0.07) =>
    arr.forEach(([f, d], i) => beep(f, d, type, vol, i * dt));
  switch (name) {
    case "swing":       beep(380, 0.07, sq, 0.12); break;
    case "bowShoot":    beep(600,0.03,sq,0.10); beep(280,0.08,sq,0.08,0.03); break;
    case "hit":         seq([[200,0.10],[140,0.08]], sq, 0.2, 0.07); break;
    case "kill":        seq([[400,0.09],[300,0.09],[200,0.09],[150,0.09]], sq, 0.15); break;
    case "lvlup":       seq([[262,0.14],[330,0.14],[392,0.14],[523,0.14],[659,0.18]], sq, 0.22, 0.1); break;
    case "potHp":       seq([[392,0.10],[494,0.10],[659,0.14]], tr, 0.18, 0.08); break;
    case "potMp":       seq([[330,0.09],[440,0.09],[550,0.09],[660,0.12]], tr, 0.15, 0.07); break;
    case "arrowPickup": seq([[330,0.07],[440,0.07],[330,0.05]], sq, 0.10, 0.05); break;
    case "gemPickup":   seq([[880,0.05],[1100,0.05],[1320,0.07],[1760,0.09]], tr, 0.16, 0.04); break;
    case "stairs":      seq([[220,0.10],[262,0.10],[330,0.10],[392,0.10],[440,0.14]], sq, 0.18, 0.06); break;
    case "boss":        seq([[110,0.24],[110,0.24],[165,0.24],[220,0.3],[165,0.2]], sw, 0.32, 0.16); break;
    case "lightning":   seq([[880,0.06],[660,0.06],[440,0.06],[880,0.06],[660,0.06]], sw, 0.2, 0.04); break;
    case "fire":        seq([[220,0.07],[330,0.07],[440,0.07],[550,0.07]], sw, 0.18, 0.03); break;
    case "ice":         seq([[880,0.08],[1100,0.08],[880,0.08],[660,0.08],[880,0.06]], tr, 0.15, 0.05); break;
    case "heal":        seq([[330,0.11],[392,0.11],[440,0.11],[494,0.11],[523,0.14]], tr, 0.2, 0.07); break;
    case "gameover":    seq([[440,0.22],[392,0.22],[330,0.22],[262,0.22],[220,0.22],[196,0.22],[175,0.28]], sq, 0.2, 0.18); break;
  }
}

const AM = [220, 247, 262, 294, 330, 349, 392, 440];
const DUNGEON_SEQ = { mel:[4,4,3,4,6,5,4,6,3,4,2,3,1,3,0,2], bass:[0,4,0,6,0,4,5,0,0,4,0,5,4,0,5,0], bpm:118 };
const BOSS_SEQ    = { mel:[7,6,7,5,7,7,6,4,7,5,4,3,5,4,3,1], bass:[0,0,4,0,0,4,5,0,0,0,4,5,0,4,0,5], bpm:168 };

export function startMusic(isBoss = false) {
  stopMusic(); _mPlay = true;
  const seq = isBoss ? BOSS_SEQ : DUNGEON_SEQ;
  const spb = (60 / seq.bpm / 2) * 1000;
  let step = 0;
  function tick() {
    if (!_mPlay) return;
    const mi = step % seq.mel.length, bi = Math.floor(step/2) % seq.bass.length;
    const mf = AM[seq.mel[mi]] * (isBoss ? 2 : 1), bf = AM[seq.bass[bi]] / 2;
    beep(mf, spb*0.0008, "square",   isBoss ? 0.10 : 0.07);
    beep(bf, spb*0.0016, "triangle", 0.07);
    if (step%4===0) beep(mf*1.5, spb*0.0005, "square", 0.035);
    step++; _mTick = setTimeout(tick, spb);
  }
  tick();
}

export function stopMusic() {
  _mPlay = false; if (_mTick) { clearTimeout(_mTick); _mTick = null; }
}
