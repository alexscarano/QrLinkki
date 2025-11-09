namespace QrLinkki.Application.Interfaces
{
    public interface IQrCodeService
    {
        public string GenerateQrCode(string data, string shortenedCode);
    }
}
