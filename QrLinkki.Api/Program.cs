var builder = WebApplication.CreateBuilder(args);

// Configura URLs: suporta tanto Docker (variável de ambiente ASPNETCORE_URLS) quanto execução direta (parâmetro --urls)
// Prioridade:
//   1. Variável de ambiente ASPNETCORE_URLS (usada pelo Docker)
//   2. Parâmetro de linha de comando --urls (parseado por WebApplication.CreateBuilder)
//   3. Fallback padrão: escutar em todas as interfaces na porta 5000
var urlsEnv = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
if (!string.IsNullOrEmpty(urlsEnv))
{
    // Definido explicitamente pela variável de ambiente (cenário Docker)
    builder.WebHost.UseUrls(urlsEnv);
    Console.WriteLine($"[Config] Using ASPNETCORE_URLS: {urlsEnv}");
}
else if (!builder.Configuration.GetValue<string>("urls", null)?.Any() ?? true)
{
    // Sem variável de ambiente e sem parâmetro  --urls fornecido
    // Fallback para escutar em todas as interfaces para suportar testes em LAN
    var defaultUrls = "http://0.0.0.0:5000";
    builder.WebHost.UseUrls(defaultUrls);
    Console.WriteLine($"[Config] Using default URLs: {defaultUrls}");
}
else
{
    // Parâmetro --urls foi fornecido via linha de comando ou configuração
    Console.WriteLine($"[Config] Using command-line URLs parameter");
}

builder.AddDbContext();
builder.AddServices();
builder.AddSwagger();
builder.AddAuthentication();

var app = builder.Build();

// Executa migrations automaticamente na inicialização
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.Migrate();
        Console.WriteLine("[Database] Migrations aplicadas com sucesso.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database] Erro ao aplicar migrations: {ex.Message}");
        // Em desenvolvimento, continua mesmo se falhar (pode ser que já esteja atualizado)
        if (app.Environment.IsProduction())
        {
            throw;
        }
    }
}

app.HttpExtensions();
app.MapLinksEndpoints();
app.MapUserEndpoints();
app.MapAuthEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.Run();

