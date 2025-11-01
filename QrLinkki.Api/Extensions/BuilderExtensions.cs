using Microsoft.EntityFrameworkCore;

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
            builder.Services.AddScoped<ILinkService, LinkService>();
            builder.Services.AddScoped<IUserService, UserService>();    

            return builder;
        }
    }
}
