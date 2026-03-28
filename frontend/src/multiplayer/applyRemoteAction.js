// Applica un'azione ricevuta dall'avversario tramite SignalR allo stato locale.
//
// Convenzione:
//   MOVE     → usa applyAiChoice (gestisce movimento + combattimento + fine turno)
//   GESTA    → usa applyGesta (NON termina il turno)
//   END_TURN → usa endAiPieceTurn (termina il turno dopo una GESTA)
//   ARDORE   → usa applyArdore (azione bonus, non cambia turno)
//   ARDORE_CARICA / ARDORE_CARICA_ATTACK → varianti carica
//   SCAGLIARE → usa applyScagliare

import {
  applyAiChoice,
  applyGesta,
  applyArdore,
  applyArdoreCarica,
  applyArdoreCaricaAttack,
  applyScagliare,
  applyAttackerRelocation,
  endAiPieceTurn,
  selectPiece,
  applyPlayerMove,
  endPlayerPieceTurn,
} from "../game/questboard/qb_state.js";

export function applyRemoteAction(state, action) {
  switch (action.type) {
    case "MOVE":
      // applyAiChoice applica il movimento, risolve il combattimento,
      // aggiorna la rotazione e chiama _endTurn → turn passa a "player"
      return applyAiChoice(state, action.pieceUid, action.toRow, action.toCol);

    case "GESTA":
      // La Gesta è l'azione principale: NON chiama _endTurn da sola.
      // L'END_TURN successivo completerà il turno.
      return applyGesta(state, "ai", action.casterUid, action.gestaId, action.targetUid);

    case "END_TURN":
      // Chiamato dopo una GESTA (non dopo MOVE, che è già autosufficiente).
      // Aggiorna la rotazione e passa il turno al giocatore locale.
      return endAiPieceTurn(state, action.pieceUid);

    case "ARDORE":
      return applyArdore(state, "ai", action.casterUid, action.ardoreId, action.targetUid);

    case "ARDORE_CARICA":
      return applyArdoreCarica(state, "ai", action.casterUid, action.toRow, action.toCol);

    case "ARDORE_CARICA_ATTACK":
      return applyArdoreCaricaAttack(state, "ai", action.casterUid, action.targetUid);

    case "SCAGLIARE":
      return applyScagliare(state, "ai", action.casterUid, action.targetUid, action.destRow, action.destCol);

    case "ATTACKER_RELOCATE":
      return applyAttackerRelocation(state, action.pieceUid, action.toRow, action.toCol);

    case "SURRENDER":
      return {
        ...state,
        status: "over",
        winner: "player",
        log: [...state.log, "L'avversario si è arreso. Hai vinto!"].slice(-40),
      };

    default:
      console.warn("[applyRemoteAction] Tipo azione sconosciuto:", action.type);
      return state;
  }
}

// ── Ricostruzione stato da action log (usata dopo riconnessione) ──────────────
// Riproduce il log dall'initialGame applicando ogni azione come locale o remota
// in base al prefisso UID del pezzo (p1_ = player1, p2_ = player2).
export function replayActions(initialGame, actionLog, localRole) {
  const localPrefix = localRole === "player1" ? "p1_" : "p2_";

  function isLocalAction(action) {
    const uid = action.pieceUid ?? action.casterUid;
    return uid?.startsWith(localPrefix) ?? false;
  }

  function applyLocalAction(state, action) {
    switch (action.type) {
      case "MOVE": {
        const s1 = selectPiece(state, action.pieceUid);
        return applyPlayerMove(s1, action.toRow, action.toCol);
      }
      case "GESTA":
        return applyGesta(state, "player", action.casterUid, action.gestaId, action.targetUid);
      case "END_TURN":
        return endPlayerPieceTurn(state, action.pieceUid);
      case "ARDORE":
        return applyArdore(state, "player", action.casterUid, action.ardoreId, action.targetUid);
      case "ARDORE_CARICA":
        return applyArdoreCarica(state, "player", action.casterUid, action.toRow, action.toCol);
      case "ARDORE_CARICA_ATTACK":
        return applyArdoreCaricaAttack(state, "player", action.casterUid, action.targetUid);
      case "SCAGLIARE":
        return applyScagliare(state, "player", action.casterUid, action.targetUid, action.destRow, action.destCol);
      case "ATTACKER_RELOCATE":
        return applyAttackerRelocation(state, action.pieceUid, action.toRow, action.toCol);
      case "SURRENDER":
        return {
          ...state,
          status: "over",
          winner: "ai",
          log: [...state.log, "Ti sei arreso."].slice(-40),
        };
      default:
        return state;
    }
  }

  return actionLog.reduce((state, action) => {
    return isLocalAction(action)
      ? applyLocalAction(state, action)
      : applyRemoteAction(state, action);
  }, initialGame);
}
