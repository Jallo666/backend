import { COLS, ROWS, T, SPELLS } from "./constants.js";
import { sfx } from "./audio.js";
import { doEnemyTurn, dropGem, levelUp } from "./dungeon.js";

export function actionMove(g, dx, dy) {
  const p = g.player;
  const nx = p.x + dx, ny = p.y + dy;
  const log = m => g.messages.push(m);
  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return null;
  if (g.map[ny][nx] === T.WALL) return null;

  const pi = g.items.findIndex(it => it.x === nx && it.y === ny);
  if (pi !== -1) {
    const it = g.items.splice(pi, 1)[0];
    if (it.type === "hp") {
      const h = 15 + p.level * 2; p.hp = Math.min(p.hp + h, p.maxHp);
      g.floats.push({ x: nx, y: ny, text: `+${h}HP`, color: "#88ff88" }); log(`♥ +${h} HP`); sfx("potHp");
    } else if (it.type === "mana") {
      p.mana = Math.min(p.mana + 20, p.maxMana);
      g.floats.push({ x: nx, y: ny, text: "+20MP", color: "#88aaff" }); log(`✦ +20 Mana`); sfx("potMp");
    } else if (it.type === "gem") {
      p.gems += it.value;
      g.floats.push({ x: nx, y: ny, text: `+${it.value}💎`, color: it.color });
      log(`💎 ${it.label}! +${it.value} (tot. ${p.gems})`); sfx("gemPickup");
    } else {
      p.arrows += it.value;
      g.floats.push({ x: nx, y: ny, text: `+${it.value}🏹`, color: "#c8a030" });
      log(`🏹 +${it.value} frecce! (${p.arrows} totali)`); sfx("arrowPickup");
    }
  }

  const ei = g.enemies.findIndex(e => e.x === nx && e.y === ny);
  if (ei !== -1) {
    const e = g.enemies[ei];
    const dmg = Math.max(1, p.atk + Math.floor(Math.random() * 3) - 1);
    e.hp -= dmg; g.floats.push({ x: e.x, y: e.y, text: `-${dmg}`, color: "#ffaa44" });
    log(`Attacchi ${e.name} per ${dmg}!`); sfx("swing");
    if (e.hp <= 0) {
      log(`${e.name} sconfitto!${e.isBoss ? " BOSS DOWN!" : ""} +${e.xp} XP`);
      p.xp += e.xp; dropGem(g, e); g.enemies.splice(ei, 1); sfx("kill"); levelUp(p, log);
    }
  } else {
    p.x = nx; p.y = ny;
    if (g.map[ny][nx] === T.STAIRS) {
      sfx("stairs");
      return { stairs: true, nextFloor: g.floor + 1, player: p };
    }
  }

  p.mana = Math.min(p.mana + 2, p.maxMana);
  doEnemyTurn(g);
  g.messages = g.messages.slice(-30); g.turn++;
  return null;
}

export function actionShoot(g) {
  const p = g.player, log = m => g.messages.push(m);
  if (p.arrows <= 0) { log("🏹 Niente frecce! Trovane nel dungeon."); return; }
  const nearest = g.enemies.reduce((b, e) => {
    const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
    return (!b || d < Math.abs(b.x - p.x) + Math.abs(b.y - p.y)) ? e : b;
  }, null);
  if (!nearest) { log("Nessun bersaglio!"); return; }
  p.arrows--;
  const dmg = Math.max(2, 8 + p.level * 3 + Math.floor(Math.random() * 4) - 2);
  nearest.hp -= dmg;
  g.floats.push({ x: nearest.x, y: nearest.y, text: `-${dmg}🏹`, color: "#c8a030" });
  log(`🏹 Freccia! ${dmg} danni a ${nearest.name}! (rimaste:${p.arrows})`);
  sfx("bowShoot");
  if (nearest.hp <= 0) {
    dropGem(g, nearest);
    g.enemies.splice(g.enemies.indexOf(nearest), 1);
    log(`${nearest.name} abbattuto! +${nearest.xp} XP`);
    sfx("kill"); p.xp += nearest.xp; levelUp(p, log);
  }
  p.mana = Math.min(p.mana + 2, p.maxMana);
  doEnemyTurn(g);
  g.messages = g.messages.slice(-30); g.turn++;
}

// returns flash id string, or null if spell failed/not fired
export function actionCastSpell(g) {
  const p = g.player, sp = SPELLS[p.spell], log = m => g.messages.push(m);
  if (sp.unlockAt > p.level) { log(`${sp.name} si sblocca al livello ${sp.unlockAt}!`); return null; }
  if (p.mana < sp.cost)      { log("Mana insufficiente!"); return null; }
  p.mana -= sp.cost;

  if (sp.id === "lightning") {
    const dmg = 6 + p.level * 2;
    g.enemies.forEach(e => { e.hp -= dmg; g.floats.push({ x: e.x, y: e.y, text: `-${dmg}`, color: "#88aaff" }); });
    log(`⚡ FULMINE! ${dmg} danni a tutti!`); sfx("lightning");
  } else if (sp.id === "fire") {
    const ne = g.enemies.reduce((b, e) => { const d = Math.abs(e.x-p.x)+Math.abs(e.y-p.y); return (!b||d<Math.abs(b.x-p.x)+Math.abs(b.y-p.y))?e:b; }, null);
    if (!ne) { log("Nessun bersaglio!"); return null; }
    const dmg = 18 + p.level * 4; ne.hp -= dmg;
    g.floats.push({ x: ne.x, y: ne.y, text: `-${dmg}🔥`, color: "#ff8844" });
    log(`🔥 FIAMMA! ${dmg} danni a ${ne.name}!`); sfx("fire");
  } else if (sp.id === "ice") {
    const ne = g.enemies.reduce((b, e) => { const d = Math.abs(e.x-p.x)+Math.abs(e.y-p.y); return (!b||d<Math.abs(b.x-p.x)+Math.abs(b.y-p.y))?e:b; }, null);
    if (!ne) { log("Nessun bersaglio!"); return null; }
    ne.stunned = 2; g.floats.push({ x: ne.x, y: ne.y, text: "GELO❄", color: "#aaddff" });
    log(`❄ GELO! ${ne.name} stordito!`); sfx("ice");
  } else if (sp.id === "heal") {
    const heal = 12 + p.level * 3; p.hp = Math.min(p.hp + heal, p.maxHp);
    g.floats.push({ x: p.x, y: p.y, text: `+${heal}HP`, color: "#88ff88" });
    log(`💚 CURA! +${heal} HP`); sfx("heal");
  }

  const before = g.enemies.length; let xpG = 0;
  g.enemies.forEach(e => { if (e.hp <= 0) { xpG += e.xp; dropGem(g, e); } });
  g.enemies = g.enemies.filter(e => e.hp > 0);
  if (before - g.enemies.length > 0) { p.xp += xpG; log(`+${xpG} XP`); sfx("kill"); levelUp(p, log); }
  g.messages = g.messages.slice(-30);
  return sp.id;
}
