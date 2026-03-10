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
        policy.WithOrigins("http://localhost:5173", "https://frontend-cop1.onrender.com")
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
            p.IsClassico, p.Materiali
        })
        .ToListAsync();
    return Results.Ok(pezzi);
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
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, utente.Ruolo, token });
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

    // Seed pezzi classici al nuovo utente
    SeedPezziClassici(db, utente.Id);
    await db.SaveChangesAsync();

    var token = GeneraToken(utente, key);
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, utente.Ruolo, token });
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

// ── Helper: seed 6 pezzi classici per un utente ───────────────────────────────
void SeedPezziClassici(AppDbContext db, int utenteId)
{
    var classici = new[]
    {
        new PezzoUtente { UtenteId=utenteId, Nome="Guerriero",   Icona="⚔",  Hp=14, HpMax=14, Atk=4, Def=3, Mov=2 },
        new PezzoUtente { UtenteId=utenteId, Nome="Arciere",     Icona="🏹", Hp=8,  HpMax=8,  Atk=6, Def=1, Mov=3 },
        new PezzoUtente { UtenteId=utenteId, Nome="Scudiero",    Icona="🛡", Hp=18, HpMax=18, Atk=2, Def=5, Mov=1 },
        new PezzoUtente { UtenteId=utenteId, Nome="Esploratore", Icona="🔭", Hp=9,  HpMax=9,  Atk=3, Def=2, Mov=4 },
        new PezzoUtente { UtenteId=utenteId, Nome="Mago",        Icona="✨", Hp=7,  HpMax=7,  Atk=7, Def=1, Mov=2 },
        new PezzoUtente { UtenteId=utenteId, Nome="Campione",    Icona="🏆", Hp=15, HpMax=15, Atk=5, Def=4, Mov=2 },
    };
    db.PezziUtente.AddRange(classici);
}

// ── Modelli ───────────────────────────────────────────────────────────────────
class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Utente>      Utenti      => Set<Utente>();
    public DbSet<PezzoUtente> PezziUtente => Set<PezzoUtente>();
    public DbSet<Formazione>  Formazioni  => Set<Formazione>();
}

class Utente
{
    public int    Id       { get; set; }
    public string Nome     { get; set; } = "";
    public string Cognome  { get; set; } = "";
    public string Email    { get; set; } = "";
    public string Password { get; set; } = "";
    public string Ruolo    { get; set; } = "user";
}

class PezzoUtente
{
    public int     Id         { get; set; }
    public int     UtenteId   { get; set; }
    public string  Nome       { get; set; } = "";
    public string  Icona      { get; set; } = "⚔";
    public int     Hp         { get; set; }
    public int     HpMax      { get; set; }
    public int     Atk        { get; set; }
    public int     Def        { get; set; }
    public int     Mov        { get; set; }
    public bool    IsClassico { get; set; } = true;
    public string? Materiali  { get; set; } // JSON per pezzi craftati futuri
}

class Formazione
{
    public int    Id       { get; set; }
    public int    UtenteId { get; set; }
    public string Data     { get; set; } = "[]"; // JSON: [{id,row,col,isRe}]
}

record LoginRequest(string Email, string Password);
record RegistrazioneRequest(string Nome, string Cognome, string Email, string Password);
record FormazioneRequest(string Data);
