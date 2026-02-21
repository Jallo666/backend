var app = WebApplication.CreateBuilder(args).Build();

app.MapGet("/", () => "Ciao mondo!");

app.Run();