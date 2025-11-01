namespace QrLinkki.Application.Helpers;
public static class CodeGenerator
{
    public static string GenerateShortCode(int length = 6)
    {
        return Guid.NewGuid().ToString().Substring(0, length);
    }
}
