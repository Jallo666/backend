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

// ── Aura ───────────────────────────────────────────────────────────────────────

// Applica gli effetti passivi dell'Aura al danno in entrata.
export function applyAuraEffects(target, rawDmg) {
  if (target.aura?.some(a => a.id === "difesa_possente")) {
    return Math.max(1, Math.floor(rawDmg / 2));
  }
  return rawDmg;
}

// ── Combattimento ─────────────────────────────────────────────────────────────

// Simula il duello tra attaccante e difensore.
// Restituisce { attackerHp, defenderHp, dmg, auraActive, log }
export function resolveCombat(attacker, defender) {
  const hasAttaccoFurtivo = attacker.aura?.some(a => a.id === "attacco_furtivo");
  const rawDmg = hasAttaccoFurtivo
    ? attacker.atk
    : Math.max(1, attacker.atk - defender.def);
  const dmg = applyAuraEffects(defender, rawDmg);
  const defenderHp = Math.max(0, defender.hp - dmg);
  return {
    attackerHp: attacker.hp,
    defenderHp,
    dmg,
    auraActive:   dmg < rawDmg,
    furtivo:      hasAttaccoFurtivo,
    log: [{ round: 1, aDmg: dmg, dDmg: 0 }],
    attackerWins: true,
  };
}

// ── Cura a fine round ─────────────────────────────────────────────────────────
export function getHealAmount(round) {
  return Math.max(-20, 10 - 2 * round);
  // Round 1: +8, Round 2: +6, Round 3: +4, Round 4: +2,
  // Round 5: 0, Round 6: -2, Round 7: -4 ... (indipendente per giocatore)
}

// Applica cura (o danno) a fine round ai pezzi sopravvissuti
export function applyEndRoundHeal(pieces, round) {
  const heal = getHealAmount(round);
  if (heal === 0) return pieces;
  if (heal > 0) {
    return pieces.map(p => ({ ...p, hp: Math.min(p.hpMax, p.hp + heal) }));
  }
  // heal < 0: danno — i pezzi non possono scendere sotto 1 HP
  return pieces.map(p => ({ ...p, hp: Math.max(1, p.hp + heal) }));
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

// ── Scagliare ──────────────────────────────────────────────────────────────────

// Pedine adiacenti al caster (distanza Chebyshev 1), escluso se stesso
export function getScagliareTargets(caster, allPieces) {
  return allPieces.filter(p =>
    p.uid !== caster.uid &&
    Math.abs(p.row - caster.row) <= 1 &&
    Math.abs(p.col - caster.col) <= 1
  );
}

// Celle libere entro 2 celle dal campione (dist Chebyshev 1-2), escluse posizioni occupate
// La pedina lanciata (thrownPieceUid) non conta come occupante (si libera dalla cella)
export function getScagliareDest(caster, thrownPieceUid, allPieces) {
  const occupied = new Set(
    allPieces.filter(p => p.uid !== thrownPieceUid).map(p => `${p.row},${p.col}`)
  );
  const dests = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const dist = Math.max(Math.abs(r - caster.row), Math.abs(c - caster.col));
      if (dist >= 1 && dist <= 2 && !occupied.has(`${r},${c}`)) {
        dests.push({ row: r, col: c });
      }
    }
  }
  return dests;
}

// Danno Scagliare: floor(ATK/2) × distanza Chebyshev dal campione alla cella di atterraggio
export function calcScagliareDanno(caster, destRow, destCol) {
  const dist = Math.max(Math.abs(destRow - caster.row), Math.abs(destCol - caster.col));
  return Math.floor(caster.atk / 2) * dist;
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
