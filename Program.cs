using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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
        // Render fornisce l'URL nel formato postgres://user:pass@host:port/db
        // Npgsql vuole il formato ADO.NET, quindi convertiamo
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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/utenti", async (AppDbContext db) =>
    await db.Utenti.Select(u => new { u.Id, u.Nome, u.Cognome, u.Email }).ToListAsync())
    .RequireAuthorization();

app.MapPost("/login", async (LoginRequest req, AppDbContext db) =>
{
    var utente = await db.Utenti.FirstOrDefaultAsync(u => u.Email == req.Email);
    if (utente is null || !BCrypt.Net.BCrypt.Verify(req.Password, utente.Password))
        return Results.Unauthorized();

    var token = GeneraToken(utente, key);
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, token });
});

app.MapPost("/registrati", async (RegistrazioneRequest req, AppDbContext db) =>
{
    if (await db.Utenti.AnyAsync(u => u.Email == req.Email))
        return Results.Conflict("Email già in uso");

    var utente = new Utente
    {
        Nome = req.Nome,
        Cognome = req.Cognome,
        Email = req.Email,
        Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
    };
    db.Utenti.Add(utente);
    await db.SaveChangesAsync();

    var token = GeneraToken(utente, key);
    return Results.Ok(new { utente.Id, utente.Nome, utente.Cognome, utente.Email, token });
});

app.Run();

string GeneraToken(Utente utente, SymmetricSecurityKey key)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, utente.Id.ToString()),
        new Claim(ClaimTypes.Email, utente.Email)
    };
    var jwt = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
    );
    return new JwtSecurityTokenHandler().WriteToken(jwt);
}

class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Utente> Utenti => Set<Utente>();
}

class Utente
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string Cognome { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

record LoginRequest(string Email, string Password);
record RegistrazioneRequest(string Nome, string Cognome, string Email, string Password);
