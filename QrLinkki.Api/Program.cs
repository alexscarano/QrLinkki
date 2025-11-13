var builder = WebApplication.CreateBuilder(args);

// Ensure the web host listens on a reachable interface during development.
// Prefer an explicit ASPNETCORE_URLS environment variable if present, otherwise
// fall back to listening on all interfaces (0.0.0.0) so other devices on the
// LAN can reach the API when testing from Expo Go / a phone.
var urlsEnv = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
if (!string.IsNullOrEmpty(urlsEnv))
{
    builder.WebHost.UseUrls(urlsEnv);
}
else if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:5000");
}

builder.AddDbContext();
builder.AddServices();
builder.AddSwagger();
builder.AddAuthentication();

var app = builder.Build();

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

