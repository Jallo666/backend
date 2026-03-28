// Schermata lobby multiplayer: crea o unisciti a una partita con codice.
// Quando la partita è pronta, chiama onMatchReady(matchConfig).

import { useState, useRef, useCallback } from "react";
import { useMultiplayerGame } from "./useMultiplayerGame.js";
import { createMultiplayerGame } from "../game/questboard/qb_state.js";

const FASE = {
  SCELTA:    "scelta",    // scegli crea o joina
  ATTESA:    "attesa",    // in attesa dell'avversario (dopo crea)
  JOINA:     "joina",     // inserisci codice
  CONNESSIONE: "connessione", // loading
};

export default function MultiplayerLobby({ token, apiUrl, onMatchReady, onBack }) {
  const [fase,        setFase]        = useState(FASE.SCELTA);
  const [matchId,     setMatchId]     = useState(null);
  const [codiceInput, setCodiceInput] = useState("");
  const [errore,      setErrore]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(null); // disconnect grace period

  // Memorizza il ruolo e matchId quando arriva MatchReady
  const pendingRole   = useRef(null);
  const pendingMatch  = useRef(null);

  // Ref intermedio: viene popolato dopo che useMultiplayerGame restituisce
  // sendAction e connectionRef, evitando la dipendenza circolare.
  const onMatchReadyImplRef = useRef(null);

  const callbacks = {
    onMatchReady: useCallback((data) => onMatchReadyImplRef.current?.(data), []),

    onOpponentDisconnected: useCallback((graceSeconds) => {
      setCountdown(graceSeconds);
      const iv = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(iv); return null; }
          return prev - 1;
        });
      }, 1000);
    }, []),

    onOpponentReconnected: useCallback(() => {
      setCountdown(null);
    }, []),

    onMatchAbandoned: useCallback(() => {
      setErrore("L'avversario ha abbandonato la partita.");
      setFase(FASE.SCELTA);
    }, []),

    onError: useCallback((msg) => {
      setErrore(msg);
      setLoading(false);
    }, []),
  };

  const { createMatch, joinMatch, sendAction, connectionRef } = useMultiplayerGame({ token, apiUrl, callbacks });

  // Aggiorna il ref ad ogni render così la closure usa sempre sendAction/connectionRef aggiornati
  onMatchReadyImplRef.current = (data) => {
    const role = pendingRole.current;
    const mid  = pendingMatch.current;
    const p1   = JSON.parse(data.player1Formation);
    const p2   = JSON.parse(data.player2Formation);
    const opponentNome = role === "player1" ? (data.player2Nome ?? "Avversario") : (data.player1Nome ?? "Avversario");
    const initialGame  = createMultiplayerGame(p1, p2, role, opponentNome);
    const gameWithFlip = {
      ...initialGame,
      turn:   data.primoTurno === role ? "player" : "ai",
      status: "playing",
      log:    [data.primoTurno === role
        ? "Hai vinto il tiro! Vai per primo."
        : `${opponentNome} va per primo.`],
    };
    onMatchReady({
      matchId:       mid,
      localRole:     role,
      opponentNome,
      initialGame:   gameWithFlip,
      player1UserId: data.player1UserId,
      player2UserId: data.player2UserId,
      sendAction: (type, params) => sendAction(type, mid, params),
      connection: connectionRef.current,
    });
  };

  // ── Crea partita ─────────────────────────────────────────────────────────

  async function handleCrea() {
    setErrore(null);
    setLoading(true);
    pendingRole.current = "player1"; // imposta prima del await
    try {
      const id = await createMatch();
      pendingMatch.current = id;
      setMatchId(id);
      setFase(FASE.ATTESA);
    } catch (e) {
      pendingRole.current = null;
      setErrore(e.message ?? "Errore nella creazione della partita");
    } finally {
      setLoading(false);
    }
  }

  // ── Unisciti a partita ────────────────────────────────────────────────────

  async function handleJoina() {
    if (!codiceInput.trim()) { setErrore("Inserisci un codice"); return; }
    setErrore(null);
    setLoading(true);
    // Imposta il ruolo PRIMA di invocare JoinMatch: MatchReady può arrivare
    // durante l'await e leggere pendingRole prima che continui il codice sotto.
    const codice = codiceInput.trim().toUpperCase();
    pendingRole.current  = "player2";
    pendingMatch.current = codice; // matchId == codice per player2
    try {
      const id = await joinMatch(codice);
      pendingMatch.current = id; // conferma (stessa stringa)
      setMatchId(id);
      setFase(FASE.CONNESSIONE);
    } catch (e) {
      pendingRole.current  = null;
      pendingMatch.current = null;
      setErrore(e.message ?? "Codice non valido o partita non trovata");
    } finally {
      setLoading(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const S = {
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(4,4,16,0.92)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "2rem", zIndex: 100,
      fontFamily: '"Press Start 2P", monospace',
      color: "#f0c040",
    },
    box: {
      background: "#0a0a1e",
      border: "2px solid #f0c040",
      padding: "2.5rem 3rem",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: "1.5rem",
      minWidth: "36rem",
    },
    title:  { fontSize: "1.1rem", letterSpacing: "0.1em" },
    btn: {
      background: "#1a1a3e", border: "2px solid #f0c040",
      color: "#f0c040", padding: "0.8rem 2rem",
      cursor: "pointer", fontFamily: "inherit",
      fontSize: "0.65rem", letterSpacing: "0.08em",
      width: "100%",
    },
    btnSecondary: {
      background: "transparent", border: "2px solid #888",
      color: "#aaa", padding: "0.6rem 1.5rem",
      cursor: "pointer", fontFamily: "inherit",
      fontSize: "0.55rem", letterSpacing: "0.08em",
    },
    input: {
      background: "#0f0f2a", border: "2px solid #f0c040",
      color: "#f0c040", padding: "0.6rem 1rem",
      fontFamily: "inherit", fontSize: "0.8rem",
      letterSpacing: "0.15em", textAlign: "center",
      width: "14rem", textTransform: "uppercase",
    },
    code: {
      fontSize: "1.8rem", letterSpacing: "0.3em",
      color: "#ffe566", background: "#1a1a3e",
      padding: "0.4rem 1.2rem", border: "1px solid #f0c040",
    },
    errore: { fontSize: "0.5rem", color: "#ff6060", maxWidth: "32rem", textAlign: "center" },
    hint:   { fontSize: "0.5rem", color: "#aaa", textAlign: "center", maxWidth: "28rem" },
  };

  if (fase === FASE.SCELTA) {
    return (
      <div style={S.overlay}>
        <div style={S.box}>
          <div style={S.title}>⚔ MODALITÀ ONLINE</div>
          <button style={S.btn} onClick={handleCrea} disabled={loading}>
            {loading ? "CARICAMENTO..." : "▶ CREA PARTITA"}
          </button>
          <button style={S.btn} onClick={() => setFase(FASE.JOINA)} disabled={loading}>
            ▷ UNISCITI CON CODICE
          </button>
          {errore && <div style={S.errore}>{errore}</div>}
          <button style={S.btnSecondary} onClick={onBack}>← INDIETRO</button>
        </div>
      </div>
    );
  }

  if (fase === FASE.JOINA) {
    return (
      <div style={S.overlay}>
        <div style={S.box}>
          <div style={S.title}>INSERISCI CODICE</div>
          <input
            style={S.input}
            maxLength={6}
            placeholder="DRAGO7"
            value={codiceInput}
            onChange={e => setCodiceInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoina()}
            autoFocus
          />
          <button style={S.btn} onClick={handleJoina} disabled={loading || !codiceInput.trim()}>
            {loading ? "CONNESSIONE..." : "ENTRA IN PARTITA"}
          </button>
          {errore && <div style={S.errore}>{errore}</div>}
          <button style={S.btnSecondary} onClick={() => setFase(FASE.SCELTA)}>← INDIETRO</button>
        </div>
      </div>
    );
  }

  if (fase === FASE.ATTESA) {
    return (
      <div style={S.overlay}>
        <div style={S.box}>
          <div style={S.title}>IN ATTESA...</div>
          <div style={S.hint}>Condividi questo codice con il tuo avversario:</div>
          <div style={S.code}>{matchId}</div>
          <div style={S.hint}>
            La partita inizierà automaticamente quando l'avversario si unisce.
          </div>
          {countdown !== null && (
            <div style={{ ...S.errore, color: "#ffa040" }}>
              ⚠ Avversario disconnesso — riconnessione entro {countdown}s
            </div>
          )}
          {errore && <div style={S.errore}>{errore}</div>}
          <button style={S.btnSecondary} onClick={onBack}>← ABBANDONA</button>
        </div>
      </div>
    );
  }

  if (fase === FASE.CONNESSIONE) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.box, alignItems: "center" }}>
          <div style={S.title}>CONNESSIONE IN CORSO...</div>
          <div style={{ fontSize: "2rem", animation: "rpgSpin 1s steps(8,end) infinite" }}>⚔</div>
          <div style={S.hint}>In attesa che l'avversario confermi la connessione.</div>
          {errore && <div style={S.errore}>{errore}</div>}
          <style>{`@keyframes rpgSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          <button style={S.btnSecondary} onClick={onBack}>← ABBANDONA</button>
        </div>
      </div>
    );
  }

  return null;
}
