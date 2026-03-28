using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

[Authorize]
class GameHub : Hub
{
    private readonly MatchManager _matchManager;

    public GameHub(MatchManager matchManager)
    {
        _matchManager = matchManager;
    }

    private int GetUserId() =>
        int.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ── JoinMatch: entrambi i giocatori chiamano questo metodo dopo la connessione
    public async Task JoinMatch(string matchId)
    {
        var userId  = GetUserId();
        var session = _matchManager.GetSession(matchId);

        if (session == null)
        {
            await Clients.Caller.SendAsync("Error", "Partita non trovata");
            return;
        }

        // Verifica che questo utente appartenga alla partita
        var isPlayer1 = session.Player1UserId == userId;
        var isPlayer2 = session.Player2UserId == userId;

        if (!isPlayer1 && !isPlayer2)
        {
            await Clients.Caller.SendAsync("Error", "Non sei in questa partita");
            return;
        }

        // Aggiorna connectionId
        if (isPlayer1) session.Player1ConnectionId = Context.ConnectionId;
        else           session.Player2ConnectionId = Context.ConnectionId;

        await Groups.AddToGroupAsync(Context.ConnectionId, matchId);

        // ── Riconnessione dopo disconnessione ─────────────────────────────────
        if (session.DisconnectedRole != null)
        {
            _matchManager.CancelAbandonTimer(session);

            // Manda log azioni al giocatore per replay dello stato
            await Clients.Caller.SendAsync("MatchReconnected", new
            {
                matchId,
                actionLog   = session.ActionLog,
                currentTurn = session.CurrentTurn,
                primoTurno  = session.PrimoTurno,
            });

            await Clients.GroupExcept(matchId, Context.ConnectionId)
                         .SendAsync("OpponentReconnected");
            return;
        }

        // ── Entrambi connessi: avvia la partita ───────────────────────────────
        if (session.Player1ConnectionId != null &&
            session.Player2ConnectionId != null &&
            session.Status == MatchStatus.Active)
        {
            await Clients.Group(matchId).SendAsync("MatchReady", new
            {
                matchId,
                player1UserId   = session.Player1UserId,
                player2UserId   = session.Player2UserId,
                player1Nome     = session.Player1Nome,
                player2Nome     = session.Player2Nome,
                player1Formation = session.Player1FormationJson,
                player2Formation = session.Player2FormationJson,
                primoTurno      = session.PrimoTurno,
            });
        }
    }

    // ── SendAction: giocatore invia un'azione ─────────────────────────────────
    public async Task SendAction(GameAction action)
    {
        var userId  = GetUserId();
        var session = _matchManager.GetSession(action.MatchId);

        if (session == null)
        { await Clients.Caller.SendAsync("ActionRejected", "Partita non trovata"); return; }

        if (session.Status != MatchStatus.Active)
        { await Clients.Caller.SendAsync("ActionRejected", "Partita non attiva"); return; }

        var isPlayer1  = session.Player1UserId == userId;
        var isPlayer2  = session.Player2UserId == userId;
        if (!isPlayer1 && !isPlayer2)
        { await Clients.Caller.SendAsync("ActionRejected", "Non sei in questa partita"); return; }

        var playerRole = isPlayer1 ? "player1" : "player2";

        // Turno corretto? (SURRENDER non ha vincoli di turno)
        if (action.Type != "SURRENDER" && playerRole != session.CurrentTurn)
        { await Clients.Caller.SendAsync("ActionRejected", "Non è il tuo turno"); return; }

        // Incrementa sequenza (usata solo per logging/debug, non validata strettamente)
        if (action.Seq <= 0) action = action with { Seq = session.ActionSeq + 1 };

        // Validazione coordinate per MOVE
        if (action.Type == "MOVE" &&
            (action.ToRow < 0 || action.ToRow > 5 || action.ToCol < 0 || action.ToCol > 5))
        { await Clients.Caller.SendAsync("ActionRejected", "Coordinate non valide"); return; }

        // ── Applica al log e aggiorna stato ───────────────────────────────────
        session.ActionSeq++;
        session.ActionLog.Add(action);

        if (action.Type == "END_TURN")
            session.CurrentTurn = session.CurrentTurn == "player1" ? "player2" : "player1";
        else if (action.Type == "SURRENDER")
            session.Status = MatchStatus.Finished;

        // Broadcast entrambi i giocatori (anche mittente, per conferma)
        await Clients.Group(action.MatchId).SendAsync("ActionReceived", action);
    }

    // ── Disconnessione: avvia grace period 30s ────────────────────────────────
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId  = GetUserId();
        var session = _matchManager.GetSessionByUserId(userId);

        if (session != null && session.Status == MatchStatus.Active)
        {
            var disconnectedRole = session.Player1UserId == userId ? "player1" : "player2";
            session.DisconnectedRole = disconnectedRole;
            session.Status           = MatchStatus.Paused;

            await Clients.GroupExcept(session.MatchId, Context.ConnectionId)
                         .SendAsync("OpponentDisconnected", new { graceSeconds = 30 });

            _matchManager.StartAbandonTimer(session, disconnectedRole);
        }

        await base.OnDisconnectedAsync(exception);
    }
}
