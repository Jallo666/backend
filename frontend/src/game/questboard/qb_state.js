// ── Stato di gioco Quest Board ────────────────────────────────────────────────
import {
  getValidMoves, resolveCombat, checkWin,
  createRotationTracker, registerMove, applyEndRoundHeal,
  canMoveInRotation, isBlocked,
  createArdoreTracker, registerArdore,
  applyAuraEffects,
  getHealAmount,
  BOARD_SIZE,
  calcScagliareDanno,
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
import { fromApi, AURA_CATALOG } from "./qb_pieces.js";

// ── Forza del Popolo — inizializza bonus HP del Re ────────────────────────────
function _initForzaDelPopolo(pieces) {
  const reIdx = pieces.findIndex(p => p.isRe);
  if (reIdx === -1) return pieces;
  const re = pieces[reIdx];
  const allyCount = pieces.length - 1;
  const bonus = 2 * allyCount;
  const updatedRe = {
    ...re,
    hp:    re.hp    + bonus,
    hpMax: re.hpMax + bonus,
    aura:  [...(re.aura ?? []), AURA_CATALOG.forza_del_popolo],
  };
  return pieces.map((p, i) => i === reIdx ? updatedRe : p);
}

// ── Forza del Popolo — riduce HP max del Re quando muore un alleato ───────────
function _applyForzaDelPopolo(pieces, deadPieceName) {
  const reIdx = pieces.findIndex(p => p.isRe && p.aura?.some(a => a.id === "forza_del_popolo"));
  if (reIdx === -1) return { pieces, event: null };
  const re = pieces[reIdx];
  const newHpMax = re.hpMax - 2;
  const newHp    = Math.max(1, Math.min(re.hp, newHpMax));
  const updatedRe = { ...re, hp: newHp, hpMax: newHpMax };
  return {
    pieces: pieces.map((p, i) => i === reIdx ? updatedRe : p),
    event:  { re: updatedRe, newHp, newHpMax, deadPieceName },
  };
}

// ── Crea stato iniziale ───────────────────────────────────────────────────────
// formazioneSalvata: [{id (uid pezzo), row, col, isRe}] dal backend
// inventario: pezzi dal backend
export function createGame(inventario, formazioneSalvata) {
  // inventario è già convertito via fromApi in Formazione.jsx
  // ogni pezzo ha: { uid: numericDbId, id: "guerriero", ... }
  const pezziMap = Object.fromEntries(inventario.map(p => [p.uid, p]));

  // Costruisci pezzi giocatore dalla formazione salvata
  // ogni slot ha: { uid: numericDbId, row, col, isRe }
  const playerPieces = _initForzaDelPopolo(
    formazioneSalvata.map((slot, i) => {
      const base = pezziMap[slot.uid];
      if (!base) return null;
      return {
        ...base,
        hp:   base.hpMax,
        row:  slot.row,
        col:  slot.col,
        isRe: slot.isRe,
        side: "player",
        uid:  `player_${base.uid}_${i}`,
      };
    }).filter(Boolean)
  );

  const aiPieces = _initForzaDelPopolo(createAiFormation());

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

  return _applyMove(state, piece, move, "player", true);
}

// ── Fine turno esplicito giocatore ────────────────────────────────────────────
// Chiamata dopo che il pezzo si è mosso — passa il turno all'AI.
export function endPlayerPieceTurn(state) {
  return _endTurn(state, "player");
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
// skipAutoEndTurn: se true (player), non chiama _endTurn — il ciclo-completo avviene comunque.
function _applyMove(state, piece, move, side, skipAutoEndTurn = false) {
  let newLog = [...state.log];
  let newPlayerPieces = [...state.playerPieces];
  let newAiPieces     = [...state.aiPieces];
  let combatAnim = null;
  let reAuraEvent = null;

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

    // Forza del Popolo — riduzione HP Re se un alleato è morto
    if (result.defenderHp <= 0) {
      const targetSide = state.playerPieces.some(p => p.uid === target.uid) ? "player" : "ai";
      if (targetSide === "player") {
        const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
        newPlayerPieces = fdp.pieces;
        reAuraEvent = fdp.event;
      } else {
        const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
        newAiPieces = fdp.pieces;
        reAuraEvent = fdp.event;
      }
      if (reAuraEvent) {
        newLog.push(`👑 Forza del Popolo: ${reAuraEvent.re.nome} perde 2 HP massimi → ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP`);
      }
    }

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
    reAuraEvent:  reAuraEvent ?? null,
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

  // Passa al turno successivo (saltato se il giocatore usa Fine Turno esplicito)
  if (!skipAutoEndTurn) {
    newState = _endTurn(newState, side);
  }

  // Fine ciclo: cura e incremento round
  if (newTracker.cycleComplete) {
    const round = newState.round;
    const healAmount = getHealAmount(round);
    newState = {
      ...newState,
      round:               round + 1,
      playerPieces:        applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:            applyEndRoundHeal(newState.aiPieces, round),
      playerArdoreTracker: createArdoreTracker(),
      aiArdoreTracker:     createArdoreTracker(),
      cycleEndEvent:       { round, healAmount },
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
  return "-2 HP a tutti (pericolo!)";
}

// ── Gesta ─────────────────────────────────────────────────────────────────────
export function applyGesta(state, side, casterUid, gestaId, targetUid) {
  const allPieces = [...state.playerPieces, ...state.aiPieces];
  const caster = allPieces.find(p => p.uid === casterUid);
  const target = allPieces.find(p => p.uid === targetUid);
  if (!caster || !target) return state;
  const gesta = caster.gesta?.find(g => g.id === gestaId);
  if (!gesta) return state;

  const dannoEffettivo = applyAuraEffects(target, gesta.danno);
  const nuovoHp    = Math.max(0, target.hp - dannoEffettivo);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) =>
    p.uid !== targetUid ? p : (targetMorto ? null : { ...p, hp: nuovoHp });

  let newPlayerPieces = state.playerPieces.map(updatePiece).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updatePiece).filter(Boolean);

  let reAuraEvent = null;
  if (targetMorto) {
    const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
    if (targetSide === "player") {
      const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
      newPlayerPieces = fdp.pieces; reAuraEvent = fdp.event;
    } else {
      const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
      newAiPieces = fdp.pieces; reAuraEvent = fdp.event;
    }
  }

  const auraTag = dannoEffettivo < gesta.danno ? " [Difesa Possente]" : "";
  const fdpTag  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  const logMsg =
    `${caster.nome} usa ${gesta.nome} su ${target.nome}! (-${dannoEffettivo} HP${auraTag})` +
    (targetMorto ? ` → ${target.nome} eliminato!${fdpTag}` : ` → ${nuovoHp} HP rimasti`);

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
    reAuraEvent:  reAuraEvent ?? null,
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
    const healAmount = getHealAmount(round);
    newState = {
      ...newState,
      round:               round + 1,
      playerPieces:        applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:            applyEndRoundHeal(newState.aiPieces, round),
      playerArdoreTracker: createArdoreTracker(),
      aiArdoreTracker:     createArdoreTracker(),
      cycleEndEvent:       { round, healAmount },
    };
    const heal = _getHealText(round);
    if (heal) newState.log = [...newState.log, `Fine ciclo ${round}: ${heal}`].slice(-40);
  }

  return newState;
}

// ── Scagliare ─────────────────────────────────────────────────────────────────
export function applyScagliare(state, side, casterUid, targetUid, destRow, destCol) {
  const allPieces = [...state.playerPieces, ...state.aiPieces];
  const caster = allPieces.find(p => p.uid === casterUid);
  const target = allPieces.find(p => p.uid === targetUid);
  if (!caster || !target) return state;

  const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
  const isEnemy = targetSide !== side;

  const rawDanno = isEnemy ? calcScagliareDanno(caster, destRow, destCol) : 0;
  const dannoEffettivo = isEnemy ? applyAuraEffects(target, rawDanno) : 0;
  const nuovoHp = Math.max(0, target.hp - dannoEffettivo);
  const targetMorto = isEnemy && nuovoHp <= 0;

  const updateTarget = (p) => {
    if (p.uid !== targetUid) return p;
    if (targetMorto) return null;
    return { ...p, row: destRow, col: destCol, hp: nuovoHp };
  };

  let newPlayerPieces = state.playerPieces.map(updateTarget).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updateTarget).filter(Boolean);

  let reAuraEvent = null;
  if (targetMorto) {
    if (targetSide === "player") {
      const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
      newPlayerPieces = fdp.pieces; reAuraEvent = fdp.event;
    } else {
      const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
      newAiPieces = fdp.pieces; reAuraEvent = fdp.event;
    }
  }

  const auraTag = isEnemy && dannoEffettivo < rawDanno ? " [Difesa Possente]" : "";
  const fdpTag  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  let logMsg;
  if (!isEnemy) {
    logMsg = `${caster.nome} scaglia ${target.nome} in (${destRow + 1},${destCol + 1})!`;
  } else if (targetMorto) {
    logMsg = `${caster.nome} scaglia ${target.nome}! (-${dannoEffettivo} HP${auraTag}) → eliminato!${fdpTag}`;
  } else {
    logMsg = `${caster.nome} scaglia ${target.nome}! (-${dannoEffettivo} HP${auraTag}) → ${nuovoHp} HP rimasti`;
  }

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
    reAuraEvent:  reAuraEvent ?? null,
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
    const healAmount = getHealAmount(round);
    newState = {
      ...newState,
      round:               round + 1,
      playerPieces:        applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:            applyEndRoundHeal(newState.aiPieces, round),
      playerArdoreTracker: createArdoreTracker(),
      aiArdoreTracker:     createArdoreTracker(),
      cycleEndEvent:       { round, healAmount },
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

  const dannoEffettivo = applyAuraEffects(target, ardore.danno);
  const nuovoHp    = Math.max(0, target.hp - dannoEffettivo);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) =>
    p.uid !== targetUid ? p : (targetMorto ? null : { ...p, hp: nuovoHp });

  let newPlayerPieces = state.playerPieces.map(updatePiece).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updatePiece).filter(Boolean);

  let reAuraEvent = null;
  if (targetMorto) {
    const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
    if (targetSide === "player") {
      const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
      newPlayerPieces = fdp.pieces; reAuraEvent = fdp.event;
    } else {
      const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
      newAiPieces = fdp.pieces; reAuraEvent = fdp.event;
    }
  }

  const auraTag = dannoEffettivo < ardore.danno ? " [Difesa Possente]" : "";
  const fdpTag  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  const logMsg =
    `${caster.nome} usa ${ardore.nome} su ${target.nome}! (-${dannoEffettivo} HP${auraTag})` +
    (targetMorto ? ` → ${target.nome} eliminato!${fdpTag}` : ` → ${nuovoHp} HP rimasti`);

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
    reAuraEvent:  reAuraEvent ?? null,
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
    const healAmount = getHealAmount(round);
    newState = {
      ...newState,
      round:               round + 1,
      playerPieces:        applyEndRoundHeal(newState.playerPieces, round),
      aiPieces:            applyEndRoundHeal(newState.aiPieces, round),
      playerArdoreTracker: createArdoreTracker(),
      aiArdoreTracker:     createArdoreTracker(),
      cycleEndEvent:       { round, healAmount },
    };
    if (heal) newState.log = [...newState.log, `Fine ciclo ${round}: ${heal}`].slice(-40);
  }
  return newState;
}

// ── Ardore Carica (tipo: "movimento") ────────────────────────────────────────
// Sposta il pezzo di 1 cella senza consumare la rotazione.
export function applyArdoreCarica(state, side, casterUid, toRow, toCol) {
  const pieces = side === "player" ? state.playerPieces : state.aiPieces;
  const caster = pieces.find(p => p.uid === casterUid);
  if (!caster) return state;

  const updatedPieces = pieces.map(p =>
    p.uid === casterUid ? { ...p, row: toRow, col: toCol } : p
  );

  const ardoreTracker = side === "player" ? state.playerArdoreTracker : state.aiArdoreTracker;
  const newArdoreTracker = registerArdore(casterUid, ardoreTracker ?? createArdoreTracker(), updatedPieces);

  const logMsg = `${caster.nome} scatta in avanti! (Carica)`;
  return {
    ...state,
    playerPieces: side === "player" ? updatedPieces : state.playerPieces,
    aiPieces:     side === "ai"     ? updatedPieces : state.aiPieces,
    log:          [...state.log, logMsg].slice(-40),
    ...(side === "player"
      ? { playerArdoreTracker: newArdoreTracker }
      : { aiArdoreTracker:     newArdoreTracker }),
  };
}

// ── Ardore Carica — attacco adiacente ────────────────────────────────────────
// Risolve combattimento Carica: danno, registra ardore, non consuma rotazione.
export function applyArdoreCaricaAttack(state, side, casterUid, targetUid) {
  const allPieces = [...state.playerPieces, ...state.aiPieces];
  const caster = allPieces.find(p => p.uid === casterUid);
  const target = allPieces.find(p => p.uid === targetUid);
  if (!caster || !target) return state;

  const result = resolveCombat(caster, target);
  const targetMorto = result.defenderHp <= 0;

  const updatePiece = (p) => {
    if (p.uid === targetUid)
      return targetMorto ? null : { ...p, hp: result.defenderHp };
    return p;
  };

  let newPlayerPieces = state.playerPieces.map(updatePiece).filter(Boolean);
  let newAiPieces     = state.aiPieces.map(updatePiece).filter(Boolean);

  let reAuraEvent = null;
  if (targetMorto) {
    const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
    if (targetSide === "player") {
      const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
      newPlayerPieces = fdp.pieces; reAuraEvent = fdp.event;
    } else {
      const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
      newAiPieces = fdp.pieces; reAuraEvent = fdp.event;
    }
  }

  const logMsg = targetMorto
    ? `${caster.nome} carica ${target.nome}! (-${result.dmg} HP) → eliminato!`
    : `${caster.nome} carica ${target.nome}! (-${result.dmg} HP) → ${result.defenderHp} HP rimasti`;

  // Registra ardore (non la rotazione — il pezzo può ancora muoversi)
  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const ardoreTracker = side === "player" ? state.playerArdoreTracker : state.aiArdoreTracker;
  const newArdoreTracker = registerArdore(casterUid, ardoreTracker ?? createArdoreTracker(), aliveSidePieces);

  const newState = {
    ...state,
    playerPieces: newPlayerPieces,
    aiPieces:     newAiPieces,
    log:          [...state.log, logMsg].slice(-40),
    combatAnim:   { attackerUid: casterUid, defenderUid: targetUid, log: result.log },
    reAuraEvent:  reAuraEvent ?? null,
    ...(side === "player"
      ? { playerArdoreTracker: newArdoreTracker }
      : { aiArdoreTracker:     newArdoreTracker }),
  };

  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    const winMsg = winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                   winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
    return { ...newState, status: "over", winner, log: [...newState.log, winMsg].slice(-40) };
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
