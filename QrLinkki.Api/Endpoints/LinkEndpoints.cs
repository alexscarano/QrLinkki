using System.Security.Claims;

namespace QrLinkki.Api.Endpoints;

public static class LinkEndpoints
{
    public static WebApplication MapLinksEndpoints(this WebApplication app)
    {
        // Endpoint público de redirecionamento para códigos encurtados. Deve ser acessível sem autenticação.
        app.MapGet("/r/{code}", async (ILinkService service, string code) =>
        {
            var link = await service.GetLink(code);
            
            if (link is null)
            {
                return Results.NotFound();
            }

            // Retorna um redirect HTTP para a URL original
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
            // Garante que o chamador está autenticado e é o proprietário do link
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
                // Não permite que usuários busquem links que não possuem
                return Results.Forbid();
            }

            return Results.Ok(link);
        })
        .RequireAuthorization("Authenticated");

        app.MapPost("/api/links", async (ILinkService service, LinkDto linkDto, HttpContext http) =>
        {
            // Mapeia DTO para entidade
            var link = linkDto.ToEntity();

            // Extrai user id do claim JWT (usamos ClaimTypes.Name para armazenar o user id)
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
            // Garante que o chamador está autenticado e é o proprietário do link antes de atualizar
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
            link.UserId = userId; // força propriedade

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
            // Garante que o chamador está autenticado e é o proprietário
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
