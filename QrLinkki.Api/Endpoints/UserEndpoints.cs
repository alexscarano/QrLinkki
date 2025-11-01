using QrLinkki.Domain.Entities;

namespace QrLinkki.Api.Endpoints;

public static class UserEndpoints
{
    public static WebApplication MapUserEndpoints(this WebApplication app)
    {
        app.MapGet("/api/users/{user_id}", async (IUserService service, int user_id) =>
        {
            var user = await service.GetUser(user_id);
            if (user is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(user.ToDto());
        });

        app.MapGet("/api/users", async (IUserService service) =>
        {
            var users = await service.GetUsers();

            if (users is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(users.Select(u => u.ToDto()));
        });

        app.MapPost("/api/users", async (IUserService service, User user) =>
        {
            var created = await service.CreateUser(user);
         
            if (!created)
            {
                return Results.BadRequest("Failed to create user.");
            }
            return Results.Created($"/api/users/{user.UserId}", user.ToDto());

        });

        app.MapPut("/api/users/{user_id}", async(IUserService service, int user_id, User user) =>
        {
            user.UserId = user_id;

            var updatedUser = await service.UpdateUser(user);

            if (updatedUser is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(updatedUser.ToDto());
        });

        app.MapDelete("api/users/{user_id}", async (IUserService service, int user_id) =>
        {
            var deleted = await service.DeleteUser(user_id);

            if (!deleted)
            {
                return Results.NotFound();
            }

            return Results.NoContent();
        });

        return app;
    }
}
