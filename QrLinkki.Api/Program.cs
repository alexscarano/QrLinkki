var builder = WebApplication.CreateBuilder(args);

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

