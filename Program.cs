using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "chiave-segreta-locale-dev-12345678901234";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                  "http://localhost:5173",
                  "http://localhost:5174",
                  "https://frontend-cop1.onrender.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("Default");
    if (string.IsNullOrEmpty(connStr))
    {
        options.UseSqlite("Data Source=locale.db");
    }
    else
    {
        if (connStr.StartsWith("postgres://") || connStr.StartsWith("postgresql://"))
        {
            var uri = new Uri(connStr);
            var userInfo = uri.UserInfo.Split(':');
            var port = uri.Port == -1 ? 5432 : uri.Port;
            connStr = $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
        }
        options.UseNpgsql(connStr);
    }
});

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Startup: migrazioni manuali + seed ────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Migrazione: colonna Ruolo (legacy)
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Ruolo\" text NOT NULL DEFAULT 'user'"); }
    catch { }

    // Migrazione: tabella PezziUtente
    var isPostgres = db.Database.ProviderName?.Contains("Npgsql") == true;

    // Migrazione: nuovi campi Utenti (Music, Audio, Avatar, Language, Monete)
    if (isPostgres)
    {
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Music\"    BOOLEAN NOT NULL DEFAULT TRUE"); }  catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Audio\"    BOOLEAN NOT NULL DEFAULT TRUE"); }  catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Avatar\"   TEXT"); }                           catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Language\" TEXT    NOT NULL DEFAULT 'ita'"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Monete\"   INTEGER NOT NULL DEFAULT 0"); }     catch { }
    }
    else
    {
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Music\"    INTEGER NOT NULL DEFAULT 1"); }     catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Audio\"    INTEGER NOT NULL DEFAULT 1"); }     catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Avatar\"   TEXT"); }                           catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Language\" TEXT    NOT NULL DEFAULT 'ita'"); } catch { }
        try { db.Database.ExecuteSqlRaw("ALTER TABLE \"Utenti\" ADD COLUMN \"Monete\"   INTEGER NOT NULL DEFAULT 0"); }     catch { }
    }
    try
    {
        if (isPostgres)
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""PezziUtente"" (
                    ""Id""         SERIAL PRIMARY KEY,
                    ""UtenteId""   INTEGER NOT NULL,
                    ""Nome""       TEXT    NOT NULL DEFAULT '',
                    ""Icona""      TEXT    NOT NULL DEFAULT '⚔',
                    ""Hp""         INTEGER NOT NULL DEFAULT 0,
                    ""HpMax""      INTEGER NOT NULL DEFAULT 0,
                    ""Atk""        INTEGER NOT NULL DEFAULT 0,
                    ""Def""        INTEGER NOT NULL DEFAULT 0,
                    ""Mov""        INTEGER NOT NULL DEFAULT 0,
                    ""IsClassico"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""Materiali""  TEXT
                )");
        }
        else
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""PezziUtente"" (
                    ""Id""         INTEGER PRIMARY KEY AUTOINCREMENT,
                    ""UtenteId""   INTEGER NOT NULL,
                    ""Nome""       TEXT    NOT NULL DEFAULT '',
                    ""Icona""      TEXT    NOT NULL DEFAULT '⚔',
                    ""Hp""         INTEGER NOT NULL DEFAULT 0,
                    ""HpMax""      INTEGER NOT NULL DEFAULT 0,
                    ""Atk""        INTEGER NOT NULL DEFAULT 0,
                    ""Def""        INTEGER NOT NULL DEFAULT 0,
                    ""Mov""        INTEGER NOT NULL DEFAULT 0,
                    ""IsClassico"" INTEGER NOT NULL DEFAULT 1,
                    ""Materiali""  TEXT
                )");
        }
    }
    catch { }

    // Migrazione: Razza, Materiale, NomeCustom, RicettaId su PezziUtente
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"PezziUtente\" ADD COLUMN \"Razza\" TEXT NOT NULL DEFAULT 'Umanoide'"); }
    catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"PezziUtente\" ADD COLUMN \"Materiale\" TEXT NOT NULL DEFAULT 'Legno'"); }
    catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"PezziUtente\" ADD COLUMN \"NomeCustom\" TEXT"); }
    catch { }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE \"PezziUtente\" ADD COLUMN \"RicettaId\" TEXT"); }
    catch { }

    // Migrazione: tabella Formazioni
    try
    {
        if (isPostgres)
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Formazioni"" (
                    ""Id""       SERIAL PRIMARY KEY,
                    ""UtenteId"" INTEGER NOT NULL UNIQUE,
                    ""Data""     TEXT    NOT NULL DEFAULT '[]'
                )");
        }
        else
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Formazioni"" (
                    ""Id""       INTEGER PRIMARY KEY AUTOINCREMENT,
                    ""UtenteId"" INTEGER NOT NULL UNIQUE,
                    ""Data""     TEXT    NOT NULL DEFAULT '[]'
                )");
        }
    }
    catch { }

    // Migrazione: tabella MaterialiUtente
    try
    {
        if (isPostgres)
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""MaterialiUtente"" (
                    ""Id""        SERIAL PRIMARY KEY,
                    ""UtenteId""  INTEGER NOT NULL,
                    ""Tipo""      TEXT    NOT NULL DEFAULT '',
                    ""Categoria"" TEXT    NOT NULL DEFAULT 'materiale',
                    ""Quantita""  INTEGER NOT NULL DEFAULT 0
                )");
        }
        else
        {
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""MaterialiUtente"" (
                    ""Id""        INTEGER PRIMARY KEY AUTOINCREMENT,
                    ""UtenteId""  INTEGER NOT NULL,
                    ""Tipo""      TEXT    NOT NULL DEFAULT '',
                    ""Categoria"" TEXT    NOT NULL DEFAULT 'materiale',
                    ""Quantita""  INTEGER NOT NULL DEFAULT 0
                )");
        }
    }
    catch { }

    // Seed materiali per utenti esistenti senza materiali
    var utentiSenzaMateriali = db.Utenti
        .Where(u => !db.MaterialiUtente.Any(m => m.UtenteId == u.Id))
        .ToList();
    foreach (var u in utentiSenzaMateriali)
        SeedMaterialiDefault(db, u.Id);
    if (utentiSenzaMateriali.Any()) db.SaveChanges();

    // Seed farina_ossa e onice_nero per utenti che non li hanno ancora
    var nuoviMaterialiSeed = new[] { ("farina_ossa", "reagente"), ("onice_nero", "gemma") };
    var utentiEsistenti = db.Utenti.ToList();
    bool nuoviMatAdded = false;
    foreach (var u in utentiEsistenti)
    {
        foreach (var (tipo, cat) in nuoviMaterialiSeed)
        {
            if (!db.MaterialiUtente.Any(m => m.UtenteId == u.Id && m.Tipo == tipo))
            {
                db.MaterialiUtente.Add(new MaterialeUtente { UtenteId = u.Id, Tipo = tipo, Categoria = cat, Quantita = 100 });
                nuoviMatAdded = true;
            }
        }
    }
    if (nuoviMatAdded) db.SaveChanges();

    // Migrazione: imposta RicettaId sui pezzi classici che ne sono privi
    var ricettaIdClassici = new Dictionary<string, string>
    {
        ["Cavaliere"] = "cavaliere", ["Ranger"]   = "ranger",   ["Scudiero"]  = "scudiero",
        ["Assassino"] = "assassino", ["Mago"]      = "mago",     ["Campione"]  = "campione",
        ["Chierico"]  = "chierico",  ["Barbaro"]   = "barbaro",  ["Lupo"]      = "lupo",
    };
    var pezziSenzaRicetta = db.PezziUtente
        .Where(p => p.RicettaId == null && ricettaIdClassici.Keys.Contains(p.Nome))
        .ToList();
    foreach (var p in pezziSenzaRicetta)
        if (ricettaIdClassici.TryGetValue(p.Nome, out var rid)) p.RicettaId = rid;
    if (pezziSenzaRicetta.Any()) db.SaveChanges();

    // Seed admin
    if (!db.Utenti.Any(u => u.Ruolo == "admin"))
    {
        var adminPassword = app.Configuration["Admin:Password"] ?? "Admin123!";
        var adminUtente = new Utente
        {
            Nome = "Admin", Cognome = "", Email = "admin@admin.com",
            Password = BCrypt.Net.BCrypt.HashPassword(adminPassword), Ruolo = "admin"
        };
        db.Utenti.Add(adminUtente);
        db.SaveChanges();
        SeedPezziClassici(db, adminUtente.Id);
        db.SaveChanges();
    }

    // Seed pezzi classici per utenti che non li hanno ancora
    var utentiSenzaPezzi = db.Utenti
        .Where(u => !db.PezziUtente.Any(p => p.UtenteId == u.Id))
        .ToList();
    foreach (var u in utentiSenzaPezzi)
        SeedPezziClassici(db, u.Id);
    if (utentiSenzaPezzi.Any()) db.SaveChanges();
}

// ── Endpoint: statistiche giocatore ──────────────────────────────────────────
// I dati di gioco sono persistiti lato frontend (localStorage).
// Endpoint placeholder per futura persistenza server-side.
app.MapGet("/api/player/stats", (ClaimsPrincipal user) =>
    Results.Ok(new { floor = 1, level = 1, hp = 20, maxHp = 20, gems = 0, gold = 0 }))
    .RequireAuthorization();

// ── Endpoint: inventario pezzi ────────────────────────────────────────────────
app.MapGet("/api/inventario", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var pezzi = await db.PezziUtente
        .Where(p => p.UtenteId == utenteId)
        .Select(p => new {
            p.Id, p.Nome, p.Icona,
            p.Hp, p.HpMax, p.Atk, p.Def, p.Mov,
            p.IsClassico, p.Materiali,
            p.Razza, p.Materiale, p.NomeCustom, p.RicettaId
        })
        .ToListAsync();
    return Results.Ok(pezzi);
}).RequireAuthorization();

// ── Endpoint: reset inventario ai pezzi classici ─────────────────────────────
app.MapPost("/api/inventario/reset", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // Rimuovi tutti i pezzi dell'utente
    var pezziEsistenti = db.PezziUtente.Where(p => p.UtenteId == utenteId);
    db.PezziUtente.RemoveRange(pezziEsistenti);
    await db.SaveChangesAsync();

    // Seed pezzi classici
    SeedPezziClassici(db, utenteId);
    await db.SaveChangesAsync();

    // Restituisci il nuovo inventario
    var nuoviPezzi = await db.PezziUtente
        .Where(p => p.UtenteId == utenteId)
        .Select(p => new { p.Id, p.Nome, p.Icona, p.Hp, p.HpMax, p.Atk, p.Def, p.Mov, p.IsClassico, p.Materiali })
        .ToListAsync();
    return Results.Ok(nuoviPezzi);
}).RequireAuthorization();

// ── Endpoint: formazione salvata ──────────────────────────────────────────────
app.MapGet("/api/formazione", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var formazione = await db.Formazioni.FirstOrDefaultAsync(f => f.UtenteId == utenteId);
    return Results.Ok(new { data = formazione?.Data ?? "[]" });
}).RequireAuthorization();

app.MapPut("/api/formazione", async (ClaimsPrincipal user, FormazioneRequest req, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var formazione = await db.Formazioni.FirstOrDefaultAsync(f => f.UtenteId == utenteId);
    if (formazione is null)
    {
        db.Formazioni.Add(new Formazione { UtenteId = utenteId, Data = req.Data });
    }
    else
    {
        formazione.Data = req.Data;
    }
    await db.SaveChangesAsync();
    return Results.Ok();
}).RequireAuthorization();

// ── Mappa costi per ricetta ───────────────────────────────────────────────────
Dictionary<string, (string tipo, int qty)[]> CostiRicette = new()
{
    ["cavaliere"] = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["ranger"]    = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["scudiero"]  = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["assassino"] = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["mago"]      = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["campione"]  = [("legna", 2), ("quarzo", 2), ("resina", 2)],
    ["lich"]           = [("legna", 2), ("farina_ossa", 2), ("onice_nero", 2)],
    ["guerriero_ossa"] = [("legna", 2), ("farina_ossa", 2), ("onice_nero", 2)],
};
(string tipo, int qty)[] CostoDefault = [("legna", 2), ("quarzo", 2), ("resina", 2)];

// ── Endpoint: crafta pezzo ────────────────────────────────────────────────────
app.MapPost("/api/inventario/crafta", async (ClaimsPrincipal user, CraftaRequest req, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // Deduzione materiali (costo per-ricetta, fallback al default)
    var costoForgia = req.RicettaId is not null && CostiRicette.TryGetValue(req.RicettaId, out var costoRic)
        ? costoRic : CostoDefault;
    foreach (var (tipo, qty) in costoForgia)
    {
        var mat = await db.MaterialiUtente
            .FirstOrDefaultAsync(m => m.UtenteId == utenteId && m.Tipo == tipo);
        if (mat is null || mat.Quantita < qty)
            return Results.BadRequest($"Materiali insufficienti: {tipo}");
        mat.Quantita -= qty;
    }

    var pezzo = new PezzoUtente
    {
        UtenteId   = utenteId,
        Nome       = req.Nome,
        Icona      = req.Icona,
        Hp         = req.Hp,
        HpMax      = req.HpMax,
        Atk        = req.Atk,
        Def        = req.Def,
        Mov        = req.Mov,
        IsClassico = false,
        Materiali  = req.Materiali,
        Razza      = req.Razza,
        Materiale  = req.Materiale,
        NomeCustom = req.NomeCustom,
        RicettaId  = req.RicettaId,
    };
    db.PezziUtente.Add(pezzo);
    await db.SaveChangesAsync();
    return Results.Ok(new {
        pezzo.Id, pezzo.Nome, pezzo.Icona,
        pezzo.Hp, pezzo.HpMax, pezzo.Atk, pezzo.Def, pezzo.Mov,
        pezzo.IsClassico, pezzo.Materiali,
        pezzo.Razza, pezzo.Materiale, pezzo.NomeCustom, pezzo.RicettaId
    });
}).RequireAuthorization();

// ── Endpoint: elimina/distruggi pezzo inventario ─────────────────────────────
app.MapDelete("/api/inventario/{id}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var pezzo = await db.PezziUtente.FindAsync(id);
    if (pezzo is null || pezzo.UtenteId != utenteId) return Results.NotFound();

    List<object>? rimborso = null;
    if (!pezzo.IsClassico)
    {
        var costo = pezzo.RicettaId is not null && CostiRicette.TryGetValue(pezzo.RicettaId, out var c)
            ? c : CostoDefault;
        var rimborsoList = new List<object>();
        foreach (var (tipo, qty) in costo)
        {
            var mat = await db.MaterialiUtente
                .FirstOrDefaultAsync(m => m.UtenteId == utenteId && m.Tipo == tipo);
            if (mat is not null)
            {
                mat.Quantita += qty / 2;
                rimborsoList.Add(new { tipo, quantita = qty / 2 });
            }
        }
        rimborso = rimborsoList;
    }

    db.PezziUtente.Remove(pezzo);
    await db.SaveChangesAsync();
    return Results.Ok(new { rimborso });
}).RequireAuthorization();

// ── Endpoint: materiali utente ────────────────────────────────────────────────
app.MapGet("/api/materiali", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var materiali = await db.MaterialiUtente
        .Where(m => m.UtenteId == utenteId)
        .Select(m => new { m.Tipo, m.Categoria, m.Quantita })
        .ToListAsync();
    return Results.Ok(materiali);
}).RequireAuthorization();

// ── Endpoint: vendi materiale ─────────────────────────────────────────────────
var PREZZI_VENDITA = new Dictionary<string, int>
{
    ["legna"]       = 1,
    ["quarzo"]      = 2,
    ["onice_nero"]  = 2,
    ["resina"]      = 2,
    ["farina_ossa"] = 2,
};

app.MapPost("/api/materiali/vendi", async (ClaimsPrincipal user, VendiRequest req, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (req.Quantita <= 0) return Results.BadRequest("Quantità non valida");
    if (!PREZZI_VENDITA.TryGetValue(req.Tipo, out var prezzoUnit))
        return Results.BadRequest("Materiale non vendibile");

    var mat = await db.MaterialiUtente.FirstOrDefaultAsync(m => m.UtenteId == utenteId && m.Tipo == req.Tipo);
    if (mat is null || mat.Quantita < req.Quantita) return Results.BadRequest("Quantità insufficiente");

    var utente = await db.Utenti.FindAsync(utenteId);
    if (utente is null) return Results.NotFound();

    mat.Quantita   -= req.Quantita;
    utente.Monete  += prezzoUnit * req.Quantita;
    await db.SaveChangesAsync();

    return Results.Ok(new { mat.Quantita, utente.Monete });
}).RequireAuthorization();

// ── Endpoint: compra materiale ────────────────────────────────────────────────
var PREZZI_ACQUISTO = new Dictionary<string, int>
{
    ["legna"]       = 2,
    ["quarzo"]      = 4,
    ["onice_nero"]  = 4,
    ["resina"]      = 4,
    ["farina_ossa"] = 4,
};

app.MapPost("/api/materiali/compra", async (ClaimsPrincipal user, VendiRequest req, AppDbContext db) =>
{
    var utenteId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (req.Quantita <= 0) return Results.BadRequest("Quantità non valida");
    if (!PREZZI_ACQUISTO.TryGetValue(req.Tipo, out var prezzoUnit))
        return Results.BadRequest("Materiale non acquistabile");

    var utente = await db.Utenti.FindAsync(utenteId);
    if (utente is null) return Results.NotFound();

    var costo = prezzoUnit * req.Quantita;
    if (utente.Monete < costo) return Results.BadRequest("Monete insufficienti");

    var mat = await db.MaterialiUtente.FirstOrDefaultAsync(m => m.UtenteId == utenteId && m.Tipo == req.Tipo);
    if (mat is null) return Results.NotFound("Materiale non trovato nell'inventario");

    utente.Monete -= costo;
    mat.Quantita  += req.Quantita;
    await db.SaveChangesAsync();

    return Results.Ok(new { mat.Quantita, utente.Monete });
}).RequireAuthorization();

// ── Endpoint: utenti ──────────────────────────────────────────────────────────
app.MapGet("/utenti", async (AppDbContext db) =>
    await db.Utenti.Select(u => new { u.Id, u.Nome, u.Cognome, u.Email, u.Ruolo }).ToListAsync())
    .RequireAuthorization();

app.MapPost("/login", async (LoginRequest req, AppDbContext db) =>
{
    var utente = await db.Utenti.FirstOrDefaultAsync(u => u.Email == req.Email);
    if (utente is null || !BCrypt.Net.BCrypt.Verify(req.Password, utente.Password))
        return Results.Unauthorized();

    var token = GeneraToken(utente, key);
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, utente.Ruolo, utente.Music, utente.Audio, utente.Avatar, utente.Language, utente.Monete, token });
});

app.MapPost("/registrati", async (RegistrazioneRequest req, AppDbContext db) =>
{
    if (await db.Utenti.AnyAsync(u => u.Email == req.Email))
        return Results.Conflict("Email già in uso");

    var utente = new Utente
    {
        Nome = req.Nome, Cognome = req.Cognome,
        Email = req.Email,
        Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
        Ruolo = "user",
    };
    db.Utenti.Add(utente);
    await db.SaveChangesAsync();

    // Seed pezzi classici e materiali al nuovo utente
    SeedPezziClassici(db, utente.Id);
    SeedMaterialiDefault(db, utente.Id);
    await db.SaveChangesAsync();

    var token = GeneraToken(utente, key);
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, utente.Ruolo, utente.Music, utente.Audio, utente.Avatar, utente.Language, utente.Monete, token });
});

app.MapDelete("/utenti/{id}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
{
    var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    if (currentUserId == id)
        return Results.BadRequest("Non puoi eliminare te stesso");

    var utente = await db.Utenti.FindAsync(id);
    if (utente is null) return Results.NotFound();

    db.Utenti.Remove(utente);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization(p => p.RequireRole("admin"));

app.MapGet("/api/me/preferenze", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var id = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var utente = await db.Utenti.FindAsync(id);
    if (utente is null) return Results.NotFound();
    return Results.Ok(new { utente.Music, utente.Audio, utente.Avatar, utente.Language, utente.Monete });
}).RequireAuthorization();

app.MapPatch("/api/me/preferenze", async (ClaimsPrincipal user, PreferenzeRequest req, AppDbContext db) =>
{
    var id = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    var utente = await db.Utenti.FindAsync(id);
    if (utente is null) return Results.NotFound();

    if (req.Music    is not null) utente.Music    = req.Music.Value;
    if (req.Audio    is not null) utente.Audio    = req.Audio.Value;
    if (req.Avatar   is not null) utente.Avatar   = req.Avatar;
    if (req.Language is not null) utente.Language = req.Language;
    if (req.Monete   is not null) utente.Monete   = req.Monete.Value;

    await db.SaveChangesAsync();
    return Results.Ok(new { utente.Music, utente.Audio, utente.Avatar, utente.Language, utente.Monete });
}).RequireAuthorization();

app.Run();

// ── Helper: genera JWT ────────────────────────────────────────────────────────
string GeneraToken(Utente utente, SymmetricSecurityKey key)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, utente.Id.ToString()),
        new Claim(ClaimTypes.Email, utente.Email),
        new Claim(ClaimTypes.Role, utente.Ruolo)
    };
    var jwt = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
    );
    return new JwtSecurityTokenHandler().WriteToken(jwt);
}

// ── Helper: seed materiali default per un utente ──────────────────────────────
void SeedMaterialiDefault(AppDbContext db, int utenteId)
{
    var defaults = new[]
    {
        new MaterialeUtente { UtenteId = utenteId, Tipo = "legna",       Categoria = "materiale", Quantita = 100 },
        new MaterialeUtente { UtenteId = utenteId, Tipo = "quarzo",      Categoria = "gemma",     Quantita = 100 },
        new MaterialeUtente { UtenteId = utenteId, Tipo = "resina",      Categoria = "reagente",  Quantita = 100 },
        new MaterialeUtente { UtenteId = utenteId, Tipo = "farina_ossa", Categoria = "reagente",  Quantita = 100 },
        new MaterialeUtente { UtenteId = utenteId, Tipo = "onice_nero",  Categoria = "gemma",     Quantita = 100 },
    };
    db.MaterialiUtente.AddRange(defaults);
}

// ── Helper: seed 6 pezzi classici per un utente ───────────────────────────────
void SeedPezziClassici(AppDbContext db, int utenteId)
{
    var classici = new[]
    {
        new PezzoUtente { UtenteId=utenteId, Nome="Cavaliere", Icona="⚔",  Hp=14, HpMax=14, Atk=4, Def=3, Mov=2, Razza="Umanoide", Materiale="Legno", RicettaId="cavaliere" },
        new PezzoUtente { UtenteId=utenteId, Nome="Ranger",    Icona="🏹", Hp=8,  HpMax=8,  Atk=6, Def=1, Mov=3, Razza="Umanoide", Materiale="Legno", RicettaId="ranger"    },
        new PezzoUtente { UtenteId=utenteId, Nome="Scudiero",  Icona="🛡", Hp=18, HpMax=18, Atk=2, Def=5, Mov=1, Razza="Umanoide", Materiale="Legno", RicettaId="scudiero"  },
        new PezzoUtente { UtenteId=utenteId, Nome="Assassino", Icona="🗡", Hp=9,  HpMax=9,  Atk=3, Def=2, Mov=4, Razza="Umanoide", Materiale="Legno", RicettaId="assassino" },
        new PezzoUtente { UtenteId=utenteId, Nome="Mago",      Icona="✨", Hp=7,  HpMax=7,  Atk=7, Def=1, Mov=2, Razza="Umanoide", Materiale="Legno", RicettaId="mago"      },
        new PezzoUtente { UtenteId=utenteId, Nome="Campione",  Icona="🏆", Hp=15, HpMax=15, Atk=5, Def=4, Mov=2, Razza="Umanoide", Materiale="Legno", RicettaId="campione"  },
    };
    db.PezziUtente.AddRange(classici);
}

// ── Modelli ───────────────────────────────────────────────────────────────────
class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Utente>          Utenti          => Set<Utente>();
    public DbSet<PezzoUtente>     PezziUtente     => Set<PezzoUtente>();
    public DbSet<Formazione>      Formazioni      => Set<Formazione>();
    public DbSet<MaterialeUtente> MaterialiUtente => Set<MaterialeUtente>();
}

class Utente
{
    public int     Id       { get; set; }
    public string  Nome     { get; set; } = "";
    public string  Cognome  { get; set; } = "";
    public string  Email    { get; set; } = "";
    public string  Password { get; set; } = "";
    public string  Ruolo    { get; set; } = "user";
    public bool    Music    { get; set; } = true;
    public bool    Audio    { get; set; } = true;
    public string? Avatar   { get; set; } = null;
    public string  Language { get; set; } = "ita";
    public int     Monete   { get; set; } = 0;
}

class PezzoUtente
{
    public int     Id         { get; set; }
    public int     UtenteId   { get; set; }
    public string  Nome       { get; set; } = "";       // tipo (Cavaliere, Ranger…)
    public string  Icona      { get; set; } = "⚔";
    public int     Hp         { get; set; }
    public int     HpMax      { get; set; }
    public int     Atk        { get; set; }
    public int     Def        { get; set; }
    public int     Mov        { get; set; }
    public bool    IsClassico { get; set; } = true;
    public string? Materiali  { get; set; }             // natura (Guerriero, Arciere…)
    public string  Razza      { get; set; } = "Umanoide";
    public string  Materiale  { get; set; } = "Legno";
    public string? NomeCustom { get; set; }             // null = usa Nome
    public string? RicettaId  { get; set; }             // null per classici
}

class Formazione
{
    public int    Id       { get; set; }
    public int    UtenteId { get; set; }
    public string Data     { get; set; } = "[]"; // JSON: [{id,row,col,isRe}]
}

class MaterialeUtente
{
    public int    Id        { get; set; }
    public int    UtenteId  { get; set; }
    public string Tipo      { get; set; } = "";
    public string Categoria { get; set; } = "materiale"; // "materiale" | "gemma" | "reagente"
    public int    Quantita  { get; set; }
}

record LoginRequest(string Email, string Password);
record RegistrazioneRequest(string Nome, string Cognome, string Email, string Password);
record FormazioneRequest(string Data);
record PreferenzeRequest(bool? Music, bool? Audio, string? Avatar, string? Language, int? Monete);
record VendiRequest(string Tipo, int Quantita);
record CraftaRequest(
    string  Nome,
    string  Icona,
    int     Hp, int HpMax,
    int     Atk, int Def, int Mov,
    string? Materiali  = null,
    string? NomeCustom = null,
    string  Razza      = "Umanoide",
    string  Materiale  = "Legno",
    string? RicettaId  = null
);
