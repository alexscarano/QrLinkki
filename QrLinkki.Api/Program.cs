var builder = WebApplication.CreateBuilder(args);

builder.AddDbContext();
builder.AddServices();

var app = builder.Build();

app.HttpExtensions();
app.MapLinksEndpoints();
app.MapUserEndpoints();


app.Run();

