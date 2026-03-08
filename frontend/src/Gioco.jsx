// ═══════════════════════════════════════════════
//  PIXEL DUNGEON  —  Roguelike a turni
// ═══════════════════════════════════════════════
import { useEffect, useRef, useCallback } from "react";

const TILE   = 32;
const COLS   = 21;
const ROWS   = 15;
const W      = COLS * TILE;
const H      = ROWS * TILE;
const HUD    = 112;
const FACE_H = 10;   // altezza faccia frontale muro (effetto 3D)

const T = { WALL: 0, FLOOR: 1, STAIRS: 2 };

const ENEMIES = [
  { name: "Slime",    maxHp: 8,  atk: 2,  color: "#2daa3d", xp: 10  },
  { name: "Skeleton", maxHp: 15, atk: 4,  color: "#9898b8", xp: 25  },
  { name: "Orc",      maxHp: 25, atk: 7,  color: "#7a3a10", xp: 45  },
  { name: "Dragon",   maxHp: 50, atk: 12, color: "#cc2222", xp: 100 },
];
const BOSS_TYPES = [
  { name: "GOLEM",  maxHp: 80,  atk: 10, color: "#445577", xp: 200 },
  { name: "LICH",   maxHp: 65,  atk: 16, color: "#882299", xp: 350 },
  { name: "DEMONE", maxHp: 120, atk: 22, color: "#aa0000", xp: 600 },
];

// Spell si sbloccano salendo di livello
const SPELLS = [
  { id:"heal",      name:"CURA",    icon:"💚", cost:18, desc:"Recupera HP",   fc:"rgba(50,200,80,0.35)",   unlockAt:1 },
  { id:"ice",       name:"GELO",    icon:"❄",  cost:15, desc:"Stordisce",     fc:"rgba(100,220,255,0.35)", unlockAt:3 },
  { id:"fire",      name:"FIAMMA",  icon:"🔥", cost:20, desc:"Singolo forte", fc:"rgba(255,100,30,0.4)",   unlockAt:5 },
  { id:"lightning", name:"FULMINE", icon:"⚡", cost:25, desc:"AOE",           fc:"rgba(100,160,255,0.4)",  unlockAt:8 },
];

// ══════════════════════════════════════════════
//  AUDIO ENGINE
// ══════════════════════════════════════════════
let _ctx = null, _mTick = null, _mPlay = false;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}
function beep(freq, dur, type = "square", vol = 0.15, t0 = 0) {
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
function sfx(name) {
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

function startMusic(isBoss = false) {
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
function stopMusic() {
  _mPlay = false; if (_mTick) { clearTimeout(_mTick); _mTick = null; }
}

// ══════════════════════════════════════════════
//  DUNGEON GENERATION
// ══════════════════════════════════════════════
function genDungeon() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL));
  const rooms = [];
  for (let tries = 0; tries < 50 && rooms.length < 7; tries++) {
    const w = 3 + Math.floor(Math.random() * 5);
    const h = 3 + Math.floor(Math.random() * 3);
    const rx = 1 + Math.floor(Math.random() * (COLS - w - 1));
    const ry = 1 + Math.floor(Math.random() * (ROWS - h - 1));
    const room = { x:rx, y:ry, w, h, cx:rx+Math.floor(w/2), cy:ry+Math.floor(h/2) };
    if (!rooms.some(r => rx<r.x+r.w+1 && rx+w+1>r.x && ry<r.y+r.h+1 && ry+h+1>r.y)) {
      rooms.push(room);
      for (let y=ry; y<ry+h; y++)
        for (let x=rx; x<rx+w; x++)
          map[y][x] = T.FLOOR;
    }
  }
  for (let i=1; i<rooms.length; i++) {
    const a=rooms[i-1], b=rooms[i];
    let x=a.cx, y=a.cy;
    while (x!==b.cx) { map[y][x]=T.FLOOR; x+=x<b.cx?1:-1; }
    while (y!==b.cy) { map[y][x]=T.FLOOR; y+=y<b.cy?1:-1; }
  }
  if (rooms.length > 1) {
    const last = rooms[rooms.length-1];
    map[last.cy][last.cx] = T.STAIRS;
  }
  return { map, rooms };
}

function spawnEnemies(rooms, floor) {
  const isBoss = floor % 5 === 0;
  const inner  = rooms.slice(1, -1);
  return inner.map((r, i) => {
    if (isBoss && i === inner.length-1) {
      const bi = Math.min(Math.floor(floor/5)-1, BOSS_TYPES.length-1);
      return { ...BOSS_TYPES[bi], hp:BOSS_TYPES[bi].maxHp, x:r.cx, y:r.cy, id:Date.now()+i, isBoss:true, stunned:0 };
    }
    const tier = Math.min(Math.floor(floor/3), ENEMIES.length-1);
    const pick = Math.max(0, tier-(Math.random()<0.5?1:0));
    return { ...ENEMIES[pick], hp:ENEMIES[pick].maxHp, x:r.cx, y:r.cy, id:Date.now()+i, isBoss:false, stunned:0 };
  });
}

function spawnItems(rooms, floor) {
  const isBoss = floor % 5 === 0;
  return rooms.slice(1).flatMap((r, i) => {
    if (Math.random() > (isBoss ? 0.55 : 0.70)) return [];
    const roll = Math.random();
    const type = roll < 0.42 ? "hp" : roll < 0.72 ? "mana" : "arrows";
    const ox = Math.random() < 0.5 ? -1 : 1;
    const oy = Math.random() < 0.5 ? -1 : 1;
    return [{ type, value: type === "arrows" ? 5 : undefined,
              x: r.cx+ox, y: r.cy+oy, id: Date.now()+i+500 }];
  });
}

// ── Module-level helpers (usabili anche fuori dal componente) ──
function doEnemyTurn(g) {
  const p = g.player;
  const log = m => g.messages.push(m);
  for (const e of g.enemies) {
    if (e.stunned > 0) { e.stunned--; continue; }
    const dist = Math.abs(e.x-p.x) + Math.abs(e.y-p.y);
    if (dist === 1) {
      const dmg = Math.max(1, e.atk + Math.floor(Math.random()*3) - 1);
      p.hp -= dmg; sfx("hit");
      g.floats.push({ x:p.x, y:p.y, text:`-${dmg}`, color:"#ff4444" });
      log(`${e.name} ti colpisce per ${dmg}!`);
      if (p.hp <= 0) { p.hp=0; g.status="dead"; sfx("gameover"); stopMusic(); log("Sei caduto..."); break; }
    } else if (dist < 10) {
      const steps = [];
      if (p.x>e.x) steps.push([1,0]); if (p.x<e.x) steps.push([-1,0]);
      if (p.y>e.y) steps.push([0,1]); if (p.y<e.y) steps.push([0,-1]);
      for (const [mx,my] of steps) {
        const tx=e.x+mx, ty=e.y+my;
        if (g.map[ty]?.[tx]===T.FLOOR &&
            !g.enemies.some(o=>o!==e&&o.x===tx&&o.y===ty) &&
            !(tx===p.x&&ty===p.y)) { e.x=tx; e.y=ty; break; }
      }
    }
  }
}

function _levelUp(p, log) {
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext; p.level++;
    p.maxHp += 6; p.hp = Math.min(p.hp+6, p.maxHp);
    p.atk += 1; p.xpNext = Math.floor(p.xpNext * 1.6);
    log(`✦ LEVEL UP! Livello ${p.level}!`); sfx("lvlup");
    SPELLS.forEach((sp, i) => {
      if (sp.unlockAt === p.level) log(`✦ Sbloccato: ${sp.icon} ${sp.name}! [${i+1}]`);
    });
  }
}

function newGame(floor = 1, prev = null) {
  const { map, rooms } = genDungeon();
  const start = rooms[0] ?? { cx:1, cy:1 };
  const base  = { x:start.cx, y:start.cy, hp:20, maxHp:20, atk:4,
                  level:1, xp:0, xpNext:30, mana:0, maxMana:30, spell:0, arrows:0 };
  const player = prev
    ? { ...prev, x:start.cx, y:start.cy, mana:prev.mana??0, maxMana:30, spell:prev.spell??0, arrows:prev.arrows??0 }
    : base;
  const isBoss = floor % 5 === 0;
  return {
    map, rooms, player,
    enemies: spawnEnemies(rooms, floor),
    items:   spawnItems(rooms, floor),
    floor, turn:0, status:"playing",
    messages: [isBoss ? `Piano ${floor} — ⚠ BOSS IN ARRIVO!` : `Piano ${floor} — Sei entrato nel dungeon!`],
    floats: [],
  };
}

// ══════════════════════════════════════════════
//  DRAWING — muri pseudo-3D con faccia frontale
// ══════════════════════════════════════════════

// IMPORTANTE: chiamare in due passate: prima i pavimenti, poi i muri.
// La faccia frontale del muro si estende nel tile sotto, sopra il pavimento già disegnato.
function drawTile(ctx, x, y, type, map) {
  const px = x*TILE, py = y*TILE;

  if (type === T.WALL) {
    const southOpen = y < ROWS-1 && map[y+1]?.[x] !== T.WALL;
    const eastOpen  = map[y]?.[x+1] !== undefined && map[y]?.[x+1] !== T.WALL;
    const bw = TILE / 2;
    const row = y % 2;

    // ── Superficie superiore del blocco (vista dall'alto) ──
    ctx.fillStyle = "#19193c"; ctx.fillRect(px, py, TILE, TILE);

    // Mattoni: variazione colore per brick
    ctx.fillStyle = ((x+y)%3===0) ? "#1e1e44" : "#161640";
    ctx.fillRect(px+1,    py+1,  bw-2, 10);
    ctx.fillRect(px+bw+1, py+12, bw-2, 10);
    ctx.fillRect(px+1,    py+23, bw-2,  8);
    ctx.fillRect(px+bw+1, py+1,  bw-2, 10);
    ctx.fillRect(px+1,    py+12, bw-2, 10);
    ctx.fillRect(px+bw+1, py+23, bw-2,  8);

    // Giunture (malta) orizzontali
    ctx.fillStyle = "#0d0d28";
    ctx.fillRect(px, py+11, TILE, 1);
    ctx.fillRect(px, py+22, TILE, 1);
    // Giunture verticali (sfalsate)
    ctx.fillRect(px+(row?0:bw), py,    1, 11);
    ctx.fillRect(px+(row?bw:0), py+11, 1, 11);
    ctx.fillRect(px+(row?0:bw), py+22, 1, 10);

    // Luce dall'alto-sinistra
    ctx.fillStyle = "rgba(130,150,240,0.12)";
    ctx.fillRect(px, py, TILE, 2);
    ctx.fillRect(px, py, 2, TILE);
    // Ombra destra/basso
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(px+TILE-2, py, 2, TILE);
    ctx.fillRect(px, py+TILE-2, TILE, 2);

    // ── Faccia frontale 3D (lato sud del blocco) ──
    if (southOpen) {
      const fy = py + TILE;
      ctx.fillStyle = "#0d0d28"; ctx.fillRect(px, fy, TILE, FACE_H);
      // Giunture sulla faccia
      ctx.fillStyle = "#080820";
      ctx.fillRect(px, fy+5, TILE, 1);
      ctx.fillRect(px+(row?0:bw), fy, 1, FACE_H);
      // Bordo superiore brillante (spigolo del blocco)
      ctx.fillStyle = "rgba(120,140,220,0.30)";
      ctx.fillRect(px, fy, TILE, 2);
      // Bordo sinistro in luce
      ctx.fillStyle = "rgba(80,100,200,0.20)";
      ctx.fillRect(px, fy, 2, FACE_H);
      // Ombra base
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(px, fy+FACE_H-2, TILE, 2);
    }

    // Sfumatura destra (profondità laterale)
    if (eastOpen) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(px+TILE-4, py, 4, TILE);
    }

  } else if (type === T.FLOOR) {
    ctx.fillStyle = "#070712"; ctx.fillRect(px, py, TILE, TILE);

    // Texture pietra irregolare
    const g = (x*7+y*13) % 23;
    if (g < 3)  { ctx.fillStyle="#0a0a1c"; ctx.fillRect(px+4, py+4, 4, 4); }
    if (g > 18) { ctx.fillStyle="#0a0a1c"; ctx.fillRect(px+TILE-7, py+TILE-7, 3, 3); }

    // Grigliatura sottile (linee tra le pietre del pavimento)
    ctx.fillStyle = "rgba(0,0,20,0.35)";
    ctx.fillRect(px, py, TILE, 1);
    ctx.fillRect(px, py, 1, TILE);

    // Ombra proiettata dal muro a nord (luce dall'alto)
    if (map[y-1]?.[x] === T.WALL) {
      for (let i=0; i<FACE_H+4; i++) {
        const alpha = 0.50 * (1 - i/(FACE_H+4));
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`;
        ctx.fillRect(px, py+i, TILE, 1);
      }
    }
    // Ombra da muro a ovest
    if (map[y]?.[x-1] === T.WALL) {
      for (let i=0; i<8; i++) {
        const alpha = 0.25 * (1 - i/8);
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`;
        ctx.fillRect(px+i, py, 1, TILE);
      }
    }

  } else {
    // SCALE
    ctx.fillStyle = "#070712"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "#705018";
    for (let s=0; s<4; s++) ctx.fillRect(px+2+s*3, py+5+s*6, TILE-4-s*5, 4);
    ctx.fillStyle = "#a07028"; ctx.fillRect(px+2, py+5, TILE-4, 1);
    ctx.fillStyle = "rgba(240,192,64,0.15)"; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = "rgba(240,192,64,0.08)"; ctx.fillRect(px-1, py-1, TILE+2, TILE+2);
  }
}

// ── Sprite nemici ──────────────────────────────
function drawSlime(ctx, px, py, s) {
  ctx.fillStyle = "#2daa3d";
  ctx.fillRect(px+3, py+10, s-6, s-13); ctx.fillRect(px+5, py+8, s-10, 4); ctx.fillRect(px+8, py+6, s-16, 3);
  ctx.fillStyle = "rgba(100,255,120,0.3)"; ctx.fillRect(px+5, py+10, 4, 3);
  ctx.fillStyle = "#fff"; ctx.fillRect(px+7, py+10, 4, 4); ctx.fillRect(px+s-11, py+10, 4, 4);
  ctx.fillStyle = "#000"; ctx.fillRect(px+8, py+11, 2, 2); ctx.fillRect(px+s-10, py+11, 2, 2);
}
function drawSkeleton(ctx, px, py, s) {
  ctx.fillStyle = "#c0c0c8";
  ctx.fillRect(px+6, py+2, s-12, 9); ctx.fillRect(px+8, py+1, s-16, 3);
  ctx.fillStyle = "#000"; ctx.fillRect(px+7, py+4, 4, 4); ctx.fillRect(px+s-11, py+4, 4, 4);
  ctx.fillStyle = "#880000"; ctx.fillRect(px+8, py+5, 2, 2); ctx.fillRect(px+s-10, py+5, 2, 2);
  ctx.fillStyle = "#aaaaaa"; ctx.fillRect(px+8, py+11, s-16, s-16);
  ctx.fillStyle = "#666"; for (let r=0;r<3;r++) ctx.fillRect(px+8, py+12+r*3, s-16, 1);
  ctx.fillStyle = "#c0c0c8"; ctx.fillRect(px+4, py+12, 3, 7); ctx.fillRect(px+s-7, py+12, 3, 7);
}
function drawOrc(ctx, px, py, s) {
  ctx.fillStyle = "#5a2a08";
  ctx.fillRect(px+2, py+6, s-4, s-9); ctx.fillRect(px+4, py+2, s-8, 8);
  ctx.fillStyle = "#2a1004"; ctx.fillRect(px+5, py+3, 5, 2); ctx.fillRect(px+s-10, py+3, 5, 2);
  ctx.fillStyle = "#cc4400"; ctx.fillRect(px+6, py+5, 3, 3); ctx.fillRect(px+s-9, py+5, 3, 3);
  ctx.fillStyle = "#000";    ctx.fillRect(px+7, py+6, 1, 1); ctx.fillRect(px+s-8, py+6, 1, 1);
  ctx.fillStyle = "#eeeecc"; ctx.fillRect(px+7, py+9, 2, 4); ctx.fillRect(px+s-9, py+9, 2, 4);
  ctx.fillStyle = "#3a1800"; ctx.fillRect(px+2, py+s-8, s-4, 3);
}
function drawDragonSprite(ctx, px, py, s) {
  ctx.fillStyle = "#881111";
  ctx.fillRect(px, py+6, 4, 10); ctx.fillRect(px+s-4, py+6, 4, 10);
  ctx.fillRect(px+1, py+4, 3, 4); ctx.fillRect(px+s-4, py+4, 3, 4);
  ctx.fillStyle = "#cc2222"; ctx.fillRect(px+4, py+5, s-8, s-8);
  ctx.fillStyle = "#dd3333"; ctx.fillRect(px+6, py+2, s-12, 7);
  ctx.fillStyle = "#bb1111"; ctx.fillRect(px+9, py+7, s-18, 4);
  ctx.fillStyle = "#ffff00"; ctx.fillRect(px+7, py+3, 3, 3); ctx.fillRect(px+s-10, py+3, 3, 3);
  ctx.fillStyle = "#000";    ctx.fillRect(px+8, py+4, 2, 2); ctx.fillRect(px+s-9, py+4, 2, 2);
  ctx.fillStyle = "#ff4444"; for (let i=0;i<3;i++) ctx.fillRect(px+8+i*5, py+1, 2, 3);
}
function drawGenericEnemy(ctx, px, py, s, e) {
  ctx.fillStyle = e.color; ctx.fillRect(px+4, py+5, s-8, s-6); ctx.fillRect(px+6, py+1, s-12, 7);
  ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(px+8, py+3, 2, 2); ctx.fillRect(px+s-11, py+3, 2, 2);
}
function drawEnemy(ctx, e) {
  const px=e.x*TILE, py=e.y*TILE, s=TILE;
  if (e.isBoss) { ctx.shadowColor=e.color; ctx.shadowBlur=18; }
  switch(e.name) {
    case "Slime":    drawSlime(ctx,px,py,s); break;
    case "Skeleton": drawSkeleton(ctx,px,py,s); break;
    case "Orc":      drawOrc(ctx,px,py,s); break;
    case "Dragon":   drawDragonSprite(ctx,px,py,s); break;
    default:         drawGenericEnemy(ctx,px,py,s,e); break;
  }
  ctx.shadowBlur = 0;
  if (e.isBoss) {
    ctx.fillStyle = "#f0c040";
    ctx.fillRect(px+3,py-8,3,6); ctx.fillRect(px+8,py-11,3,9); ctx.fillRect(px+13,py-8,3,6);
    ctx.fillRect(px+3,py-4,13,3);
    ctx.fillStyle="#ff4444"; ctx.fillRect(px+9,py-9,2,2);
  }
  if (e.stunned > 0) {
    ctx.fillStyle="rgba(100,200,255,0.22)"; ctx.fillRect(px+2,py+2,s-4,s-4);
    ctx.fillStyle="#aaddff"; ctx.font='7px "Press Start 2P"'; ctx.fillText("❄",px+4,py+s-5);
  }
  if (e.hp < e.maxHp) {
    ctx.fillStyle="#111"; ctx.fillRect(px+1,py-5,s-2,3);
    ctx.fillStyle=e.isBoss?"#bb44ff":"#cc3333";
    ctx.fillRect(px+1,py-5,Math.floor((s-2)*e.hp/e.maxHp),3);
  }
}

function drawPlayer(ctx, p) {
  const px=p.x*TILE+3, py=p.y*TILE+3, s=TILE-6;
  ctx.shadowColor="#f0c040"; ctx.shadowBlur=12;
  ctx.fillStyle="#223380"; ctx.fillRect(px+3,py+9,s-6,s-10);
  ctx.fillStyle="#3344aa"; ctx.fillRect(px+2,py+13,3,6); ctx.fillRect(px+s-5,py+13,3,6);
  ctx.fillStyle="#c8a060"; ctx.fillRect(px+6,py+8,s-12,s-10);
  ctx.fillStyle="#e8c870"; ctx.fillRect(px+7,py+1,s-14,9);
  ctx.fillStyle="#d4a850"; ctx.fillRect(px+7,py+8,s-14,2);
  ctx.fillStyle="#000"; ctx.fillRect(px+9,py+3,2,2); ctx.fillRect(px+s-12,py+3,2,2);
  ctx.fillStyle="#ffffaa"; ctx.fillRect(px+10,py+3,1,1); ctx.fillRect(px+s-11,py+3,1,1);
  ctx.fillStyle="#c8c8ff"; ctx.fillRect(px+s-4,py+5,2,13);
  ctx.fillStyle="#ffdd88"; ctx.fillRect(px+s-6,py+9,6,2);
  ctx.fillStyle="#886622"; ctx.fillRect(px+s-3,py+17,3,3);
  ctx.shadowBlur=0;
  const r=p.hp/p.maxHp;
  ctx.fillStyle="#0a0a0a"; ctx.fillRect(px,py-5,s,3);
  ctx.fillStyle=r>0.5?"#44cc44":r>0.25?"#ccaa22":"#cc3333";
  ctx.fillRect(px,py-5,Math.floor(s*r),3);
}

function drawPotion(ctx, item) {
  const cols = { hp:["#cc2244","#ff4466","#ff88aa"], mana:["#2244cc","#4488ff","#88bbff"] };
  const c = cols[item.type];
  const px=item.x*TILE+9, py=item.y*TILE+7;
  ctx.shadowColor=c[1]; ctx.shadowBlur=10;
  ctx.fillStyle=c[0];
  ctx.fillRect(px+3,py+6,8,10); ctx.fillRect(px+4,py+4,6,3); ctx.fillRect(px+5,py+2,4,3);
  ctx.fillStyle=c[2]; ctx.fillRect(px+4,py+7,2,5);
  ctx.fillStyle="rgba(255,255,255,0.25)"; ctx.fillRect(px+5,py+3,1,1);
  ctx.shadowBlur=0;
}

function drawArrowBundle(ctx, item) {
  const px=item.x*TILE, py=item.y*TILE;
  ctx.shadowColor="#c8a030"; ctx.shadowBlur=8;
  [px+8, px+13, px+18].forEach(sx => {
    ctx.fillStyle="#8b6020"; ctx.fillRect(sx, py+8, 2, 16);       // asta
    ctx.fillStyle="#c0c0c0"; ctx.fillRect(sx-1,py+5,4,4);         // punta (triang)
    ctx.fillRect(sx, py+4, 2, 2);
    ctx.fillStyle="#aa2200"; ctx.fillRect(sx-1,py+22,4,3);        // penne
    ctx.fillRect(sx,py+24,2,2);
  });
  ctx.fillStyle="#6b4010"; ctx.fillRect(px+6,py+14,16,2);         // legatura
  ctx.shadowBlur=0;
  ctx.font='5px "Press Start 2P"'; ctx.fillStyle="#c8a030"; ctx.textBaseline="top";
  ctx.fillText("x5",px+8,py+26); ctx.textBaseline="middle";
}

function drawFloats(ctx, floats) {
  if (!floats.length) return;
  ctx.font='7px "Press Start 2P"'; ctx.textBaseline="top";
  floats.forEach(f => { ctx.fillStyle=f.color??"#ffffff"; ctx.fillText(f.text,f.x*TILE+4,f.y*TILE-4); });
  ctx.textBaseline="middle";
}

function drawFlashEffect(ctx, type, enemies, player) {
  const sp = SPELLS.find(s=>s.id===type); if (!sp) return;
  ctx.fillStyle=sp.fc; ctx.fillRect(0,0,W,H);
  if (type==="lightning") {
    ctx.strokeStyle="#ffffff"; ctx.lineWidth=2;
    enemies.forEach(e=>{
      const cx=e.x*TILE+TILE/2, cy=e.y*TILE+TILE/2;
      ctx.beginPath(); ctx.moveTo(cx,0);
      ctx.lineTo(cx-6,cy-14); ctx.lineTo(cx+5,cy-14); ctx.lineTo(cx,cy+4); ctx.stroke();
      ctx.fillStyle="#ffff88"; ctx.fillRect(cx-3,cy-3,6,6);
    });
  } else if (type==="fire") {
    const e=enemies[0]; if (!e) return;
    ctx.fillStyle="#ff8800";
    [[-3,-5],[3,-7],[0,-4],[-4,-3],[4,-3]].forEach(([ox,oy])=>
      ctx.fillRect(e.x*TILE+TILE/2+ox*3-3,e.y*TILE+TILE/2+oy*3,7,7));
  } else if (type==="ice") {
    const e=enemies[0]; if (!e) return;
    ctx.strokeStyle="#aaddff"; ctx.lineWidth=1;
    const cx=e.x*TILE+TILE/2, cy=e.y*TILE+TILE/2;
    for (let a=0;a<6;a++) {
      const ang=(a/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(ang)*16,cy+Math.sin(ang)*16); ctx.stroke();
    }
  } else if (type==="heal") {
    ctx.fillStyle="#88ff88";
    const cx=player.x*TILE+TILE/2, cy=player.y*TILE+TILE/2;
    [[0,-13],[0,13],[-13,0],[13,0]].forEach(([ox,oy])=>ctx.fillRect(cx+ox-2,cy+oy-2,5,5));
    ctx.fillRect(cx-1,cy-9,2,18); ctx.fillRect(cx-9,cy-1,18,2);
  }
}

function drawBar(ctx, label, lx, y, val, max, barColor, labelColor, font) {
  ctx.font=`8px ${font}`; ctx.fillStyle=labelColor; ctx.fillText(label,lx,y);
  ctx.fillStyle="#151528"; ctx.fillRect(lx+28,y-6,115,10);
  ctx.fillStyle=barColor; ctx.fillRect(lx+28,y-6,Math.floor(115*Math.min(val/max,1)),10);
  ctx.strokeStyle="#2e3a6e"; ctx.lineWidth=1; ctx.strokeRect(lx+28,y-6,115,10);
  ctx.font=`6px ${font}`; ctx.fillStyle="#888"; ctx.fillText(`${val}/${max}`,lx+149,y);
}

function drawHUD(ctx, g) {
  const hy=H, p=g.player, font='"Press Start 2P"';
  ctx.fillStyle="#05050e"; ctx.fillRect(0,hy,W,HUD);
  ctx.fillStyle="#2e3a6e"; ctx.fillRect(0,hy,W,2);
  ctx.textBaseline="middle";

  // Barre
  const hpR=p.hp/p.maxHp;
  drawBar(ctx,"HP",8,hy+16,p.hp,  p.maxHp,  hpR>0.5?"#44cc44":hpR>0.25?"#ccaa22":"#cc3333","#888",font);
  drawBar(ctx,"MP",8,hy+34,p.mana,p.maxMana,"#3a6ee8","#8888cc",font);
  drawBar(ctx,"XP",8,hy+52,p.xp,  p.xpNext, "#5560c8","#555",   font);

  // Stats
  ctx.font=`8px ${font}`;
  ctx.fillStyle="#f0c040"; ctx.fillText(`LV.${p.level}`,  222,hy+16);
  ctx.fillStyle="#ff8888"; ctx.fillText(`ATK ${p.atk}`,   222,hy+34);
  const boss=g.floor%5===0;
  ctx.fillStyle=boss?"#ff4444":"#5b8dee"; ctx.fillText(`P.${g.floor}${boss?" ⚠":""}`,222,hy+52);
  ctx.font=`7px ${font}`;
  ctx.fillStyle=p.arrows>0?"#c8a030":"#2a2a2a";
  ctx.fillText(`🏹 ${p.arrows}`,222,hy+70);

  // 4 slot spell
  const slotX=318, slotW=42, slotH=HUD-6, gap=2;
  SPELLS.forEach((sp, i) => {
    const locked  = sp.unlockAt > p.level;
    const active  = i === p.spell;
    const canCast = !locked && p.mana >= sp.cost;
    const bx = slotX + i*(slotW+gap);

    ctx.strokeStyle = active ? (canCast?"#5588ff":"#887700") : (locked?"#1a1a2a":"#252540");
    ctx.lineWidth=1; ctx.strokeRect(bx,hy+3,slotW,slotH);
    ctx.fillStyle = active?"#07072a":"#020210"; ctx.fillRect(bx+1,hy+4,slotW-2,slotH-2);

    ctx.textAlign="center";
    if (locked) {
      ctx.font=`9px ${font}`; ctx.fillStyle="#222";
      ctx.fillText(sp.icon, bx+slotW/2, hy+18);
      ctx.font=`4px ${font}`; ctx.fillStyle="#2a2a3a";
      ctx.fillText(sp.name,    bx+slotW/2, hy+32);
      ctx.fillText(`LV${sp.unlockAt}`,bx+slotW/2, hy+44);
      ctx.fillText("LOCK",     bx+slotW/2, hy+56);
    } else {
      ctx.font=`10px ${font}`; ctx.fillStyle=active?(canCast?"#ffffff":"#cccc44"):"#778";
      ctx.fillText(sp.icon, bx+slotW/2, hy+18);
      ctx.font=`4px ${font}`; ctx.fillStyle=active?"#aabbff":"#445";
      ctx.fillText(sp.name,    bx+slotW/2, hy+32);
      ctx.fillStyle=canCast?"#4488ff":"#333";
      ctx.fillText(`${sp.cost}MP`, bx+slotW/2, hy+44);
      ctx.fillStyle="#555"; ctx.fillText(`[${i+1}]`,bx+slotW/2, hy+56);
      if (active) { ctx.fillStyle="#f0c040"; ctx.fillRect(bx+1,hy+3,slotW-2,2); }
    }
    ctx.textAlign="left";
  });

  // Hint
  const hx = slotX + 4*(slotW+gap) + 4;
  ctx.font=`5px ${font}`; ctx.fillStyle="#2a3050";
  ctx.fillText("SPACE",hx,hy+14); ctx.fillText("lancia",hx,hy+24);
  ctx.fillText("F",hx,hy+38);     ctx.fillText("arco",hx,hy+48);
  ctx.fillText("1-4",hx,hy+62);   ctx.fillText("spell",hx,hy+72);

  // Messaggi
  const msgs=g.messages.slice(-2);
  ctx.font=`6px ${font}`;
  msgs.forEach((m,i)=>{
    ctx.fillStyle=i===msgs.length-1?"#b8c8d8":"#2a3040";
    ctx.fillText(m.slice(0,48),8,hy+82+i*16);
  });
}

function drawOverlay(ctx, status) {
  if (status==="playing") return;
  ctx.fillStyle="rgba(0,0,0,0.84)"; ctx.fillRect(0,0,W,H);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#cc2222"; ctx.font='16px "Press Start 2P"';
  ctx.fillText("GAME  OVER",W/2,H/2-28);
  ctx.fillStyle="#666"; ctx.font='7px "Press Start 2P"';
  ctx.fillText("[ R ] Ricomincia dall'inizio",W/2,H/2+8);
  ctx.textAlign="left";
}

// ══════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════
export default function Gioco() {
  const canvasRef  = useRef(null);
  const gameRef    = useRef(newGame(1));
  const touchRef   = useRef(null);
  const audioReady = useRef(false);

  function initAudio() {
    if (audioReady.current) return;
    audioReady.current = true;
    startMusic(gameRef.current.floor % 5 === 0);
  }

  const draw = useCallback((flashType = null) => {
    const canvas=canvasRef.current; if (!canvas) return;
    const ctx=canvas.getContext("2d");
    const g=gameRef.current;
    ctx.fillStyle="#040410"; ctx.fillRect(0,0,W,H+HUD);

    // Pass 1: pavimenti (così la faccia frontale del muro sovrascrive il pavimento sotto)
    for (let y=0; y<ROWS; y++)
      for (let x=0; x<COLS; x++)
        if (g.map[y][x] !== T.WALL) drawTile(ctx,x,y,g.map[y][x],g.map);
    // Pass 2: muri (con faccia frontale che sporge nel tile sotto)
    for (let y=0; y<ROWS; y++)
      for (let x=0; x<COLS; x++)
        if (g.map[y][x] === T.WALL) drawTile(ctx,x,y,g.map[y][x],g.map);

    g.items.forEach(it => it.type==="arrows" ? drawArrowBundle(ctx,it) : drawPotion(ctx,it));
    g.enemies.forEach(e=>drawEnemy(ctx,e));
    drawPlayer(ctx,g.player);
    drawFloats(ctx,g.floats);

    if (flashType) {
      const nearest=g.enemies.reduce((b,e)=>{
        const d=Math.abs(e.x-g.player.x)+Math.abs(e.y-g.player.y);
        return(!b||d<Math.abs(b.x-g.player.x)+Math.abs(b.y-g.player.y))?e:b;
      },null);
      drawFlashEffect(ctx,flashType,nearest?[nearest]:g.enemies,g.player);
    }

    drawHUD(ctx,g);
    drawOverlay(ctx,g.status);
    g.floats=[];
  },[]);

  // ── Arco ──────────────────────────────────────
  const shoot = useCallback(()=>{
    initAudio();
    const g=gameRef.current;
    if (g.status!=="playing") return;
    const p=g.player, log=m=>g.messages.push(m);
    if (p.arrows<=0) { log("🏹 Niente frecce! Trovane nel dungeon."); draw(); return; }
    const nearest=g.enemies.reduce((b,e)=>{
      const d=Math.abs(e.x-p.x)+Math.abs(e.y-p.y);
      return(!b||d<Math.abs(b.x-p.x)+Math.abs(b.y-p.y))?e:b;
    },null);
    if (!nearest) { log("Nessun bersaglio!"); draw(); return; }
    p.arrows--;
    const dmg=Math.max(2,8+p.level*3+Math.floor(Math.random()*4)-2);
    nearest.hp-=dmg;
    g.floats.push({x:nearest.x,y:nearest.y,text:`-${dmg}🏹`,color:"#c8a030"});
    log(`🏹 Freccia! ${dmg} danni a ${nearest.name}! (rimaste:${p.arrows})`);
    sfx("bowShoot");
    if (nearest.hp<=0) {
      const idx=g.enemies.indexOf(nearest); g.enemies.splice(idx,1);
      log(`${nearest.name} abbattuto! +${nearest.xp} XP`);
      sfx("kill"); p.xp+=nearest.xp; _levelUp(p,log);
    }
    // L'arco usa un turno: i nemici si muovono
    p.mana=Math.min(p.mana+2,p.maxMana);
    doEnemyTurn(g);
    g.messages=g.messages.slice(-30); g.turn++;
    draw();
  },[draw]);

  // ── Lancia spell ──────────────────────────────
  const castSpell = useCallback(()=>{
    initAudio();
    const g=gameRef.current;
    if (g.status!=="playing") return;
    const p=g.player, sp=SPELLS[p.spell], log=m=>g.messages.push(m);
    if (sp.unlockAt>p.level) { log(`${sp.name} si sblocca al livello ${sp.unlockAt}!`); draw(); return; }
    if (p.mana<sp.cost) { log("Mana insufficiente!"); draw(); return; }
    p.mana-=sp.cost;

    let flashId=sp.id;
    if (sp.id==="lightning") {
      const dmg=6+p.level*2;
      g.enemies.forEach(e=>{e.hp-=dmg;g.floats.push({x:e.x,y:e.y,text:`-${dmg}`,color:"#88aaff"});});
      log(`⚡ FULMINE! ${dmg} danni a tutti!`); sfx("lightning");
    } else if (sp.id==="fire") {
      const ne=g.enemies.reduce((b,e)=>{const d=Math.abs(e.x-p.x)+Math.abs(e.y-p.y);return(!b||d<Math.abs(b.x-p.x)+Math.abs(b.y-p.y))?e:b;},null);
      if (!ne){log("Nessun bersaglio!");draw();return;}
      const dmg=18+p.level*4; ne.hp-=dmg;
      g.floats.push({x:ne.x,y:ne.y,text:`-${dmg}🔥`,color:"#ff8844"});
      log(`🔥 FIAMMA! ${dmg} danni a ${ne.name}!`); sfx("fire");
    } else if (sp.id==="ice") {
      const ne=g.enemies.reduce((b,e)=>{const d=Math.abs(e.x-p.x)+Math.abs(e.y-p.y);return(!b||d<Math.abs(b.x-p.x)+Math.abs(b.y-p.y))?e:b;},null);
      if (!ne){log("Nessun bersaglio!");draw();return;}
      ne.stunned=2; g.floats.push({x:ne.x,y:ne.y,text:"GELO❄",color:"#aaddff"});
      log(`❄ GELO! ${ne.name} stordito!`); sfx("ice");
    } else if (sp.id==="heal") {
      const heal=12+p.level*3; p.hp=Math.min(p.hp+heal,p.maxHp);
      g.floats.push({x:p.x,y:p.y,text:`+${heal}HP`,color:"#88ff88"});
      log(`💚 CURA! +${heal} HP`); sfx("heal");
    }
    const before=g.enemies.length; let xpG=0;
    g.enemies.forEach(e=>{if(e.hp<=0)xpG+=e.xp;});
    g.enemies=g.enemies.filter(e=>e.hp>0);
    if (before-g.enemies.length>0){p.xp+=xpG;log(`+${xpG} XP`);sfx("kill");_levelUp(p,log);}
    g.messages=g.messages.slice(-30);
    draw(flashId); setTimeout(()=>draw(null),160);
  },[draw]);

  // ── Muovi / turno ─────────────────────────────
  const move = useCallback((dx,dy)=>{
    initAudio();
    const g=gameRef.current;
    if (g.status!=="playing") return;
    const p=g.player, nx=p.x+dx, ny=p.y+dy, log=m=>g.messages.push(m);
    if (nx<0||ny<0||nx>=COLS||ny>=ROWS) return;
    if (g.map[ny][nx]===T.WALL) return;

    // Raccogliti oggetto
    const pi=g.items.findIndex(it=>it.x===nx&&it.y===ny);
    if (pi!==-1) {
      const it=g.items.splice(pi,1)[0];
      if (it.type==="hp") {
        const h=15+p.level*2; p.hp=Math.min(p.hp+h,p.maxHp);
        g.floats.push({x:nx,y:ny,text:`+${h}HP`,color:"#88ff88"}); log(`♥ +${h} HP`); sfx("potHp");
      } else if (it.type==="mana") {
        p.mana=Math.min(p.mana+20,p.maxMana);
        g.floats.push({x:nx,y:ny,text:"+20MP",color:"#88aaff"}); log(`✦ +20 Mana`); sfx("potMp");
      } else {
        p.arrows+=it.value;
        g.floats.push({x:nx,y:ny,text:`+${it.value}🏹`,color:"#c8a030"});
        log(`🏹 +${it.value} frecce! (${p.arrows} totali)`); sfx("arrowPickup");
      }
    }

    // Attacco o movimento
    const ei=g.enemies.findIndex(e=>e.x===nx&&e.y===ny);
    if (ei!==-1) {
      const e=g.enemies[ei];
      const dmg=Math.max(1,p.atk+Math.floor(Math.random()*3)-1);
      e.hp-=dmg; g.floats.push({x:e.x,y:e.y,text:`-${dmg}`,color:"#ffaa44"});
      log(`Attacchi ${e.name} per ${dmg}!`); sfx("swing");
      if (e.hp<=0){log(`${e.name} sconfitto!${e.isBoss?" BOSS DOWN!":""} +${e.xp} XP`);p.xp+=e.xp;g.enemies.splice(ei,1);sfx("kill");_levelUp(p,log);}
    } else {
      p.x=nx; p.y=ny;
      if (g.map[ny][nx]===T.STAIRS) {
        sfx("stairs");
        const nf=g.floor+1; gameRef.current=newGame(nf,p);
        if(nf%5===0)sfx("boss"); startMusic(nf%5===0);
        draw(); return;
      }
    }

    p.mana=Math.min(p.mana+2,p.maxMana);
    doEnemyTurn(g);
    g.messages=g.messages.slice(-30); g.turn++;
    draw();
  },[draw]);

  useEffect(()=>{ document.fonts.ready.then(()=>draw()); },[draw]);

  useEffect(()=>{
    const DIRS={
      ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
      w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0],
    };
    const onKey=e=>{
      const g=gameRef.current;
      if((e.key==="r"||e.key==="R")&&g.status==="dead"){gameRef.current=newGame(1);startMusic(false);draw();return;}
      if(e.key===" "){e.preventDefault();castSpell();return;}
      if(e.key==="f"||e.key==="F"){shoot();return;}
      if(["1","2","3","4"].includes(e.key)){
        const idx=+e.key-1;
        if(SPELLS[idx].unlockAt<=g.player.level) g.player.spell=idx;
        else g.messages.push(`⚠ ${SPELLS[idx].name} si sblocca al livello ${SPELLS[idx].unlockAt}!`);
        draw(); return;
      }
      const dir=DIRS[e.key];
      if(dir){e.preventDefault();move(...dir);}
    };
    window.addEventListener("keydown",onKey);
    return ()=>{ window.removeEventListener("keydown",onKey); stopMusic(); };
  },[move,draw,castSpell,shoot]);

  const onTouchStart=e=>{ touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; };
  const onTouchEnd=e=>{
    if(!touchRef.current)return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
    Math.abs(dx)>Math.abs(dy)?move(dx>0?1:-1,0):move(0,dy>0?1:-1);
    touchRef.current=null;
  };

  const DPAD=[[1,"↑",0,-1],[3,"←",-1,0],[5,"→",1,0],[7,"↓",0,1]];

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.75rem"}}>
      <canvas
        ref={canvasRef} width={W} height={H+HUD}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{imageRendering:"pixelated",border:"2px solid #2e3a6e",
                boxShadow:"0 0 32px rgba(60,80,200,0.25)",borderRadius:4,
                maxWidth:"100%",touchAction:"none",cursor:"crosshair"}}
      />

      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,52px)",gridTemplateRows:"repeat(3,52px)",gap:4}}>
          {Array.from({length:9},(_,i)=>{
            const d=DPAD.find(([gi])=>gi===i);
            return (
              <button key={i} onClick={()=>d&&move(d[2],d[3])}
                style={{background:d?"#12122a":"transparent",border:d?"2px solid #2e3a6e":"none",
                        borderRadius:4,color:"#f0c040",fontFamily:'"Press Start 2P"',fontSize:20,
                        cursor:d?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {d?d[1]:""}
              </button>
            );
          })}
        </div>

        <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",justifyContent:"center"}}>
          {SPELLS.map((sp,i)=>(
            <button key={sp.id}
              onClick={()=>{const g=gameRef.current;if(sp.unlockAt<=g.player.level){g.player.spell=i;draw();}else{g.messages.push(`${sp.name}: LV${sp.unlockAt}`);draw();}}}
              style={{fontFamily:'"Press Start 2P"',fontSize:"0.45rem",
                      background:"#0a0a1e",border:`2px solid #2a3050`,
                      color:"#aaa",padding:"0.35rem 0.6rem",borderRadius:4,cursor:"pointer"}}>
              {sp.icon} {i+1}
            </button>
          ))}
          <button onClick={castSpell}
            style={{fontFamily:'"Press Start 2P"',fontSize:"0.45rem",
                    background:"#0a0a2a",border:"2px solid #3a6ee8",
                    color:"#88aaff",padding:"0.35rem 0.8rem",borderRadius:4,cursor:"pointer"}}>
            SPELL
          </button>
          <button onClick={shoot}
            style={{fontFamily:'"Press Start 2P"',fontSize:"0.45rem",
                    background:"#0a0800",border:"2px solid #8b6020",
                    color:"#c8a030",padding:"0.35rem 0.8rem",borderRadius:4,cursor:"pointer"}}>
            🏹 ARCO
          </button>
        </div>
      </div>

      <p style={{fontFamily:'"Press Start 2P"',fontSize:"0.4rem",color:"#3a4a7a",textAlign:"center",lineHeight:2.2}}>
        WASD/↑↓←→ muovi · SPACE spell · F arco · 1-4 cambia spell · R ricomincia
      </p>
    </div>
  );
}
