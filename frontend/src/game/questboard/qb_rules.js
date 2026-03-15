// ── Regole di Quest Board ─────────────────────────────────────────────────────
// Griglia 6×6. Movimento Chebyshev (tutte le direzioni entro MOV caselle).
// Combattimento: danno = max(1, ATK - DEF), round automatici fino a 0 HP.
// Rotazione obbligatoria: ogni pezzo deve muovere prima che uno possa ripetere.
// Cura a fine round: giri 1-3 → +5HP, 4-6 → +3HP, 7-9 → +1HP, 10+ → 0HP.

export const BOARD_SIZE = 6;

// ── Movimento ─────────────────────────────────────────────────────────────────

// Restituisce tutte le celle raggiungibili da un pezzo (Chebyshev, no salto)
export function getValidMoves(piece, allPieces) {
  const moves = [];
  const { row, col, mov } = piece;

  for (let dr = -mov; dr <= mov; dr++) {
    for (let dc = -mov; dc <= mov; dc++) {
      if (dr === 0 && dc === 0) continue;
      // Chebyshev: max(|dr|,|dc|) <= mov già garantito dal loop
      const tr = row + dr;
      const tc = col + dc;
      if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE) continue;
      if (!_pathClear(row, col, tr, tc, allPieces)) continue;

      const target = allPieces.find(p => p.row === tr && p.col === tc);
      moves.push({ row: tr, col: tc, isAttack: !!target, target: target ?? null });
    }
  }
  return moves;
}

// Controlla se il percorso da (r1,c1) a (r2,c2) è libero da altri pezzi
// (escluso il punto di partenza e arrivo).
// Per mosse oblique (es. dr=1,dc=2) usa un passo Chebyshev:
// avanza diagonalmente finché non si allinea, poi dritto.
function _pathClear(r1, c1, r2, c2, allPieces) {
  let r = r1, c = c1;
  while (r !== r2 || c !== c2) {
    r += Math.sign(r2 - r);
    c += Math.sign(c2 - c);
    if (r === r2 && c === c2) break; // destinazione raggiunta, non controllarla
    if (allPieces.some(p => p.row === r && p.col === c)) return false;
  }
  return true;
}

// Verifica se un pezzo è completamente bloccato (nessuna mossa valida)
export function isBlocked(piece, allPieces) {
  return getValidMoves(piece, allPieces).length === 0;
}

// ── Combattimento ─────────────────────────────────────────────────────────────

// Simula il duello tra attaccante e difensore.
// Restituisce { attackerHp, defenderHp, log: [{round, aDmg, dDmg}] }
export function resolveCombat(attacker, defender) {
  const dmg = Math.max(1, attacker.atk - defender.def);
  const defenderHp = Math.max(0, defender.hp - dmg);
  return {
    attackerHp: attacker.hp,
    defenderHp,
    dmg,
    log: [{ round: 1, aDmg: dmg, dDmg: 0 }],
    attackerWins: true,
  };
}

// ── Cura a fine round ─────────────────────────────────────────────────────────
export function getHealAmount(round) {
  if (round <= 3) return 5;
  if (round <= 6) return 3;
  if (round <= 9) return 1;
  return 0;
}

// Applica cura a fine round ai pezzi sopravvissuti (side = "player" | "ai")
export function applyEndRoundHeal(pieces, round) {
  const heal = getHealAmount(round);
  if (heal === 0) return pieces;
  return pieces.map(p => ({
    ...p,
    hp: Math.min(p.hpMax, p.hp + heal),
  }));
}

// ── Rotazione ─────────────────────────────────────────────────────────────────

// Crea tracker rotazione per una lista di pezzi
export function createRotationTracker(pieces) {
  return {
    moved: new Set(),             // uid dei pezzi che hanno già mosso in questo ciclo
    total: pieces.map(p => p.uid), // uid di tutti i pezzi vivi
  };
}

// Verifica se un pezzo può muoversi rispetto alla rotazione
export function canMoveInRotation(uid, tracker) {
  return !tracker.moved.has(uid);
}

// Registra la mossa di un pezzo; se tutti hanno mosso, resetta il ciclo
export function registerMove(uid, tracker, alivePieces) {
  const newMoved = new Set(tracker.moved);
  newMoved.add(uid);
  // Controlla se tutti i pezzi vivi hanno mosso
  const aliveUids = alivePieces.map(p => p.uid);
  const allMoved = aliveUids.every(id => newMoved.has(id));
  return {
    moved: allMoved ? new Set() : newMoved,
    total: aliveUids,
    cycleComplete: allMoved,
  };
}

// ── Tracker Ardore (separato dalla rotazione movimento) ───────────────────────

export function createArdoreTracker() {
  return { used: new Set() };
}

export function canUseArdore(uid, tracker) {
  return !tracker.used.has(uid);
}

// Registra uso ardore; resetta il Set quando tutti i pezzi vivi lo hanno usato
export function registerArdore(uid, tracker, alivePieces) {
  const newUsed = new Set(tracker.used);
  newUsed.add(uid);
  const aliveUids = alivePieces.map(p => p.uid);
  return { used: aliveUids.every(id => newUsed.has(id)) ? new Set() : newUsed };
}

// ── Condizione di vittoria ────────────────────────────────────────────────────
export function checkWin(playerPieces, aiPieces) {
  const playerKingDead = !playerPieces.some(p => p.isRe);
  const aiKingDead     = !aiPieces.some(p => p.isRe);
  if (playerKingDead && aiKingDead) return "draw";
  if (playerKingDead) return "ai";
  if (aiKingDead)     return "player";
  return null;
}
