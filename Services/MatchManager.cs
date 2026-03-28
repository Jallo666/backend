using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

// ── Enums & Models ─────────────────────────────────────────────────────────────

enum MatchStatus { WaitingForPlayers, Active, Paused, Finished }

record GameAction(
    string Type,
    string MatchId,
    int Seq,
    string? PieceUid    = null,
    int?    ToRow       = null,
    int?    ToCol       = null,
    string? CasterUid   = null,
    string? GestaId     = null,
    string? ArdoreId    = null,
    string? TargetUid   = null,
    bool?   GoFirst     = null,
    int?    DestRow     = null,  // per Scagliare
    int?    DestCol     = null
);

class MatchPiece
{
    public int     DbId       { get; set; }
    public int     Index      { get; set; }
    public string  Nome       { get; set; } = "";
    public string  Icona      { get; set; } = "⚔";
    public int     Hp         { get; set; }
    public int     HpMax      { get; set; }
    public int     Atk        { get; set; }
    public int     Def        { get; set; }
    public int     Mov        { get; set; }
    public bool    IsClassico { get; set; }
    public string? Materiali  { get; set; }
    public string  Razza      { get; set; } = "Umanoide";
    public string  Materiale  { get; set; } = "Legno";
    public string? NomeCustom { get; set; }
    public string? RicettaId  { get; set; }
    public int     Row        { get; set; }
    public int     Col        { get; set; }
    public bool    IsRe       { get; set; }
}

class MatchSession
{
    public string     MatchId               { get; set; } = "";
    public int        Player1UserId         { get; set; }
    public int?       Player2UserId         { get; set; }
    public string     Player1Nome           { get; set; } = "";
    public string?    Player2Nome           { get; set; }
    public string?    Player1ConnectionId   { get; set; }
    public string?    Player2ConnectionId   { get; set; }
    public string     Player1FormationJson  { get; set; } = "[]";
    public string?    Player2FormationJson  { get; set; }
    public string     CurrentTurn           { get; set; } = "player1";
    public int        ActionSeq             { get; set; } = 0;
    public List<GameAction> ActionLog       { get; set; } = [];
    public MatchStatus Status               { get; set; } = MatchStatus.WaitingForPlayers;
    public Timer?     AbandonTimer          { get; set; }
    public string?    DisconnectedRole      { get; set; }
    public string     PrimoTurno            { get; set; } = "player1";
    public DateTime   CreatedAt             { get; set; } = DateTime.UtcNow;
}

// ── MatchManager ───────────────────────────────────────────────────────────────

class MatchManager
{
    private readonly ConcurrentDictionary<string, MatchSession> _sessions = new();
    private IHubContext<GameHub>? _hubContext;

    public void SetHubContext(IHubContext<GameHub> ctx) => _hubContext = ctx;

    // ── Creazione partita ──────────────────────────────────────────────────────

    public MatchSession CreateSession(int player1UserId, string player1Nome, string formationJson)
    {
        var matchId     = GenerateMatchId();
        var primoTurno  = Random.Shared.NextDouble() < 0.5 ? "player1" : "player2";
        var session = new MatchSession
        {
            MatchId              = matchId,
            Player1UserId        = player1UserId,
            Player1Nome          = player1Nome,
            Player1FormationJson = formationJson,
            PrimoTurno           = primoTurno,
        };
        _sessions[matchId] = session;
        return session;
    }

    // ── Join ───────────────────────────────────────────────────────────────────

    public (bool ok, string error) JoinSession(string matchId, int player2UserId, string player2Nome, string formationJson)
    {
        if (!_sessions.TryGetValue(matchId, out var session))
            return (false, "Codice partita non trovato");
        if (session.Status != MatchStatus.WaitingForPlayers)
            return (false, "Partita già iniziata");
        if (session.Player2UserId.HasValue)
            return (false, "Partita già piena");
        if (session.Player1UserId == player2UserId)
            return (false, "Non puoi giocare contro te stesso");

        session.Player2UserId       = player2UserId;
        session.Player2Nome         = player2Nome;
        session.Player2FormationJson = formationJson;
        session.Status              = MatchStatus.Active;
        return (true, "");
    }

    // ── Lookup ─────────────────────────────────────────────────────────────────

    public MatchSession?  GetSession(string matchId) =>
        _sessions.TryGetValue(matchId, out var s) ? s : null;

    public MatchSession? GetSessionByUserId(int userId) =>
        _sessions.Values.FirstOrDefault(s =>
            s.Player1UserId == userId || s.Player2UserId == userId);

    public void RemoveSession(string matchId) => _sessions.TryRemove(matchId, out _);

    // ── Abandon timer (grace period 30s) ──────────────────────────────────────

    public void StartAbandonTimer(MatchSession session, string disconnectedRole)
    {
        var matchId     = session.MatchId;
        var winnerRole  = disconnectedRole == "player1" ? "player2" : "player1";

        session.AbandonTimer = new Timer(async _ =>
        {
            session.Status = MatchStatus.Finished;
            var winnerId = disconnectedRole == "player1"
                ? session.Player2ConnectionId
                : session.Player1ConnectionId;

            if (winnerId != null && _hubContext != null)
            {
                await _hubContext.Clients.Client(winnerId).SendAsync(
                    "MatchAbandoned", new { winner = winnerRole });
            }
            RemoveSession(matchId);
        }, null, TimeSpan.FromSeconds(30), Timeout.InfiniteTimeSpan);
    }

    public void CancelAbandonTimer(MatchSession session)
    {
        session.AbandonTimer?.Dispose();
        session.AbandonTimer    = null;
        session.DisconnectedRole = null;
        session.Status          = MatchStatus.Active;
    }

    // ── Cleanup sessioni vecchie (>2h) ─────────────────────────────────────────

    public void CleanupExpired()
    {
        var expired = _sessions.Values
            .Where(s => DateTime.UtcNow - s.CreatedAt > TimeSpan.FromHours(2))
            .Select(s => s.MatchId)
            .ToList();
        foreach (var id in expired) RemoveSession(id);
    }

    // ── Generatore codice partita ──────────────────────────────────────────────

    private static string GenerateMatchId()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
    }
}
