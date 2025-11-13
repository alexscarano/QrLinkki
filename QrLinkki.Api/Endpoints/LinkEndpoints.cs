using System.Security.Claims;

namespace QrLinkki.Api.Endpoints;

public static class LinkEndpoints
{
    public static WebApplication MapLinksEndpoints(this WebApplication app)
    {
        // Public redirect endpoint for shortened codes. This should be accessible without auth.
        app.MapGet("/r/{code}", async (ILinkService service, string code) =>
        {
            var link = await service.GetLink(code);
            
            if (link is null)
            {
                return Results.NotFound();
            }

            // Return an HTTP redirect to the original URL
            return Results.Redirect(link.original_url);
        });
        

        app.MapGet("/api/links", async (ILinkService service, HttpContext http) =>
        {
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var links = await service.GetLinksOfUserLogged(userId); 

            if (links is null)
            {
                return Results.NotFound();
            }
            
            return Results.Ok(links.Select(l => l.ToDto()));
        })
        .RequireAuthorization("Authenticated");

        app.MapGet("/api/links/{code}", async (ILinkService service, string code, HttpContext http) =>
        {
            // Ensure caller is authenticated and is the owner of the link
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var link = await service.GetLinkWithQrBase64(code);

            if (link is null)
            {
                return Results.NotFound();
            }

            if (link.user_id != userId)
            {
                // Don't allow users to fetch links they don't own
                return Results.Forbid();
            }

            return Results.Ok(link);
        })
        .RequireAuthorization("Authenticated");

        app.MapPost("/api/links", async (ILinkService service, LinkDto linkDto, HttpContext http) =>
        {
            // Map DTO to entity
            var link = linkDto.ToEntity();

            // Extract user id from JWT claim (we used ClaimTypes.Name to store user id)
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            link.UserId = userId;

            var createdLink = await service.ShortenNewLink(link);

            return Results.Created($"/api/links/{createdLink.LinkId}", createdLink.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapPut("/api/links/{code}", async (ILinkService service, string code, LinkDto linkDto, HttpContext http) =>
        {
            // Ensure the caller is authenticated and is the owner of the link before updating
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var existing = await service.GetLinkWithQrBase64(code);
            if (existing is null)
            {
                return Results.NotFound();
            }

            if (existing.user_id != userId)
            {
                return Results.Forbid();
            }

            var link = linkDto.ToEntity();
            link.UserId = userId; // enforce ownership

            var updatedLink = await service.UpdateLink(link, code);
            if (updatedLink is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(updatedLink.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapDelete("/api/links/{code}", async (ILinkService service, string code, HttpContext http) =>
        {
            // Ensure caller is authenticated and owner
            var userIdClaim = http.User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var existing = await service.GetLinkWithQrBase64(code);
            if (existing is null)
            {
                return Results.NotFound();
            }

            if (existing.user_id != userId)
            {
                return Results.Forbid();
            }

            var deleted = await service.DeleteLink(code);

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
