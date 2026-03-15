// ── Stato di gioco Quest Board ────────────────────────────────────────────────
import {
  getValidMoves, resolveCombat, checkWin,
  createRotationTracker, registerMove, applyEndRoundHeal,
  canMoveInRotation, isBlocked,
  createArdoreTracker, registerArdore,
  BOARD_SIZE,
} from "./qb_rules.js";

// Trova la cella libera più vicina al difensore raggiungibile dall'attaccante.
// Priorità: celle ortogonali > diagonali a parità di distanza Chebyshev.
function _closestAdvanceCell(attacker, defRow, defCol, allPieces) {
  const occupied = new Set(
    allPieces
      .filter(p => p.uid !== attacker.uid)
      .map(p => `${p.row},${p.col}`)
  );

  const candidates = [];
  for (let dr = -attacker.mov; dr <= attacker.mov; dr++) {
    for (let dc = -attacker.mov; dc <= attacker.mov; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = attacker.row + dr;
      const c = attacker.col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      if (r === defRow && c === defCol) continue;       // non nella cella del difensore
      if (occupied.has(`${r},${c}`)) continue;          // non occupata
      const distToDef = Math.max(Math.abs(r - defRow), Math.abs(c - defCol));
      const isOrtho   = dr === 0 || dc === 0;
      candidates.push({ r, c, distToDef, isOrtho });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.distToDef !== b.distToDef) return a.distToDef - b.distToDef;
    return (a.isOrtho ? 0 : 1) - (b.isOrtho ? 0 : 1); // ortogonale prima
  });
  return candidates[0];
}
import { chooseBestMove, chooseArdoreAction, createAiFormation } from "./qb_ai.js";
import { fromApi } from "./qb_pieces.js";

// ── Crea stato iniziale ───────────────────────────────────────────────────────
// formazioneSalvata: [{id (uid pezzo), row, col, isRe}] dal backend
// inventario: pezzi dal backend
export function createGame(inventario, formazioneSalvata) {
  // inventario è già convertito via fromApi in Formazione.jsx
  // ogni pezzo ha: { uid: numericDbId, id: "guerriero", ... }
  const pezziMap = Object.fromEntries(inventario.map(p => [p.uid, p]));

  // Costruisci pezzi giocatore dalla formazione salvata
  // ogni slot ha: { uid: numericDbId, row, col, isRe }
  const playerPieces = formazioneSalvata.map((slot, i) => {
    const base = pezziMap[slot.uid];
    if (!base) return null;
    return {
      ...base,
      hp:   base.hpMax, // ripristina HP pieni a inizio partita
      row:  slot.row,
      col:  slot.col,
      isRe: slot.isRe,
      side: "player",
      uid:  `player_${base.uid}_${i}`,
    };
  }).filter(Boolean);

  const aiPieces = createAiFormation();

  return {
    playerPieces,
    aiPieces,
    turn:   "player",          // "player" | "ai"
    round:  1,
    status: "coinflip",        // "coinflip" | "playing" | "over"
    winner: null,              // null | "player" | "ai" | "draw"
    playerRotation:      createRotationTracker(playerPieces),
    aiRotation:          createRotationTracker(aiPieces),
    playerArdoreTracker: createArdoreTracker(),
    aiArdoreTracker:     createArdoreTracker(),
    log:    [],                // messaggi di partita
    combatAnim: null,          // animazione combattimento in corso
    selected: null,            // uid pezzo selezionato dal giocatore
    validMoves: [],            // mosse valide per il pezzo selezionato
  };
}

// ── Coin flip ─────────────────────────────────────────────────────────────────
export function resolveCoinFlip(state, playerChoosesFirst) {
  return {
    ...state,
    turn:   playerChoosesFirst ? "player" : "ai",
    status: "playing",
    log:    [playerChoosesFirst
      ? "Hai vinto il tiro! Vai per primo."
      : "L'avversario va per primo."],
  };
}

// ── Selezione pezzo giocatore ─────────────────────────────────────────────────
export function selectPiece(state, uid) {
  if (state.turn !== "player" || state.status !== "playing") return state;

  const piece = state.playerPieces.find(p => p.uid === uid);
  if (!piece) return { ...state, selected: null, validMoves: [] };

  // Controlla rotazione
  if (!canMoveInRotation(uid, state.playerRotation)) {
    return {
      ...state,
      selected: null,
      validMoves: [],
      log: [...state.log, `${piece.nome} ha già mosso in questo ciclo.`],
    };
  }

  // Controlla blocco
  if (isBlocked(piece, [...state.playerPieces, ...state.aiPieces].filter(p => p.uid !== uid))) {
    return {
      ...state,
      selected: uid,
      validMoves: [],
      log: [...state.log, `${piece.nome} è bloccato — salta il turno.`],
    };
  }

  const allOthers = [...state.playerPieces, ...state.aiPieces].filter(p => p.uid !== uid);
  const moves = getValidMoves(piece, allOthers)
    .filter(m => !m.target || m.target.side === "ai"); // può attaccare solo nemici

  return { ...state, selected: uid, validMoves: moves };
}

// ── Mossa del giocatore ───────────────────────────────────────────────────────
export function applyPlayerMove(state, toRow, toCol) {
  if (state.turn !== "player" || !state.selected) return state;

  const piece = state.playerPieces.find(p => p.uid === state.selected);
  if (!piece) return state;

  const move = state.validMoves.find(m => m.row === toRow && m.col === toCol);
  if (!move) return state;

  return _applyMove(state, piece, move, "player");
}

// ── Turno AI completo (usato solo per mosse non-attacco dirette) ─────────────
export function applyAiTurn(state) {
  if (state.turn !== "ai" || state.status !== "playing") return state;
  return applyAiMoveOnly(state);
}

// ── Solo la fase di movimento AI (senza controllo ardore — già gestito dalla UI)
export function applyAiMoveOnly(state) {
  if (state.turn !== "ai" || state.status !== "playing") return state;
  const choice = chooseBestMove(state.aiPieces, state.playerPieces, state.aiRotation);
  if (!choice) return _endTurn(state, "ai");
  if (choice.gestaId) {
    return applyGesta(state, "ai", choice.piece.uid, choice.gestaId, choice.targetUid);
  }
  return _applyMove(state, choice.piece, choice.move, "ai");
}

// ── Forza l'AI a muovere uno specifico pezzo (dopo ardore) ───────────────────
export function applyAiMoveForPiece(state, uid) {
  if (state.turn !== "ai" || state.status !== "playing") return state;
  const piece = state.aiPieces.find(p => p.uid === uid);
  if (!piece) return _endTurn(state, "ai");
  // Considera solo quel pezzo per la scelta
  const choice = chooseBestMove([piece], state.playerPieces, state.aiRotation);
  if (!choice) return _endTurn(state, "ai");
  if (choice.gestaId) {
    return applyGesta(state, "ai", choice.piece.uid, choice.gestaId, choice.targetUid);
  }
  return _applyMove(state, choice.piece, choice.move, "ai");
}

// ── Peek mossa AI: restituisce { ardore, move } ────────────────────────────────
export function peekAiMove(state) {
  if (state.turn !== "ai" || state.status !== "playing") return null;
  return {
    ardore: chooseArdoreAction(state.aiPieces, state.playerPieces, state.aiArdoreTracker ?? createArdoreTracker()),
    move:   chooseBestMove(state.aiPieces, state.playerPieces, state.aiRotation),
  };
}

// ── Applica una scelta AI pre-calcolata (uid pezzo + riga/colonna destinazione) ─
export function applyAiChoice(state, pieceUid, toRow, toCol) {
  if (state.turn !== "ai" || state.status !== "playing") return state;
  const piece = state.aiPieces.find(p => p.uid === pieceUid);
  if (!piece) return _endTurn(state, "ai");
  const allOthers = [...state.aiPieces, ...state.playerPieces].filter(p => p.uid !== pieceUid);
  const moves = getValidMoves(piece, allOthers).filter(m => !m.target || m.target.side === "player");
  const move  = moves.find(m => m.row === toRow && m.col === toCol);
  if (!move) return _endTurn(state, "ai");
  return _applyMove(state, piece, move, "ai");
}

// ── Funzione interna: applica una mossa ───────────────────────────────────────
function _applyMove(state, piece, move, side) {
  let newLog = [...state.log];
  let newPlayerPieces = [...state.playerPieces];
  let newAiPieces     = [...state.aiPieces];
  let combatAnim = null;

  if (move.isAttack && move.target) {
    // Combattimento
    const target = move.target;
    const result = resolveCombat(piece, target);
    newLog.push(
      result.defenderHp <= 0
        ? `${piece.nome} attacca ${target.nome}! (-${result.dmg} HP) → eliminato!`
        : `${piece.nome} attacca ${target.nome}! (-${result.dmg} HP) → ${result.defenderHp} HP rimasti`
    );

    combatAnim = {
      attackerUid: piece.uid,
      defenderUid: target.uid,
      log: result.log,
    };

    // Aggiorna HP e posizioni
    // Cella più vicina al difensore raggiungibile dall'attaccante (se difensore sopravvive)
    const allForAdvance = [...state.playerPieces, ...state.aiPieces];
    const currentDistToDef = Math.max(Math.abs(piece.row - move.row), Math.abs(piece.col - move.col));
    const bestCell = result.defenderHp > 0
      ? _closestAdvanceCell(piece, move.row, move.col, allForAdvance)
      : null;
    // Avanza solo se la cella trovata è effettivamente più vicina al difensore
    const advanceCell = bestCell && bestCell.distToDef < currentDistToDef ? bestCell : null;

    const updatePiece = (p) => {
      if (p.uid === piece.uid) {
        if (result.defenderHp > 0 && advanceCell) {
          return { ...p, hp: result.attackerHp, row: advanceCell.r, col: advanceCell.c };
        }
        return { ...p, hp: result.attackerHp }; // avanzata nella cella del difensore gestita sotto
      }
      if (p.uid === target.uid) {
        return result.defenderHp > 0 ? { ...p, hp: result.defenderHp } : null;
      }
      return p;
    };

    newPlayerPieces = newPlayerPieces.map(updatePiece).filter(Boolean);
    newAiPieces     = newAiPieces.map(updatePiece).filter(Boolean);

    // Avanzata dell'attaccante se ha vinto (difensore eliminato)
    if (result.attackerHp > 0 && result.defenderHp <= 0) {
      const list = side === "player" ? newPlayerPieces : newAiPieces;
      const idx  = list.findIndex(p => p.uid === piece.uid);
      if (idx !== -1) {
        list[idx] = { ...list[idx], row: move.row, col: move.col };
      }
    }
  } else {
    // Semplice spostamento
    const list = side === "player" ? newPlayerPieces : newAiPieces;
    const idx  = list.findIndex(p => p.uid === piece.uid);
    if (idx !== -1) list[idx] = { ...list[idx], row: move.row, col: move.col };
  }

  // Aggiorna tracker rotazione
  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const tracker = side === "player" ? state.playerRotation : state.aiRotation;
  const newTracker = registerMove(piece.uid, tracker, aliveSidePieces);

  let newState = {
    ...state,
    playerPieces: newPlayerPieces,
    aiPieces:     newAiPieces,
    log:          newLog.slice(-40),
    selected:     null,
    validMoves:   [],
    combatAnim,
    ...(side === "player"
      ? { playerRotation: newTracker }
      : { aiRotation: newTracker }),
  };

  // Controlla vittoria
  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    newLog.push(winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." :
                                      "Pareggio.");
    return { ...newState, status: "over", winner, log: newLog.slice(-40) };
  }

  // Passa al turno successivo
  newState = _endTurn(newState, side);

  // Fine ciclo: cura e incremento round
  if (newTracker.cycleComplete) {
    const round = newState.round;
    newState = {
      ...newState,
      round: round + 1,
      playerPieces: applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:     applyEndRoundHeal(newState.aiPieces, round),
    };
    const heal = _getHealText(round);
    if (heal) newState.log = [...newState.log, `Fine ciclo ${round}: ${heal}`].slice(-40);
  }

  return newState;
}

function _endTurn(state, currentSide) {
  return { ...state, turn: currentSide === "player" ? "ai" : "player" };
}

function _getHealText(round) {
  if (round <= 3) return "+5 HP a tutti i sopravvissuti";
  if (round <= 6) return "+3 HP a tutti i sopravvissuti";
  if (round <= 9) return "+1 HP a tutti i sopravvissuti";
  return null;
}

// ── Gesta ─────────────────────────────────────────────────────────────────────
export function applyGesta(state, side, casterUid, gestaId, targetUid) {
  const allPieces = [...state.playerPieces, ...state.aiPieces];
  const caster = allPieces.find(p => p.uid === casterUid);
  const target = allPieces.find(p => p.uid === targetUid);
  if (!caster || !target) return state;
  const gesta = caster.gesta?.find(g => g.id === gestaId);
  if (!gesta) return state;

  const nuovoHp    = Math.max(0, target.hp - gesta.danno);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) =>
    p.uid !== targetUid ? p : (targetMorto ? null : { ...p, hp: nuovoHp });

  let newPlayerPieces = state.playerPieces.map(updatePiece).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updatePiece).filter(Boolean);

  const logMsg =
    `${caster.nome} usa ${gesta.nome} su ${target.nome}! (-${gesta.danno} HP)` +
    (targetMorto ? ` → ${target.nome} eliminato!` : ` → ${nuovoHp} HP rimasti`);

  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const tracker = side === "player" ? state.playerRotation : state.aiRotation;
  const newTracker = registerMove(casterUid, tracker, aliveSidePieces);

  let newState = {
    ...state,
    playerPieces: newPlayerPieces,
    aiPieces:     newAiPieces,
    log:          [...state.log, logMsg].slice(-40),
    selected:     null,
    validMoves:   [],
    combatAnim:   null,
    ...(side === "player"
      ? { playerRotation: newTracker }
      : { aiRotation: newTracker }),
  };

  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    const winMsg = winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                   winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
    return { ...newState, status: "over", winner, log: [...newState.log, winMsg].slice(-40) };
  }

  newState = _endTurn(newState, side);
  if (newTracker.cycleComplete) {
    const round = newState.round;
    newState = {
      ...newState,
      round:        round + 1,
      playerPieces: applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:     applyEndRoundHeal(newState.aiPieces, round),
    };
    const heal = _getHealText(round);
    if (heal) newState.log = [...newState.log, `Fine ciclo ${round}: ${heal}`].slice(-40);
  }

  return newState;
}

// ── Ardore (azione bonus — non consuma la rotazione) ─────────────────────────
export function applyArdore(state, side, casterUid, ardoreId, targetUid) {
  const allPieces = [...state.playerPieces, ...state.aiPieces];
  const caster = allPieces.find(p => p.uid === casterUid);
  const target = allPieces.find(p => p.uid === targetUid);
  if (!caster || !target) return state;
  const ardore = caster.ardore?.find(a => a.id === ardoreId);
  if (!ardore) return state;

  const nuovoHp    = Math.max(0, target.hp - ardore.danno);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) =>
    p.uid !== targetUid ? p : (targetMorto ? null : { ...p, hp: nuovoHp });

  let newPlayerPieces = state.playerPieces.map(updatePiece).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updatePiece).filter(Boolean);

  const logMsg =
    `${caster.nome} usa ${ardore.nome} su ${target.nome}! (-${ardore.danno} HP)` +
    (targetMorto ? ` → ${target.nome} eliminato!` : ` → ${nuovoHp} HP rimasti`);

  // Registra ardore (non la rotazione — il pezzo può ancora muoversi)
  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const ardoreTracker = side === "player" ? state.playerArdoreTracker : state.aiArdoreTracker;
  const newArdoreTracker = registerArdore(casterUid, ardoreTracker ?? createArdoreTracker(), aliveSidePieces);

  const newState = {
    ...state,
    playerPieces: newPlayerPieces,
    aiPieces:     newAiPieces,
    log:          [...state.log, logMsg].slice(-40),
    combatAnim:   null,
    ...(side === "player"
      ? { playerArdoreTracker: newArdoreTracker }
      : { aiArdoreTracker:     newArdoreTracker }),
    // Turno NON cambia — il pezzo deve ancora muoversi
  };

  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    const winMsg = winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                   winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
    return { ...newState, status: "over", winner, log: [...newState.log, winMsg].slice(-40) };
  }

  return newState;
}

// ── Salta turno volontario ────────────────────────────────────────────────────
export function skipPieceTurn(state, uid) {
  const piece = state.playerPieces.find(p => p.uid === uid);
  if (!piece) return state;
  const newTracker = registerMove(uid, state.playerRotation, state.playerPieces);
  let newState = {
    ...state,
    playerRotation: newTracker,
    selected: null,
    validMoves: [],
    log: [...state.log, `${piece.nome} salta il turno.`].slice(-40),
  };
  newState = _endTurn(newState, "player");
  if (newTracker.cycleComplete) {
    const round = state.round;
    const heal = _getHealText(round);
    newState = {
      ...newState,
      round: round + 1,
      playerPieces: applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:     applyEndRoundHeal(newState.aiPieces, round),
    };
    if (heal) newState.log = [...newState.log, `Fine ciclo ${round}: ${heal}`].slice(-40);
  }
  return newState;
}

// ── Gestione pezzo bloccato ───────────────────────────────────────────────────
// Se il pezzo selezionato è bloccato, skippa il suo turno nella rotazione
export function skipBlockedPiece(state, uid) {
  const piece = state.playerPieces.find(p => p.uid === uid);
  if (!piece) return state;
  const newTracker = registerMove(uid, state.playerRotation, state.playerPieces);
  return _endTurn({
    ...state,
    playerRotation: newTracker,
    selected: null,
    validMoves: [],
  }, "player");
}
