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

            return app;
        }
    }
}
