using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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
        options.UseSqlite("Data Source=locale.db");
    else
        options.UseNpgsql(connStr);
});

var app = builder.Build();

app.UseCors();

// Crea le tabelle automaticamente all'avvio
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/utenti", async (AppDbContext db) =>
    await db.Utenti.ToListAsync());

app.MapPost("/login", async (LoginRequest req, AppDbContext db) =>
{
    var utente = await db.Utenti.FirstOrDefaultAsync(u => u.Email == req.Email && u.Password == req.Password);
    if (utente is null)
        return Results.Unauthorized();
    return Results.Ok(utente);
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
        Password = req.Password,
    };
    db.Utenti.Add(utente);
    await db.SaveChangesAsync();
    return Results.Ok(utente);
});

app.Run();

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
