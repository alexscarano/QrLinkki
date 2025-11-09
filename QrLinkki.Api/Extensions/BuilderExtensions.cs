using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using QrLinkki.Domain.Interfaces;
using QrLinkki.Infrastructure.Repository;
using System;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Threading.Tasks;

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
            builder.Services.AddHttpContextAccessor();

            builder.Services.AddScoped<IQrCodeService, QrCodeService>(provider =>
            {
                var env = provider.GetRequiredService<IWebHostEnvironment>();

                // se wwwroot não existir, cria automaticamente
                var storagePath = Path.Combine(env.ContentRootPath, "Storage");
                if (!Directory.Exists(storagePath))
                {
                    Directory.CreateDirectory(storagePath);
                }

                return new QrCodeService(storagePath);
            });

            builder.Services.AddScoped<ILinkService, LinkService>(provider => 
            {
                var linkRepository = provider.GetRequiredService<ILinkRepository>();
                var QrCodeService = provider.GetRequiredService<IQrCodeService>();
                var httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

                var request = httpContextAccessor.HttpContext?.Request;

                var baseUrl = request is not null
                    ? $"{request.Scheme}://{request.Host}"
                    : "https://localhost:5001";

                return new LinkService(linkRepository, QrCodeService, baseUrl);
            });

            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<ILinkRepository, LinkRepository>();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            
            return builder;
        }

        public static WebApplicationBuilder AddSwagger(this WebApplicationBuilder builder)
        {
            // Register the API explorer and Swagger generator
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                                },
                                Scheme = "oauth2",
                                Name = "Bearer",
                                In = ParameterLocation.Header
                        },
                    new List<string>()
                    }
                });

                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "QrLinkki API",
                    Version = "v1",
                    Description = "API para o APP móvel QrLinkki",
                    Contact = new OpenApiContact
                    {
                        Name = "QrLinkki",
                    }
                });

                // Attempt to include XML comments (if generated) to enrich endpoint documentation
                try
                {
                    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                    if (File.Exists(xmlPath))
                    {
                        options.IncludeXmlComments(xmlPath);
                    }
                }
                catch
                {
                    // Ignore XML comments loading failures; not critical
                    return;
                }

                // Tag actions by controller name when available, otherwise by first route segment.
                options.TagActionsBy(api =>
                {
                    // Prefer controller route value (for controllers)
                    var controller = api.ActionDescriptor?.RouteValues != null &&
                                     api.ActionDescriptor.RouteValues.TryGetValue("controller", out var c)
                                     ? c
                                     : null;

                    if (!string.IsNullOrEmpty(controller))
                    {
                        // Normalize common names to friendly tags
                        if (controller.Equals("Link", StringComparison.OrdinalIgnoreCase) ||
                            controller.Equals("Links", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Links" };

                        if (controller.Equals("User", StringComparison.OrdinalIgnoreCase) ||
                            controller.Equals("Users", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Users" };

                        return new[] { controller };
                    }

                    // Fallback: use first segment of the relative path (for minimal APIs)
                    var relativePath = api.RelativePath ?? string.Empty;
                    var firstSegment = relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

                    if (!string.IsNullOrEmpty(firstSegment))
                    {
                        if (firstSegment.Equals("links", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Links" };
                        if (firstSegment.Equals("users", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Users" };

                        // Capitalize for display
                        return new[] { char.ToUpperInvariant(firstSegment[0]) + firstSegment.Substring(1) };
                    }

                    return new[] { "Default" };
                });

                // Provide clearer operation ids for generated clients
                options.CustomOperationIds(api =>
                {
                    var method = api.HttpMethod ?? "unknown";
                    var route = api.RelativePath?.Replace("/", "_").Replace("{", "").Replace("}", "") ?? "route";
                    return $"{method}_{route}";
                });

            });

            return builder;
        }
    
        public static WebApplicationBuilder AddAuthentication(this WebApplicationBuilder builder)
        {
            // Read secret from configuration and accept Base64 or plain text
            var secretConfig = builder.Configuration["Jwt:authQrLinkki"];
            if (string.IsNullOrWhiteSpace(secretConfig))
                throw new InvalidOperationException("JWT secret not configured at 'Jwt:authQrLinkki'.");

            byte[] keyBytes;
            try
            {
                keyBytes = Convert.FromBase64String(secretConfig);
            }
            catch (FormatException)
            {
                keyBytes = Encoding.UTF8.GetBytes(secretConfig);
            }

            // Require key length > 256 bits (32 bytes)
            if (keyBytes.Length * 8 <= 256)
                throw new InvalidOperationException($"JWT secret too short: {keyBytes.Length * 8} bits. Must be greater than 256 bits.");

            var signingKey = new SymmetricSecurityKey(keyBytes);

            builder.Services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(x =>
            {
                x.RequireHttpsMetadata = false;
                x.SaveToken = true;
                x.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                };

                x.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = ctx =>
                    {
                        Console.Error.WriteLine("Jwt OnAuthenticationFailed: " + ctx.Exception?.ToString());
                        return Task.CompletedTask;
                    },
                    OnChallenge = ctx =>
                    {
                        Console.Error.WriteLine("Jwt OnChallenge: " + ctx.Error + " - " + ctx.ErrorDescription);
                        return Task.CompletedTask;
                    }
                };
            });

            // Register authorization services as well and add 'Authenticated' policy
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("Authenticated", p => p.RequireAuthenticatedUser());
            });

            return builder;
        }
    }
}
