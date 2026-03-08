import { TILE, COLS, ROWS, T, ENEMIES, BOSS_TYPES, GEM_TYPES, SPELLS } from "./constants.js";
import { sfx, stopMusic } from "./audio.js";

export function genDungeon() {
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

export function spawnEnemies(rooms, floor) {
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

export function spawnItems(rooms, floor) {
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

export function doEnemyTurn(g) {
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

export function dropGem(g, e) {
  let chance, weights;
  if (e.isBoss)       { chance=0.92; weights=[0, 5,15,45,35]; }
  else if (e.xp>=100) { chance=0.62; weights=[15,35,30,15, 5]; }
  else if (e.xp>=45)  { chance=0.50; weights=[40,40,18, 2, 0]; }
  else if (e.xp>=25)  { chance=0.42; weights=[65,30, 5, 0, 0]; }
  else                { chance=0.35; weights=[100,0,  0,  0, 0]; }
  if (Math.random() > chance) return;
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.floor(Math.random()*total), tier=0;
  for (let i=0;i<weights.length;i++) { r-=weights[i]; if(r<0){tier=i;break;} }
  const gem = GEM_TYPES[tier];
  g.items.push({ type:"gem", color:gem.color, label:gem.label, value:gem.value,
                 x:e.x, y:e.y, id:Date.now()+Math.random()*1000 });
}

export function levelUp(p, log) {
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

export function newGame(floor = 1, prev = null) {
  const { map, rooms } = genDungeon();
  const start = rooms[0] ?? { cx:1, cy:1 };
  const base  = { x:start.cx, y:start.cy, hp:20, maxHp:20, atk:4,
                  level:1, xp:0, xpNext:30, mana:0, maxMana:30, spell:0, arrows:0, gems:0 };
  const player = prev
    ? { ...prev, x:start.cx, y:start.cy, mana:prev.mana??0, maxMana:30,
        spell:prev.spell??0, arrows:prev.arrows??0, gems:prev.gems??0 }
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
