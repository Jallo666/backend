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

var app = builder.Build();

app.UseCors();

var utenti = new List<Utente>
{
    new(1, "Mario", "Rossi", "mario.rossi@email.com"),
    new(2, "Giulia", "Bianchi", "giulia.bianchi@email.com"),
    new(3, "Luca", "Verdi", "luca.verdi@email.com"),
};

var credenziali = new List<Account>
{
    new("mario.rossi@email.com", "password123"),
    new("giulia.bianchi@email.com", "password123"),
};

app.MapGet("/utenti", () => utenti);

app.MapPost("/login", (LoginRequest req) =>
{
    var account = credenziali.FirstOrDefault(a => a.Email == req.Email && a.Password == req.Password);
    if (account is null)
        return Results.Unauthorized();

    var utente = utenti.FirstOrDefault(u => u.Email == req.Email);
    return Results.Ok(utente);
});

app.Run();

record Utente(int Id, string Nome, string Cognome, string Email);
record Account(string Email, string Password);
record LoginRequest(string Email, string Password);