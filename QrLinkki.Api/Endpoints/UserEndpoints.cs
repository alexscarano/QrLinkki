using QrLinkki.Domain.Entities;
using QrLinkki.Application.DTOS;
using QrLinkki.Application.DTOS.Mappers;
using System.Security.Claims;

namespace QrLinkki.Api.Endpoints;

public static class UserEndpoints
{
    public static WebApplication MapUserEndpoints(this WebApplication app)
    {
        // Allow owners to fetch their own profile. Require authentication and ownership.
        app.MapGet("/api/users/{user_id}", async (IUserService service, int user_id, HttpContext http) =>
        {
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            {
                return Results.Unauthorized();
            }

            if (callerId != user_id)
            {
                return Results.Forbid();
            }

            var user = await service.GetUser(user_id);
            if (user is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(user.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapGet("/api/users", async (IUserService service) =>
        {
            var users = await service.GetUsers();

            if (users is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(users.Select(u => u.ToDto()));
        })
        .RequireAuthorization("Authenticated");

        app.MapPost("/api/users", async (IUserService service, UserDto userDto) =>
        {
            var user = userDto.ToEntity();

            var created = await service.CreateUser(user);
         
            if (!created)
            {
                return Results.BadRequest("Failed to create user.");
            }
            return Results.Created($"/api/users/{user.UserId}", user.ToDto());

        });

        app.MapPut("/api/users/{user_id}", async(IUserService service, int user_id, UserDto userDto, HttpContext http) =>
        {
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            {
                return Results.Unauthorized();
            }

            if (callerId != user_id)
            {
                return Results.Forbid();
            }

            var user = userDto.ToEntity();
            user.UserId = user_id;

            var updatedUser = await service.UpdateUser(user);

            if (updatedUser is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(updatedUser.ToDto());
        })
        .RequireAuthorization("Authenticated");

        // Only the owner may delete their account
        app.MapDelete("/api/users/{user_id}", async (IUserService service, int user_id, HttpContext http) =>
        {
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var callerId))
            {
                return Results.Unauthorized();
            }

            if (callerId != user_id)
            {
                return Results.Forbid();
            }

            var deleted = await service.DeleteUser(user_id);

            if (!deleted)
            {
                return Results.NotFound();
            }

            return Results.NoContent();
        })
        .RequireAuthorization("Authenticated");

        return app;
    }
}
