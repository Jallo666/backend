// Hook React per gestire la connessione SignalR e lo stato multiplayer.
//
// Uso:
//   const mp = useMultiplayerGame({ token, apiUrl });
//   mp.createMatch()         → crea partita, ottiene codice
//   mp.joinMatch(codice)     → si unisce a partita
//   mp.sendAction(action)    → invia azione al server
//   mp.disconnect()          → disconnette
//
// Emette callback:
//   onMatchReady(matchConfig)        → partita pronta per iniziare
//   onActionReceived(action)         → azione remota da applicare allo stato
//   onOpponentDisconnected(seconds)  → avversario disconnesso, grace period
//   onOpponentReconnected()          → avversario riconnesso
//   onMatchAbandoned(winner)         → avversario ha abbandonato
//   onMatchReconnected(data)         → riconnessione: dati per replay
//   onError(msg)                     → errore SignalR

import { useRef, useCallback, useEffect } from "react";
import * as signalR from "@microsoft/signalr";

const HUB_PATH = "/hub/game";

export function useMultiplayerGame({ token, apiUrl, callbacks }) {
  const connectionRef = useRef(null);
  const callbacksRef  = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);

  // ── Connessione SignalR ────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (connectionRef.current) return connectionRef.current;

    const hubUrl = `${apiUrl}${HUB_PATH}?access_token=${encodeURIComponent(token)}`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // ── Listener eventi server ───────────────────────────────────────────
    connection.on("MatchReady",          data => callbacksRef.current?.onMatchReady?.(data));
    connection.on("ActionReceived",      action => callbacksRef.current?.onActionReceived?.(action));
    connection.on("ActionRejected",      msg => callbacksRef.current?.onError?.(`Azione rifiutata: ${msg}`));
    connection.on("OpponentDisconnected",data => callbacksRef.current?.onOpponentDisconnected?.(data.graceSeconds));
    connection.on("OpponentReconnected", ()   => callbacksRef.current?.onOpponentReconnected?.());
    connection.on("MatchAbandoned",      data => callbacksRef.current?.onMatchAbandoned?.(data.winner));
    connection.on("MatchReconnected",    data => callbacksRef.current?.onMatchReconnected?.(data));
    connection.on("Error",               msg  => callbacksRef.current?.onError?.(msg));

    await connection.start();
    connectionRef.current = connection;
    return connection;
  }, [token, apiUrl]);

  // ── Entra nella stanza SignalR ─────────────────────────────────────────────

  const joinSignalRRoom = useCallback(async (matchId) => {
    const conn = await connect();
    await conn.invoke("JoinMatch", matchId);
  }, [connect]);

  // ── Crea partita (REST + SignalR join) ────────────────────────────────────

  const createMatch = useCallback(async () => {
    const res = await fetch(`${apiUrl}/api/match/crea`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const { matchId } = await res.json();
    await joinSignalRRoom(matchId);
    return matchId;
  }, [token, apiUrl, joinSignalRRoom]);

  // ── Unisciti a partita (REST + SignalR join) ──────────────────────────────

  const joinMatch = useCallback(async (codice) => {
    const res = await fetch(`${apiUrl}/api/match/unisciti`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({ codice }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { matchId } = await res.json();
    await joinSignalRRoom(matchId);
    return matchId;
  }, [token, apiUrl, joinSignalRRoom]);

  // ── Invia azione al server ─────────────────────────────────────────────────

  const seqRef = useRef(0);

  const sendAction = useCallback(async (type, matchId, params = {}) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn("[multiplayer] sendAction: non connesso");
      return;
    }
    seqRef.current++;
    await conn.invoke("SendAction", { type, matchId, seq: seqRef.current, ...params });
  }, []);

  // ── Disconnessione ─────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
    }
    seqRef.current = 0;
  }, []);

  // NOTA: nessun auto-cleanup all'unmount.
  // La connessione viene passata a QuestBoardGame tramite mpConfig.connection
  // e verrà chiusa esplicitamente da lì (o da chi gestisce il ciclo di vita).
  // Chiama disconnect() manualmente quando necessario (es. abbandono lobby).

  return { createMatch, joinMatch, sendAction, disconnect, connectionRef };
}
