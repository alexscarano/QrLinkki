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
            var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
            var sqliteConnection = builder.Configuration.GetConnectionString("SqlLiteConnection");

            if (!string.IsNullOrWhiteSpace(defaultConnection))
            {
                Console.WriteLine($"[Database] Using SQL Server (DefaultConnection).");
                builder.Services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlServer(defaultConnection)
                );
            }
            else if (!string.IsNullOrWhiteSpace(sqliteConnection))
            {
                Console.WriteLine($"[Database] Using SQLite (SqlLiteConnection).");
                builder.Services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlite(sqliteConnection)
                );
            }
            else
            {
                throw new InvalidOperationException("No valid database connection string found. Please configure 'DefaultConnection' (SQL Server) or 'SqlLiteConnection' (SQLite).");
            }

            return builder;
        }

        public static WebApplicationBuilder AddServices(this WebApplicationBuilder builder)
        {
            builder.Services.AddHttpContextAccessor();
            
            // Configura CORS baseado no ambiente
            builder.Services.AddCors(options =>
            {
                var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
                
                if (builder.Environment.IsProduction())
                {
                    // Em produção, requer configuração explícita de origens
                    if (origins == null || origins.Length == 0)
                    {
                        throw new InvalidOperationException("Configuration 'Cors:AllowedOrigins' must be provided in production. No default origins are allowed for security.");
                    }
                    
                    options.AddPolicy("AllowDev", policy =>
                    {
                        policy.WithOrigins(origins)
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    });
                }
                else
                {
                    // Em desenvolvimento, permite localhost por padrão se não configurado
                    if (origins == null || origins.Length == 0)
                    {
                        throw new InvalidOperationException("Configuration 'Cors:AllowedOrigins' must be provided. No default origins are allowed.");
                    }
                    
                    options.AddPolicy("AllowDev", policy =>
                    {
                        policy.WithOrigins(origins)
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    });
                }
            });

            builder.Services.AddScoped<IQrCodeService, QrCodeService>(provider =>
            {
                var env = provider.GetRequiredService<IWebHostEnvironment>();

                // se wwwroot não existir, cria automaticamente
                var storageRelative = builder.Configuration["Storage:Path"];
                if (string.IsNullOrWhiteSpace(storageRelative))
                {
                    throw new InvalidOperationException("Configuration 'Storage:Path' must be provided. No default storage path is allowed.");
                }
                var storagePath = Path.Combine(env.ContentRootPath, storageRelative);
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

                string baseUrl;
                if (request is not null)
                {
                    baseUrl = $"{request.Scheme}://{request.Host}";
                }
                else
                {
                    var configuredBase = builder.Configuration["App:BaseUrl"];
                    if (string.IsNullOrWhiteSpace(configuredBase))
                    {
                        throw new InvalidOperationException("Configuration 'App:BaseUrl' must be provided when generating links outside of HTTP requests. No default base URL is allowed.");
                    }

                    baseUrl = configuredBase;
                }

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
            // Registra o API explorer e gerador do Swagger
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

                // Tenta incluir comentários XML (se gerados) para enriquecer a documentação dos endpoints
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
                    // Ignora falhas ao carregar comentários XML; não é crítico
                    return;
                }

                // Tageia ações por nome do controller quando disponível, caso contrário pelo primeiro segmento da rota.
                options.TagActionsBy(api =>
                {
                    // Prefere o valor de rota do controller (para controllers)
                    var controller = api.ActionDescriptor?.RouteValues != null &&
                                     api.ActionDescriptor.RouteValues.TryGetValue("controller", out var c)
                                     ? c
                                     : null;

                    if (!string.IsNullOrEmpty(controller))
                    {
                        // Normaliza nomes comuns para tags amigáveis
                        if (controller.Equals("Link", StringComparison.OrdinalIgnoreCase) ||
                            controller.Equals("Links", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Links" };

                        if (controller.Equals("User", StringComparison.OrdinalIgnoreCase) ||
                            controller.Equals("Users", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Users" };

                        return new[] { controller };
                    }

                    // Fallback: usa primeiro segmento do caminho relativo (para minimal APIs)
                    var relativePath = api.RelativePath ?? string.Empty;
                    var firstSegment = relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();

                    if (!string.IsNullOrEmpty(firstSegment))
                    {
                        if (firstSegment.Equals("links", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Links" };
                        if (firstSegment.Equals("users", StringComparison.OrdinalIgnoreCase))
                            return new[] { "Users" };

                        // Capitaliza para exibição
                        return new[] { char.ToUpperInvariant(firstSegment[0]) + firstSegment.Substring(1) };
                    }

                    return new[] { "Default" };
                });

                // Fornece IDs de operação mais claros para clientes gerados
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
            // Lê secret da configuração e aceita Base64 ou texto simples
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

            // Requer comprimento de chave > 256 bits (32 bytes)
            if (keyBytes.Length * 8 <= 256)
                throw new InvalidOperationException($"JWT secret too short: {keyBytes.Length * 8} bits. Must be greater than 256 bits.");

            var signingKey = new SymmetricSecurityKey(keyBytes);

            builder.Services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(x =>
            {
                // Em produção, requer HTTPS para validação de metadados
                x.RequireHttpsMetadata = builder.Environment.IsProduction();
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

            // Registra serviços de autorização também e adiciona política 'Authenticated'
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("Authenticated", p => p.RequireAuthenticatedUser());
            });

            return builder;
        }
    }
}
