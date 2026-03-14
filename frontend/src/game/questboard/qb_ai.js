import { CHESS_ICONS } from "./qb_pieces.js";
// ── AI per Quest Board ────────────────────────────────────────────────────────
// Valuta ogni mossa/gesta possibile e sceglie quella con il punteggio più alto.
// Valuta ogni mossa possibile e sceglie quella con il punteggio più alto.
// Criteri (in ordine di priorità):
//   1. Uccide il Re nemico → punteggio massimo
//   2. Attacca un pezzo nemico (bonus se è il Re, bonus se vince il duello)
//   3. Si avvicina al Re nemico
//   4. Si allontana dal pericolo (evita di esporre il proprio Re)
//   5. Rompe il blocco (non stare fermi)

import { getValidMoves, resolveCombat, canMoveInRotation } from "./qb_rules.js";

const INF = 999999;

// Distanza Chebyshev tra due posizioni
function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

// Valuta la qualità di una mossa per l'AI
function scoreMossa(piece, move, aiPieces, playerPieces) {
  let score = 0;

  const playerKing = playerPieces.find(p => p.isRe);
  if (!playerKing) return INF; // già vinto

  const aiKing = aiPieces.find(p => p.isRe);

  if (move.isAttack && move.target) {
    const target = move.target;
    const combat = resolveCombat(piece, target);

    // Uccide il Re nemico → massima priorità
    if (target.isRe && combat.defenderHp <= 0) {
      score += 10000;
    }
    // Uccide un pezzo qualsiasi
    if (combat.defenderHp <= 0) {
      score += 500 + target.hpMax; // bonus per pezzi più forti
    }
    // Attacca il Re senza ucciderlo → comunque buono
    if (target.isRe) {
      score += 300;
    }
    // Penalità se il nostro pezzo muore nel duello
    if (combat.attackerHp <= 0) {
      score -= 400;
    }
    // Penalità extra se è il nostro Re che muore
    if (piece.isRe && combat.attackerHp <= 0) {
      score -= 8000;
    }
    // Bonus proporzionale al danno inflitto
    score += (target.hp - Math.max(0, combat.defenderHp)) * 10;
  } else {
    // Mossa senza attacco: avvicinati al Re nemico
    const distPrima = chebyshev(piece.row, piece.col, playerKing.row, playerKing.col);
    const distDopo  = chebyshev(move.row,  move.col,  playerKing.row, playerKing.col);
    score += (distPrima - distDopo) * 20;

    // Se siamo il Re, non avvicinarci ai pezzi nemici
    if (piece.isRe && aiKing) {
      const minDangerBefore = Math.min(...playerPieces.map(p =>
        chebyshev(aiKing.row, aiKing.col, p.row, p.col)));
      const minDangerAfter = Math.min(...playerPieces.map(p =>
        chebyshev(move.row, move.col, p.row, p.col)));
      score += (minDangerAfter - minDangerBefore) * 15; // positivo se ci allontaniamo
    }
  }

  // Piccolo rumore casuale per evitare comportamento deterministico
  score += Math.random() * 5;

  return score;
}

// Valuta una gesta contro un target
function scoreGesta(piece, gesta, target) {
  if (target.side === piece.side) return -500; // evita propri pezzi
  const hpDopo   = Math.max(0, target.hp - gesta.danno);
  const eliminato = hpDopo <= 0;
  let score = 0;
  if (eliminato && target.isRe) score += 10000;
  if (eliminato)                score += 500 + target.hpMax;
  if (target.isRe)              score += 300;
  score += (target.hp - hpDopo) * 10;
  return score + Math.random() * 5;
}

// Valuta un ardore contro un target
function scoreArdore(piece, ardore, target) {
  const hpDopo   = Math.max(0, target.hp - ardore.danno);
  const eliminato = hpDopo <= 0;
  let score = 0;
  if (eliminato && target.isRe) score += 10000;
  if (eliminato)                score += 500 + target.hpMax;
  if (target.isRe)              score += 300;
  score += (target.hp - hpDopo) * 10;
  return score + Math.random() * 5;
}

// Sceglie il bersaglio migliore per Ardore; restituisce { piece, ardoreId, targetUid } | null
// Usa solo se il punteggio è positivo (vale la pena usarlo)
export function chooseArdoreAction(aiPieces, playerPieces, aiArdoreTracker) {
  let best = null;
  let bestScore = 0;
  for (const piece of aiPieces) {
    if (!canUseArdore(piece.uid, aiArdoreTracker)) continue;
    for (const ardore of (piece.ardore ?? [])) {
      for (const target of playerPieces) {
        const score = scoreArdore(piece, ardore, target);
        if (score > bestScore) {
          bestScore = score;
          best = { piece, ardoreId: ardore.id, targetUid: target.uid };
        }
      }
    }
  }
  return best;
}

// ── Funzione principale: sceglie la mossa migliore per l'AI ──────────────────
// Restituisce { piece, move } | { piece, gestaId, targetUid } | null
export function chooseBestMove(aiPieces, playerPieces, rotationTracker) {
  let bestScore = -INF;
  let bestChoice = null;

  const allPieces = [...aiPieces, ...playerPieces];

  for (const piece of aiPieces) {
    // Rispetta la rotazione obbligatoria
    if (!canMoveInRotation(piece.uid, rotationTracker)) continue;

    const moves = getValidMoves(
      piece,
      allPieces.filter(p => p !== piece)
    ).filter(m => !m.target || m.target.side === "player"); // attacca solo nemici

    for (const move of moves) {
      const score = scoreMossa(piece, move, aiPieces, playerPieces);
      if (score > bestScore) {
        bestScore = score;
        bestChoice = { piece, move };
      }
    }

    // Valuta gesta
    for (const gesta of (piece.gesta ?? [])) {
      for (const target of allPieces.filter(p => p.uid !== piece.uid)) {
        const score = scoreGesta(piece, gesta, target);
        if (score > bestScore) {
          bestScore = score;
          bestChoice = { piece, gestaId: gesta.id, targetUid: target.uid };
        }
      }
    }
  }

  return bestChoice;
}

// ── Formazione AI di default ──────────────────────────────────────────────────
// L'AI usa gli stessi 6 pezzi classici con statistiche identiche.
// Posizionati nelle prime 2 righe (righe 0-1 dall'alto = lato AI).
import { CLASSIC_PIECES, PIECE_COLORS, NATURA_DA_NOME, gesteDiNatura, ardoreDiNatura } from "./qb_pieces.js";
import { canUseArdore } from "./qb_rules.js";

export function createAiFormation() {
  const positions = [
    // [row, col, isRe]
    [0, 0, false], // Guerriero
    [0, 1, false], // Arciere
    [0, 2, true],  // Scudiero → designato Re dell'AI
    [0, 3, false], // Esploratore
    [0, 4, false], // Mago
    [0, 5, false], // Campione
  ];

  return CLASSIC_PIECES.map((tmpl, i) => {
    const id = tmpl.id;
    const colors = PIECE_COLORS[id] ?? {};
    return {
      uid:    `ai_${id}`,
      id,
      nome:   tmpl.nome,
      icona:  CHESS_ICONS[id] ?? tmpl.icona,
      hp:     tmpl.hp,
      hpMax:  tmpl.hpMax,
      atk:    tmpl.atk,
      def:    tmpl.def,
      mov:    tmpl.mov,
      row:    positions[i][0],
      col:    positions[i][1],
      isRe:   positions[i][2],
      side:   "ai",
      natura: NATURA_DA_NOME[tmpl.nome] ?? null,
      gesta:  gesteDiNatura(NATURA_DA_NOME[tmpl.nome] ?? null),
      ardore: ardoreDiNatura(NATURA_DA_NOME[tmpl.nome] ?? null),
      ...colors,
    };
  });
}
