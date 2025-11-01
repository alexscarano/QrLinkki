namespace QrLinkki.Api.Extensions
{
    public static class AppExtensions
    {
        public static WebApplication HttpExtensions(this WebApplication app)
        {
            app.UseHttpsRedirection();
            //app.UseAuthentication();
            //app.UseAuthorization();
            //app.MapControllers();
            return app;
        }
    }
}
