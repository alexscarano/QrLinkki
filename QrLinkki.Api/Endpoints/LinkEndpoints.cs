namespace QrLinkki.Api.Endpoints;

public static class LinkEndpoints
{
    public static WebApplication MapLinksEndpoints(this WebApplication app)
    {
        app.MapGet("/api/links", async (ILinkService service) =>
        {
            var links = await service.GetLinksOfUserLogged(1); 

            if (links is null)
            {
                return Results.NotFound();
            }
            
            return Results.Ok(links.Select(l => l.ToDto()));
        });

        app.MapGet("/api/links/{user_id}", async (ILinkService service) =>
        {
            var link = await service.GetLink(1);

            if (link is null)
            {
                return Results.NotFound();
            }

            return Results.Ok(link.ToDto());
        });

        app.MapPost("/api/links", async (ILinkService service, Link link) =>
        {
            var createdLink = await service.ShortenNewLink(link);

            return Results.Created($"/api/links/{createdLink.LinkId}", createdLink.ToDto());
        });

        app.MapPut("/api/links/{link_id}", async (ILinkService service, int link_id, Link link) =>
        {
            var updatedLink = await service.UpdateLink(link);
            if (updatedLink is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(updatedLink.ToDto());
        });

        app.MapDelete("/api/links/{link_id}", async (ILinkService service, int link_id) =>
        {
            var deleted = await service.DeleteLink(link_id);

            if (!deleted)
            {
                return Results.NotFound();
            }
           
            return Results.NoContent();
        });

        return app;
    }   
}
