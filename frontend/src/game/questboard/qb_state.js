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

// ── Sistema debuff generalizzato ──────────────────────────────────────────────
// Struttura debuff: { type, effect, targetUid, sourceUid, expiresOn }
// expiresOn: "target_acts" | "cycle_end" | "source_dies"

function addDebuff(state, debuff) {
  return { ...state, debuffs: [...(state.debuffs ?? []), debuff] };
}

function expireActDebuffs(state, uid) {
  const d = state.debuffs;
  if (!d?.length) return state;
  return { ...state, debuffs: d.filter(db => !(db.targetUid === uid && db.expiresOn === "target_acts")) };
}

function hasDebuffEffect(state, uid, effect) {
  return (state.debuffs ?? []).some(db => db.targetUid === uid && db.effect === effect);
}

// ── Crea stato iniziale ───────────────────────────────────────────────────────
// formazioneSalvata: [{id (uid pezzo), row, col, isRe}] dal backend
// inventario: pezzi dal backend
export function createGame(inventario, formazioneSalvata, sfidante = null) {
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

  const aiPieces = _initForzaDelPopolo(createAiFormation(sfidante?.pezziPreview));

  return {
    playerPieces,
    aiPieces,
    opponentNome:      sfidante?.nome      ?? "AI",
    opponentTag:       sfidante?.tag       ?? sfidante?.nome ?? "AI",
    opponentImg:       sfidante?.img       ?? null,
    opponentAvatarImg: sfidante?.avatarImg ?? sfidante?.img ?? null,
    opponentAvatarPos: sfidante?.avatarPos ?? 'center',
    turn:        "player",     // "player" | "ai"
    playerRound: 1,            // round indipendente del giocatore
    aiRound:     1,            // round indipendente dell'AI
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
    pendingCycleEnd: false,    // ciclo completo in attesa di Fine Turno esplicito
    cycleEndEvent: null,       // { round, healAmount } — trigger notifica fine ciclo
    debuffs: [],               // [{ type, effect, targetUid, sourceUid, expiresOn }]
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

  // Controlla immobilizzazione da debuff (Morso)
  if (hasDebuffEffect(state, uid, "immobilize")) {
    return {
      ...state,
      selected: uid,
      validMoves: [],
      log: [...state.log, `${piece.nome} è immobilizzato — non può muoversi!`].slice(-40),
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
export function endPlayerPieceTurn(state, uid) {
  const newPieces = uid
    ? state.playerPieces.map(p => p.uid === uid ? { ...p, canAct: false } : p)
    : state.playerPieces;
  let newState = expireActDebuffs({ ...state, playerPieces: newPieces }, uid);
  if (newState.pendingCycleEnd) {
    newState = _applyCycleEnd(newState, "player");
  }
  return _endTurn(newState, "player");
}

// ── Turno AI completo (usato solo per mosse non-attacco dirette) ─────────────
export function applyAiTurn(state) {
  if (state.turn !== "ai" || state.status !== "playing") return state;
  return applyAiMoveOnly(state);
}

// ── Solo la fase di movimento AI (senza controllo ardore — già gestito dalla UI)
export function applyAiMoveOnly(state) {
  if (state.turn !== "ai" || state.status !== "playing") return state;

  // Gestione pezzo AI immobilizzato da debuff: ha 0 mosse ma deve registrare il turno
  // altrimenti il ciclo di rotazione rimane bloccato per sempre.
  const immobilizedPiece = state.aiPieces.find(p =>
    hasDebuffEffect(state, p.uid, "immobilize") && canMoveInRotation(p.uid, state.aiRotation)
  );
  if (immobilizedPiece) {
    const newTracker = registerMove(immobilizedPiece.uid, state.aiRotation, state.aiPieces);
    let newState = expireActDebuffs({
      ...state,
      aiRotation: newTracker,
      log: [...state.log, `${_tag(immobilizedPiece)} ${immobilizedPiece.nome} è immobilizzato — salta il turno.`].slice(-40),
    }, immobilizedPiece.uid);
    if (newTracker.cycleComplete) newState = _applyCycleEnd(newState, "ai");
    return _endTurn(newState, "ai");
  }

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
  // Se il pezzo è immobilizzato, registra il turno e clearr il debuff
  if (hasDebuffEffect(state, uid, "immobilize")) {
    const newTracker = registerMove(uid, state.aiRotation, state.aiPieces);
    let newState = expireActDebuffs({
      ...state,
      aiRotation: newTracker,
      log: [...state.log, `${_tag(piece)} ${piece.nome} è immobilizzato — salta il turno.`].slice(-40),
    }, uid);
    if (newTracker.cycleComplete) newState = _applyCycleEnd(newState, "ai");
    return _endTurn(newState, "ai");
  }
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
        ? `${_tag(piece)} ${piece.nome} attacca ${_tag(target)} ${target.nome}! (-${result.dmg} HP) → eliminato!`
        : `${_tag(piece)} ${piece.nome} attacca ${_tag(target)} ${target.nome}! (-${result.dmg} HP) → ${result.defenderHp} HP rimasti`
    );

    combatAnim = {
      attackerUid: piece.uid,
      defenderUid: target.uid,
      log: result.log,
    };

    if (result.nonMortoTriggered) {
      newLog.push(`💀 Non Morto! ${target.nome} sopravvive con 1 HP!`);
    }

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
        if (result.defenderHp <= 0) return null;
        return { ...p, hp: result.defenderHp };
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
    newLog.push(`${_tag(piece)} ${piece.nome} si sposta da ${_toCoord(piece.row, piece.col)} a ${_toCoord(move.row, move.col)}`);
  }

  // Aggiorna tracker rotazione
  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const tracker = side === "player" ? state.playerRotation : state.aiRotation;
  const newTracker = registerMove(piece.uid, tracker, aliveSidePieces);

  let newState = expireActDebuffs({
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
  }, piece.uid);

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
    // Per l'AI: setta canAct: false sul pezzo che ha agito
    if (side === "ai") {
      newState = {
        ...newState,
        aiPieces: newState.aiPieces.map(p => p.uid === piece.uid ? { ...p, canAct: false } : p),
      };
    }
    newState = _endTurn(newState, side);
    // Fine ciclo immediato (AI o altri casi automatici)
    if (newTracker.cycleComplete) { newState = _applyCycleEnd(newState, side); }
  } else {
    // Player con Fine Turno esplicito: posponi ciclo
    if (newTracker.cycleComplete) { newState = { ...newState, pendingCycleEnd: true }; }
  }

  return newState;
}

function _applyCycleEnd(state, side) {
  const roundKey   = side === "player" ? "playerRound" : "aiRound";
  const piecesKey  = side === "player" ? "playerPieces" : "aiPieces";
  const trackerKey = side === "player" ? "playerArdoreTracker" : "aiArdoreTracker";
  const round      = state[roundKey];
  const healAmount = getHealAmount(round);
  let s = {
    ...state,
    [roundKey]:   round + 1,
    [piecesKey]:  applyEndRoundHeal(state[piecesKey], round).map(p => ({ ...p, canAct: true })),
    [trackerKey]: createArdoreTracker(),
    cycleEndEvent:   { round, healAmount, side, nextHealAmount: getHealAmount(round + 1) },
    pendingCycleEnd: false,
  };
  const heal = _getHealText(round, side);
  if (heal) s.log = [...s.log, `Fine ciclo ${round} (${side === "player" ? "giocatore" : "AI"}): ${heal}`].slice(-40);
  return s;
}

function _endTurn(state, currentSide) {
  return { ...state, turn: currentSide === "player" ? "ai" : "player" };
}

// Prefisso per il diario: indica di chi è il pezzo
function _toCoord(row, col) {
  return String.fromCharCode(97 + col) + (6 - row);
}

function _tag(piece) {
  return piece.side === "player" ? "[TUO]" : "[AI]";
}

function _getHealText(round, side) {
  const heal = getHealAmount(round);
  const chi  = side === "player" ? "tuoi pezzi" : "pezzi nemici";
  if (heal > 0) return `+${heal} HP ai ${chi}`;
  if (heal < 0) return `${heal} HP ai ${chi} (pericolo!)`;
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

  // Morso (effect: "immobilize") — danno ATK del caster + debuff immobilizzante
  if (gesta.effect === "immobilize") {
    const dmgMorso     = applyAuraEffects(target, caster.atk);
    const nuovoHpMorso = Math.max(0, target.hp - dmgMorso);
    const targetMortoMorso = nuovoHpMorso <= 0;

    const updatePieceMorso = (p) => {
      if (p.uid !== targetUid) return p;
      if (targetMortoMorso) return null;
      return { ...p, hp: nuovoHpMorso };
    };

    let newPlayerPieces = state.playerPieces.map(updatePieceMorso).filter(Boolean);
    let newAiPieces     = state.aiPieces.map(updatePieceMorso).filter(Boolean);

    let reAuraEvent = null;
    if (targetMortoMorso) {
      const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
      if (targetSide === "player") {
        const fdp = _applyForzaDelPopolo(newPlayerPieces, target.nome);
        newPlayerPieces = fdp.pieces; reAuraEvent = fdp.event;
      } else {
        const fdp = _applyForzaDelPopolo(newAiPieces, target.nome);
        newAiPieces = fdp.pieces; reAuraEvent = fdp.event;
      }
    }

    // Aggiunge debuff solo se il bersaglio sopravvive
    let baseState = { ...state, playerPieces: newPlayerPieces, aiPieces: newAiPieces };
    if (!targetMortoMorso) {
      const newDebuff = { type: gesta.id, effect: "immobilize", targetUid, sourceUid: casterUid, expiresOn: "target_acts" };
      baseState = addDebuff(baseState, newDebuff);
    }

    const sidePieces = side === "player" ? newPlayerPieces : newAiPieces;
    const tracker    = side === "player" ? state.playerRotation : state.aiRotation;
    const newTracker = registerMove(casterUid, tracker, sidePieces);
    const newCasterPieces = sidePieces.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
    const auraTagMorso = dmgMorso < caster.atk ? " [Difesa Possente]" : "";
    const fdpTagMorso  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
    const logMsg = targetMortoMorso
      ? `${_tag(caster)} ${caster.nome} usa ${gesta.nome} su ${_tag(target)} ${target.nome}! (-${dmgMorso} HP${auraTagMorso}) → ${target.nome} eliminato!${fdpTagMorso}`
      : `${_tag(caster)} ${caster.nome} usa ${gesta.nome} su ${_tag(target)} ${target.nome}! (-${dmgMorso} HP${auraTagMorso}) → ${nuovoHpMorso} HP rimasti, immobilizzato`;

    let newState = {
      ...baseState,
      playerPieces: side === "player" ? newCasterPieces : newPlayerPieces,
      aiPieces:     side === "ai"     ? newCasterPieces : newAiPieces,
      log:          [...baseState.log, logMsg].slice(-40),
      selected:     null,
      validMoves:   [],
      combatAnim:   null,
      reAuraEvent:  reAuraEvent ?? null,
      ...(side === "player" ? { playerRotation: newTracker } : { aiRotation: newTracker }),
    };
    newState = expireActDebuffs(newState, casterUid);

    const winner = checkWin(newState.playerPieces, newState.aiPieces);
    if (winner) { newState.winner = winner; return newState; }

    if (side === "ai") {
      newState = _endTurn(newState, side);
      if (newTracker.cycleComplete) newState = _applyCycleEnd(newState, side);
    } else {
      if (newTracker.cycleComplete) newState = { ...newState, pendingCycleEnd: true };
    }
    return newState;
  }

  // Drenaggio Vitale (effect: "drain") — danno ATK del caster, cura il caster
  if (gesta.effect === "drain") {
    const dmgDrain      = applyAuraEffects(target, caster.atk);
    const nuovoHpTarget = Math.max(0, target.hp - dmgDrain);
    const targetMortoDrain = nuovoHpTarget <= 0;
    const nuovoHpCaster = Math.min(caster.hpMax, caster.hp + dmgDrain);

    const updatePieceDrain = (p) => {
      if (p.uid === targetUid) {
        if (targetMortoDrain) return null;
        return { ...p, hp: nuovoHpTarget };
      }
      if (p.uid === casterUid) return { ...p, hp: nuovoHpCaster };
      return p;
    };

    let newPlayerPiecesDrain = state.playerPieces.map(updatePieceDrain).filter(Boolean);
    let newAiPiecesDrain     = state.aiPieces.map(updatePieceDrain).filter(Boolean);

    let reAuraEventDrain = null;
    if (targetMortoDrain) {
      const targetSide = state.playerPieces.some(p => p.uid === targetUid) ? "player" : "ai";
      if (targetSide === "player") {
        const fdp = _applyForzaDelPopolo(newPlayerPiecesDrain, target.nome);
        newPlayerPiecesDrain = fdp.pieces; reAuraEventDrain = fdp.event;
      } else {
        const fdp = _applyForzaDelPopolo(newAiPiecesDrain, target.nome);
        newAiPiecesDrain = fdp.pieces; reAuraEventDrain = fdp.event;
      }
    }

    const auraTagDrain = dmgDrain < caster.atk ? " [Difesa Possente]" : "";
    const fdpTagDrain  = reAuraEventDrain ? ` 👑 ${reAuraEventDrain.re.nome}: ${reAuraEventDrain.newHp}/${reAuraEventDrain.newHpMax} HP` : "";
    const logMsgDrain  = targetMortoDrain
      ? `${_tag(caster)} ${caster.nome} usa ${gesta.nome} su ${_tag(target)} ${target.nome}! (-${dmgDrain} HP${auraTagDrain}) → ${target.nome} eliminato! +${dmgDrain} HP a ${caster.nome}${fdpTagDrain}`
      : `${_tag(caster)} ${caster.nome} usa ${gesta.nome} su ${_tag(target)} ${target.nome}! (-${dmgDrain} HP${auraTagDrain}) → ${nuovoHpTarget} HP rimasti. +${dmgDrain} HP a ${caster.nome}`;

    if (side === "player") {
      newPlayerPiecesDrain = newPlayerPiecesDrain.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
    } else {
      newAiPiecesDrain = newAiPiecesDrain.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
    }

    const aliveSideDrain = side === "player" ? newPlayerPiecesDrain : newAiPiecesDrain;
    const trackerDrain   = side === "player" ? state.playerRotation : state.aiRotation;
    const newTrackerDrain = registerMove(casterUid, trackerDrain, aliveSideDrain);

    let newStateDrain = expireActDebuffs({
      ...state,
      playerPieces: newPlayerPiecesDrain,
      aiPieces:     newAiPiecesDrain,
      log:          [...state.log, logMsgDrain].slice(-40),
      selected:     null,
      validMoves:   [],
      combatAnim:   null,
      reAuraEvent:  reAuraEventDrain ?? null,
      ...(side === "player" ? { playerRotation: newTrackerDrain } : { aiRotation: newTrackerDrain }),
    }, casterUid);

    const winnerDrain = checkWin(newStateDrain.playerPieces, newStateDrain.aiPieces);
    if (winnerDrain) {
      const winMsg = winnerDrain === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                     winnerDrain === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
      return { ...newStateDrain, status: "over", winner: winnerDrain, log: [...newStateDrain.log, winMsg].slice(-40) };
    }

    if (side === "ai") {
      newStateDrain = _endTurn(newStateDrain, side);
      if (newTrackerDrain.cycleComplete) { newStateDrain = _applyCycleEnd(newStateDrain, side); }
    } else {
      if (newTrackerDrain.cycleComplete) { newStateDrain = { ...newStateDrain, pendingCycleEnd: true }; }
    }
    return newStateDrain;
  }

  const dannoEffettivo = applyAuraEffects(target, gesta.danno);
  const nuovoHp    = Math.max(0, target.hp - dannoEffettivo);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) => {
    if (p.uid !== targetUid) return p;
    if (targetMorto) return null;
    return { ...p, hp: nuovoHp };
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

  const auraTag = dannoEffettivo < gesta.danno ? " [Difesa Possente]" : "";
  const fdpTag  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  const logMsg  =
    `${_tag(caster)} ${caster.nome} usa ${gesta.nome} su ${_tag(target)} ${target.nome}! (-${dannoEffettivo} HP${auraTag})` +
    (targetMorto ? ` → ${target.nome} eliminato!${fdpTag}` : ` → ${nuovoHp} HP rimasti`);

  // Setta canAct: false sul caster (la gesta conclude il turno)
  if (side === "player") {
    newPlayerPieces = newPlayerPieces.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
  } else {
    newAiPieces = newAiPieces.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
  }

  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const tracker = side === "player" ? state.playerRotation : state.aiRotation;
  const newTracker = registerMove(casterUid, tracker, aliveSidePieces);

  let newState = expireActDebuffs({
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
  }, casterUid);

  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    const winMsg = winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                   winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
    return { ...newState, status: "over", winner, log: [...newState.log, winMsg].slice(-40) };
  }

  // Per il player il turno NON cambia automaticamente — aspetta il click Fine Turno
  if (side === "ai") {
    newState = _endTurn(newState, side);
    if (newTracker.cycleComplete) { newState = _applyCycleEnd(newState, side); }
  } else {
    if (newTracker.cycleComplete) { newState = { ...newState, pendingCycleEnd: true }; }
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
  const nuovoHp   = Math.max(0, target.hp - dannoEffettivo);
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

  const auraTag  = isEnemy && dannoEffettivo < rawDanno ? " [Difesa Possente]" : "";
  const fdpTag   = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  let logMsg;
  if (!isEnemy) {
    logMsg = `${_tag(caster)} ${caster.nome} scaglia ${_tag(target)} ${target.nome} in (${destRow + 1},${destCol + 1})!`;
  } else if (targetMorto) {
    logMsg = `${_tag(caster)} ${caster.nome} scaglia ${_tag(target)} ${target.nome}! (-${dannoEffettivo} HP${auraTag}) → eliminato!${fdpTag}`;
  } else {
    logMsg = `${_tag(caster)} ${caster.nome} scaglia ${_tag(target)} ${target.nome}! (-${dannoEffettivo} HP${auraTag}) → ${nuovoHp} HP rimasti`;
  }

  // Setta canAct: false sul caster (Scagliare è una gesta e conclude il turno)
  if (side === "player") {
    newPlayerPieces = newPlayerPieces.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
  } else {
    newAiPieces = newAiPieces.map(p => p.uid === casterUid ? { ...p, canAct: false } : p);
  }

  const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
  const tracker = side === "player" ? state.playerRotation : state.aiRotation;
  const newTracker = registerMove(casterUid, tracker, aliveSidePieces);

  let newState = expireActDebuffs({
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
  }, casterUid);

  const winner = checkWin(newPlayerPieces, newAiPieces);
  if (winner) {
    const winMsg = winner === "player" ? "⚜ VITTORIA! Hai sconfitto il Re nemico!" :
                   winner === "ai"     ? "☠ SCONFITTA. Il tuo Re è caduto." : "Pareggio.";
    return { ...newState, status: "over", winner, log: [...newState.log, winMsg].slice(-40) };
  }

  // Per il player il turno NON cambia automaticamente — aspetta il click Fine Turno
  if (side === "ai") {
    newState = _endTurn(newState, side);
    if (newTracker.cycleComplete) { newState = _applyCycleEnd(newState, side); }
  } else {
    if (newTracker.cycleComplete) { newState = { ...newState, pendingCycleEnd: true }; }
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

  // Carica (tipo movimento) usa resolveCombat, non il campo danno (che è undefined)
  if (ardore.tipo === "movimento") {
    return applyArdoreCaricaAttack(state, side, casterUid, targetUid);
  }

  // Preghiera Curativa (tipo cura) — ripristina HP senza logica di morte
  if (ardore.tipo === "cura") {
    const nuovoHp = Math.min(target.hpMax, target.hp + ardore.cura);
    const curato  = nuovoHp - target.hp;
    const updatePiece = (p) => p.uid !== targetUid ? p : { ...p, hp: nuovoHp };
    const newPlayerPieces = state.playerPieces.map(updatePiece);
    const newAiPieces     = state.aiPieces.map(updatePiece);
    const aliveSidePieces = side === "player" ? newPlayerPieces : newAiPieces;
    const ardoreTracker   = side === "player" ? state.playerArdoreTracker : state.aiArdoreTracker;
    const newArdoreTracker = registerArdore(casterUid, ardoreTracker ?? createArdoreTracker(), aliveSidePieces);
    const logMsg = `${_tag(caster)} ${caster.nome} usa ${ardore.nome} su ${_tag(target)} ${target.nome}! (+${curato} HP → ${nuovoHp} HP)`;
    return {
      ...state,
      playerPieces: newPlayerPieces,
      aiPieces:     newAiPieces,
      log:          [...state.log, logMsg].slice(-40),
      ...(side === "player"
        ? { playerArdoreTracker: newArdoreTracker }
        : { aiArdoreTracker:     newArdoreTracker }),
    };
  }

  const dannoEffettivo = applyAuraEffects(target, ardore.danno);
  const nuovoHp     = Math.max(0, target.hp - dannoEffettivo);
  const targetMorto = nuovoHp <= 0;
  const updatePiece = (p) => {
    if (p.uid !== targetUid) return p;
    if (targetMorto) return null;
    return { ...p, hp: nuovoHp };
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

  const auraTag = dannoEffettivo < ardore.danno ? " [Difesa Possente]" : "";
  const fdpTag  = reAuraEvent ? ` 👑 ${reAuraEvent.re.nome}: ${reAuraEvent.newHp}/${reAuraEvent.newHpMax} HP` : "";
  const logMsg =
    `${_tag(caster)} ${caster.nome} usa ${ardore.nome} su ${_tag(target)} ${target.nome}! (-${dannoEffettivo} HP${auraTag})` +
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
  const newPlayerPieces = state.playerPieces.map(p => p.uid === uid ? { ...p, canAct: false } : p);
  let newState = expireActDebuffs({
    ...state,
    playerPieces:   newPlayerPieces,
    playerRotation: newTracker,
    selected: null,
    validMoves: [],
    log: [...state.log, `${piece.nome} salta il turno.`].slice(-40),
  }, uid);
  newState = _endTurn(newState, "player");
  if (newTracker.cycleComplete) {
    newState = _applyCycleEnd(newState, "player");
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

  const logMsg = `${_tag(caster)} ${caster.nome} scatta in avanti! (Carica)`;
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
    if (p.uid === targetUid) {
      if (targetMorto) return null;
      return { ...p, hp: result.defenderHp };
    }
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
    ? `${_tag(caster)} ${caster.nome} carica ${_tag(target)} ${target.nome}! (-${result.dmg} HP) → eliminato!`
    : `${_tag(caster)} ${caster.nome} carica ${_tag(target)} ${target.nome}! (-${result.dmg} HP) → ${result.defenderHp} HP rimasti`;

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

// ── Riposiziona l'attaccante dopo un attacco (scelta giocatore) ───────────────
export function applyAttackerRelocation(state, uid, row, col) {
  return {
    ...state,
    playerPieces: state.playerPieces.map(p => p.uid === uid ? { ...p, row, col } : p),
  };
}

// ── Gestione pezzo bloccato ───────────────────────────────────────────────────
// Se il pezzo selezionato è bloccato, skippa il suo turno nella rotazione
export function skipBlockedPiece(state, uid) {
  const piece = state.playerPieces.find(p => p.uid === uid);
  if (!piece) return state;
  const newTracker = registerMove(uid, state.playerRotation, state.playerPieces);
  const newPlayerPieces = state.playerPieces.map(p => p.uid === uid ? { ...p, canAct: false } : p);
  return _endTurn(expireActDebuffs({
    ...state,
    playerPieces:   newPlayerPieces,
    playerRotation: newTracker,
    selected: null,
    validMoves: [],
  }, uid), "player");
}

// ── Fine turno esplicito AI (per multiplayer: usato dopo una Gesta) ───────────
export function endAiPieceTurn(state, uid) {
  if (state.status !== "playing") return state;
  // Se il turno è già passato al "player" (perché MOVE ha già chiamato _endTurn), no-op
  if (state.turn !== "ai") return state;
  const newTracker  = registerMove(uid, state.aiRotation, state.aiPieces);
  const newAiPieces = state.aiPieces.map(p => p.uid === uid ? { ...p, canAct: false } : p);
  let newState = _endTurn(expireActDebuffs({
    ...state,
    aiPieces:    newAiPieces,
    aiRotation:  newTracker,
  }, uid), "ai");
  if (newTracker.cycleComplete) { newState = _applyCycleEnd(newState, "ai"); }
  return newState;
}

// ── Inizializza partita multiplayer ──────────────────────────────────────────
// player1PiecesRaw / player2PiecesRaw: array di MatchPiece dal server
// localRole: "player1" | "player2"
export function createMultiplayerGame(player1PiecesRaw, player2PiecesRaw, localRole, opponentNome = "Avversario") {
  // Entrambi i giocatori salvano la formazione alle righe 4-5 (PLAYER_ROWS).
  // I pezzi dell'avversario devono stare alle righe 0-1 (AI_ROWS):
  // mirrorRow(r) = (BOARD_SIZE - 1) - r  →  riga 4 → 1, riga 5 → 0
  const BOARD_LAST_ROW = BOARD_SIZE - 1; // 5

  function toPieces(rawArr, rolePrefix, side, mirrorRow = false) {
    return _initForzaDelPopolo(rawArr.map((raw, i) => {
      const gamePiece = fromApi({
        id:        raw.dbId,
        ricettaId: raw.ricettaId,
        nome:      raw.nome,
        nomeCustom: raw.nomeCustom,
        icona:     raw.icona,
        hp:        raw.hpMax,
        hpMax:     raw.hpMax,
        atk:       raw.atk,
        def:       raw.def,
        mov:       raw.mov,
        isClassico: raw.isClassico,
        materiali: raw.materiali,
        razza:     raw.razza      ?? "Umanoide",
        materiale: raw.materiale  ?? "Legno",
      });
      return {
        ...gamePiece,
        hp:   raw.hpMax,
        row:  mirrorRow ? (BOARD_LAST_ROW - raw.row) : raw.row,
        col:  raw.col,
        isRe: raw.isRe,
        side,
        uid:  `${rolePrefix}_${raw.dbId}_${i}`, // consistente su entrambi i client
      };
    }));
  }

  const isPlayer1    = localRole === "player1";
  const playerPieces = toPieces(
    isPlayer1 ? player1PiecesRaw : player2PiecesRaw,
    isPlayer1 ? "p1" : "p2",
    "player",
    false // propri pezzi: righe 4-5, nessun mirror
  );
  const aiPieces = toPieces(
    isPlayer1 ? player2PiecesRaw : player1PiecesRaw,
    isPlayer1 ? "p2" : "p1",
    "ai",
    true  // pezzi avversario: righe 4-5 → 0-1 (mirror)
  );

  return {
    playerPieces,
    aiPieces,
    opponentNome,
    opponentTag:       opponentNome,
    opponentImg:       null,
    opponentAvatarImg: null,
    opponentAvatarPos: "center",
    turn:        "player",    // verrà aggiornato con il risultato del coin flip dal server
    playerRound: 1,
    aiRound:     1,
    status:      "coinflip",
    winner:      null,
    playerRotation:      createRotationTracker(playerPieces),
    aiRotation:          createRotationTracker(aiPieces),
    playerArdoreTracker: createArdoreTracker(),
    aiArdoreTracker:     createArdoreTracker(),
    log:             [],
    combatAnim:      null,
    selected:        null,
    validMoves:      [],
    pendingCycleEnd: false,
    cycleEndEvent:   null,
    debuffs:         [],
    // flag multiplayer
    isMultiplayer: true,
    localRole,
  };
}
