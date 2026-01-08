namespace QrLinkki.Api.Extensions
{
    public static class AppExtensions
    {
        public static WebApplication HttpExtensions(this WebApplication app)
        {
            // Habilita CORS (política de desenvolvimento)
            app.UseCors("AllowDev");

            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            return app;
        }
    }
}
