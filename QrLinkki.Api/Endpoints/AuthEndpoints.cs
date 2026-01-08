using System.Security.Claims;

namespace QrLinkki.Api.Endpoints
{
    public static class AuthEndpoints
    {
        public static WebApplication MapAuthEndpoints(this WebApplication app)
        {
            app.MapPost("/api/auth", async (IAuthService authService, UserDto userDto) =>
            {
                var token = await authService.AuthenticateUser(userDto);

                if (string.IsNullOrEmpty(token))
                    return Results.Unauthorized();

                return Results.Ok(new { token });
            });

            // Retorna o perfil básico do usuário autenticado atual (email, created/updated)
            // Requer autenticação. Útil para clientes validarem tokens e buscarem o usuário atual.
            app.MapGet("/api/auth/me", async (IUserService userService, HttpContext http) =>
            {
                var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
                {
                    return Results.Unauthorized();
                }

                var user = await userService.GetUser(callerId);
                if (user is null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(user.ToDto());
            })
            .RequireAuthorization("Authenticated");

            return app;
        }
    }
}
