namespace QrLinkki.Api.Endpoints;

public static class LinkEndpoints
{
    public static WebApplication MapLinksEndpoints(this WebApplication app)
    {
        app.MapGet("/r/{code}", async (ILinkService service, string code) =>
        {
            var link = await service.GetLink(code);

            if (link is null)
            {
                return Results.NotFound();
            }

            // Return an HTTP redirect to the original URL
            return Results.Redirect(link.OriginalUrl);
        })
        .RequireAuthorization("Authenticated");
        

        app.MapGet("/api/links", async (ILinkService service) =>
        {
            var links = await service.GetLinksOfUserLogged(1); 

            if (links is null)
            {
                return Results.NotFound();
            }
            
            return Results.Ok(links.Select(l => l.ToDto()));
        })
        .RequireAuthorization("Authenticated");

        app.MapGet("/api/links/{code}", async (ILinkService service, string code) =>
        {
            var link = await service.GetLink(code);

            if (link is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(link.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapPost("/api/links", async (ILinkService service, LinkDto linkDto) =>
        {
            var link = linkDto.ToEntity();

            var createdLink = await service.ShortenNewLink(link);

            return Results.Created($"/api/links/{createdLink.LinkId}", createdLink.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapPut("/api/links/{code}", async (ILinkService service, string code, LinkDto linkDto) =>
        {
            var link = linkDto.ToEntity();

            var updatedLink = await service.UpdateLink(link, code);
            if (updatedLink is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(updatedLink.ToDto());
        })
        .RequireAuthorization("Authenticated");

        app.MapDelete("/api/links/{code}", async (ILinkService service, string code) =>
        {
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
