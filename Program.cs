var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
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

app.MapGet("/utenti", () => utenti);

app.Run();

record Utente(int Id, string Nome, string Cognome, string Email);