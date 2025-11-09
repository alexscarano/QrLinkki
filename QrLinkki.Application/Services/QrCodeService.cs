using QRCoder;
using QrLinkki.Application.Interfaces;

namespace QrLinkki.Application.Services;

public class QrCodeService : IQrCodeService
{
    private readonly string _rootPath;

    public QrCodeService(string rootPath)
    {
        _rootPath = rootPath;   
    }

    public string GenerateQrCode(string data, string shortenedCode)
    {
        try
        {
            using var qrGenerator = new QRCoder.QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(data, QRCoder.QRCodeGenerator.ECCLevel.Q);

            if (qrData is null)
            {
                throw new InvalidOperationException("Failed to generate QR code data.");
            }

            using var qrCode = new PngByteQRCode(qrData);
            byte[] qrCodeImage = qrCode.GetGraphic(20);

            string folderPath = Path.Combine(_rootPath, "qrcodes");

            if (Directory.Exists(folderPath) is false)
            {
                Directory.CreateDirectory(folderPath);
            }
            string filePath = Path.Combine(folderPath, $"{shortenedCode}.png");

            // Agora sim: salva o arquivo
            File.WriteAllBytes(filePath, qrCodeImage);

            return filePath; ;
        }
        catch(IOException)
        {
            throw new IOException("Failed to save the QR code image to the specified path.");
        }
        catch(Exception)
        {
            throw new Exception("An error occurred while generating the QR code.");
        }
    }
}
