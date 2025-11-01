using QrLinkki.Domain.Interfaces;
using QrLinkki.Infrastructure.Repository;

namespace QrLinkki.Api.Extensions
{
    public static class BuilderExtensions
    {
        public static WebApplicationBuilder AddDbContext(this WebApplicationBuilder builder)
        {
            builder.Services.AddDbContext<AppDbContext>
            (options =>
                options.UseSqlite(
                    builder.Configuration.GetConnectionString("SqlLiteConnection"))
            );


            return builder;
        }

        public static WebApplicationBuilder AddServices(this WebApplicationBuilder builder)
        {
            builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("BaseUrl"));
            builder.Services.AddScoped<ILinkService, LinkService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<ILinkRepository, LinkRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();

            return builder;
        }
    }
}
