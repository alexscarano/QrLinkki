namespace QrLinkki.Api.Endpoints;

public static class LinkEndpoints
{
    public static WebApplication MapLinksEndpoints(this WebApplication app)
    {
        app.MapGet("/api/links", () =>
        {
        });
            


        return app;
    }   
}
