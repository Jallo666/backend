# Multiplayer Online — Documentazione Tecnica

## Architettura

**Modello ibrido:** il server valida l'integrità del turno (è il tuo turno? il pezzo esiste? coordinate valide?), ma non esegue la logica di gioco. Entrambi i client applicano in modo deterministico le stesse funzioni di `qb_state.js` alla propria copia locale dello stato → stato sempre sincronizzato senza round-trip per ogni calcolo.

**Trasporto:** SignalR (WebSocket con fallback a long-polling automatico). Hub montato su `/hub/game`.

---

## File coinvolti

### Backend

| File | Ruolo |
|------|-------|
| `Hubs/GameHub.cs` | SignalR Hub: riceve azioni, valida turno, fa broadcast |
| `Services/MatchManager.cs` | Gestione sessioni in memoria, timer abbandono, modelli dati |
| `Program.cs` | Registrazione SignalR, CORS con credentials, JWT su WS, endpoint REST |

### Frontend

| File | Ruolo |
|------|-------|
| `frontend/src/multiplayer/MultiplayerLobby.jsx` | UI per creare/unirsi a una partita |
| `frontend/src/multiplayer/useMultiplayerGame.js` | Hook React per connessione SignalR e invio azioni |
| `frontend/src/multiplayer/applyRemoteAction.js` | Dispatcher azione remota → funzione `qb_state.js` corretta + `replayActions` |
| `frontend/src/game/questboard/qb_state.js` | Logica di stato condivisa (aggiunto `createMultiplayerGame`, `endAiPieceTurn`) |
| `frontend/src/questboard/QuestBoardGame.jsx` | Integrazione multiplayer: invia azioni, ascolta eventi SignalR, gestisce banner disconnessione |
| `frontend/src/App.jsx` | Navigazione verso pagine `multiplayer` e `questboard_mp` |
| `frontend/src/LocandaPage.jsx` | Pulsante "GIOCA ONLINE" che porta alla lobby |

---

## Flusso di una partita

### 1. Creazione / join (REST)

```
POST /api/match/crea    { formazione: [...] }  → { matchId: "DRAGO7" }
POST /api/match/unisciti { codice: "DRAGO7", formazione: [...] }  → { matchId }
```

`MatchManager.CreateSession` genera un codice a 6 caratteri (es. `"DRAGO7"`), serializza la formazione come `MatchPiece[]` con UID `p1_{dbId}_{i}`. `JoinSession` aggiunge player2 e genera gli UID `p2_{dbId}_{i}`.

### 2. Connessione SignalR

```javascript
// MultiplayerLobby.jsx — dopo ottenuto matchId
conn = new HubConnectionBuilder()
  .withUrl(`${apiUrl}/hub/game?access_token=${token}`)
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .build();
await conn.start();
await conn.invoke("JoinMatch", matchId);
```

Il token JWT non può essere mandato nell'header HTTP su WebSocket → viene passato come query param `access_token`. `Program.cs` lo legge nell'evento `OnMessageReceived` di JwtBearer.

### 3. Avvio partita (`MatchReady`)

Quando entrambi i giocatori hanno invocato `JoinMatch`, il server fa broadcast:

```json
{
  "matchId": "DRAGO7",
  "player1UserId": 1, "player2UserId": 2,
  "player1Nome": "Alice", "player2Nome": "Bob",
  "player1Formation": [...],
  "player2Formation": [...],
  "primoTurno": "player1"
}
```

Il client chiama `createMultiplayerGame(player1Formation, player2Formation, localRole, opponentNome)` che ritorna uno stato di gioco con:
- `isMultiplayer: true`
- `localRole: "player1" | "player2"`
- pezzi locali in `playerPieces`, pezzi avversari in `aiPieces`
- UID coerenti: `p1_{dbId}_{i}` e `p2_{dbId}_{i}`

### 4. Turno locale → invia azione

`QuestBoardGame.jsx` chiama `sendMpAction(type, params)` ad ogni azione del giocatore:

| Evento | Tipo azione | Parametri |
|--------|-------------|-----------|
| Movimento / attacco confermato | `MOVE` | `pieceUid, toRow, toCol` |
| Gesta confermata | `GESTA` | `casterUid, gestaId, targetUid` |
| Fine turno esplicito | `END_TURN` | `pieceUid` |
| Ardore confermato | `ARDORE` | `casterUid, ardoreId, targetUid` |
| Ardore Carica (sposta) | `ARDORE_CARICA` | `casterUid, toRow, toCol` |
| Ardore Carica (attacca) | `ARDORE_CARICA_ATTACK` | `casterUid, targetUid` |
| Scagliare | `SCAGLIARE` | `casterUid, targetUid, destRow, destCol` |
| Riposizionamento attaccante | `ATTACKER_RELOCATE` | `pieceUid, toRow, toCol` |
| Resa | `SURRENDER` | — |

`sendMpAction` chiama `mpConfig.sendAction(type, params)` che aggiunge `matchId` e `seq` e invoca `conn.invoke("SendAction", action)`.

### 5. Turno avversario → ricevi azione

Il server fa broadcast di `ActionReceived` a entrambi i client (incluso il mittente, come conferma). `QuestBoardGame.jsx`:

```javascript
conn.on("ActionReceived", (action) => {
  setGame(s => applyRemoteAction(s, action));
});
```

`applyRemoteAction` mappa il tipo di azione alla funzione `qb_state.js` corretta, trattando sempre il mittente come "ai" (lato avversario):

| Tipo | Funzione chiamata |
|------|-------------------|
| `MOVE` | `applyAiChoice(state, pieceUid, toRow, toCol)` |
| `GESTA` | `applyGesta(state, "ai", ...)` |
| `END_TURN` | `endAiPieceTurn(state, pieceUid)` |
| `ARDORE` | `applyArdore(state, "ai", ...)` |
| `ARDORE_CARICA` | `applyArdoreCarica(state, "ai", ...)` |
| `ARDORE_CARICA_ATTACK` | `applyArdoreCaricaAttack(state, "ai", ...)` |
| `SCAGLIARE` | `applyScagliare(state, "ai", ...)` |
| `ATTACKER_RELOCATE` | `applyAttackerRelocation(...)` |
| `SURRENDER` | stato → `{ status: "over", winner: "player" }` |

**Nota:** `MOVE` include già il cambio turno (`_endTurn` interno). `GESTA` non lo include — richiede un `END_TURN` successivo. `endAiPieceTurn` ha un guard `if (state.turn !== "ai") return state` per essere idempotente.

### 6. Turni alternati per pezzo

Il turno alterna pezzo per pezzo (non tutti i pezzi di un lato): dopo ogni `MOVE` il turno passa all'avversario. Internamente `qb_state.js` usa ancora `"player"` / `"ai"`, ma `isMultiplayer: true` disabilita il loop AI in `QuestBoardGame.jsx`.

---

## Validazione server (`GameHub.cs`)

Per ogni `SendAction`:
1. La partita esiste?
2. La partita è `Active` (non `Paused` o `Finished`)?
3. Questo utente appartiene alla partita?
4. È il suo turno? (`playerRole === session.CurrentTurn` — saltato per `SURRENDER`)
5. Coordinate valide per `MOVE` (0–5)?

Se una validazione fallisce → `ActionRejected` solo al mittente.

Dopo validazione: aggiunge al `session.ActionLog`, aggiorna `session.CurrentTurn` (per `END_TURN`) o `session.Status` (per `SURRENDER`), poi `broadcast ActionReceived`.

---

## Disconnessioni e riconnessioni

### Avversario si disconnette

```
Server: OnDisconnectedAsync → session.Status = Paused
Server: → broadcast OpponentDisconnected { graceSeconds: 30 }
Server: → StartAbandonTimer (30s)
Client: OpponentDisconnected → mostra banner con countdown 30s
```

Se il countdown arriva a 0 senza riconnessione:
```
Server: timer scade → session.Status = Finished → broadcast MatchAbandoned
Client: MatchAbandoned → game over, winner = "player"
```

### Avversario si riconnette entro 30s

```
Server: JoinMatch richiamato → CancelAbandonTimer → broadcast OpponentReconnected
Client: OpponentReconnected → nasconde banner
```

### Riconnessione locale (caduta di rete)

SignalR gestisce la riconnessione automatica (`withAutomaticReconnect([0, 2000, 5000, 10000])`).

```javascript
conn.onreconnected(() => conn.invoke("JoinMatch", matchId));
```

Il server rileva che era disconnesso (`session.DisconnectedRole != null`) e invia `MatchReconnected`:

```json
{ "matchId": "DRAGO7", "actionLog": [...], "currentTurn": "player1", "primoTurno": "player1" }
```

Il client chiama `replayActions(initialGame, actionLog, localRole)` che riapplica tutto il log dall'`initialGame`:
- azioni dei propri pezzi (`p1_*` se `localRole === "player1"`) → funzioni lato "player"
- azioni avversarie → `applyRemoteAction` (lato "ai")

---

## UID dei pezzi

Gli UID sono generati dal server in modo deterministico così entrambi i client usano gli stessi riferimenti:

```
p1_{dbId}_{index}   // pezzi di player1
p2_{dbId}_{index}   // pezzi di player2
```

`dbId` = ID del personaggio nel database, `index` = posizione nell'array di formazione.

---

## JWT su WebSocket

Il browser non può mandare header `Authorization` su connessioni WebSocket. Soluzione in `Program.cs`:

```csharp
options.Events = new JwtBearerEvents {
  OnMessageReceived = ctx => {
    var token = ctx.Request.Query["access_token"];
    if (!string.IsNullOrEmpty(token) && ctx.Request.Path.StartsWithSegments("/hub/game"))
      ctx.Token = token;
    return Task.CompletedTask;
  }
};
```

CORS deve includere `.AllowCredentials()` altrimenti SignalR rifiuta la connessione.

---

## Navigazione in `App.jsx`

```
mainmenu
  └─ locanda (LocandaPage)
       ├─ formazione → questboard        (solo PvE)
       └─ multiplayer (MultiplayerLobby)
            └─ questboard_mp             (PvP online)
                 onBack → stop() connection → locanda
```

`mpConfig` passato a `QuestBoardGame` contiene:
```javascript
{
  matchId,       // es. "DRAGO7"
  localRole,     // "player1" | "player2"
  initialGame,   // stato iniziale per replay
  sendAction,    // (type, params) => Promise
  connection,    // HubConnection (per eventi e onreconnected)
}
```
