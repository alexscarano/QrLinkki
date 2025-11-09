using QrLinkki.Application.Interfaces;
using QrLinkki.Domain.Entities;
using QrLinkki.Application.Helpers;
using QrLinkki.Domain.Interfaces;
using QrLinkki.Application.DTOS;
using QrLinkki.Application.DTOS.Mappers;

namespace QrLinkki.Application.Services
{
    public class LinkService : ILinkService
    {
        private readonly ILinkRepository _linkRepository;
        private readonly string _baseUrl;
        private readonly IQrCodeService _qrCodeService;

        public LinkService
            (ILinkRepository linkRepository, 
            IQrCodeService qrCodeService,
            string baseUrl)
        {
            _linkRepository = linkRepository;
            _qrCodeService = qrCodeService;
            _baseUrl = baseUrl;
        }

        public async Task<bool> DeleteLink(string link_id)
        => await _linkRepository.DeleteLink(link_id);

        public async Task<LinkDto?> GetLink(string code) 
        {
            var link = await _linkRepository.GetLink(code);

            if (link is null)
                return null;

            return link.ToDtoMinimal();
        }

        public async Task<LinkDto?> GetLinkWithQrBase64(string code)
        {
            var link = await _linkRepository.GetLink(code);

            if (link is null)
            {
                return null;
            }

            string qrbase64 = string.Empty;
            string path = link?.QrCodePath ?? string.Empty;

            if (!string.IsNullOrEmpty(link!.QrCodePath)
                && File.Exists(link.QrCodePath))
            {
                var bytes = await File.ReadAllBytesAsync(path);
                qrbase64 = Convert.ToBase64String(bytes);
                link.QrCodePath = qrbase64;
            }

            return link.ToDto();
        }

        public async Task<IEnumerable<Link>?> GetLinksOfUserLogged(int user_id)
        => await _linkRepository.GetLinks(user_id);


        public async Task<Link> ShortenNewLink(Link link)
        {
            if (link is null || !Validations.IsValidUrl(link.OriginalUrl))
            {
                throw new Exception("Link inválido.");
            }

            var randomCode = _linkRepository.GenerateShortCode().Result;

            link.ShortenedCode = randomCode;

            link.CompleteShortenedUrl = $"{_baseUrl}/r/{randomCode}";

            link.QrCodePath = $"{_qrCodeService.GenerateQrCode($"{_baseUrl}/r/{randomCode}", randomCode)}";

            var created = await _linkRepository.CreateLink(link);

            if (!created)
            {
                throw new Exception("Failed to create the shortened link.");
            }

            return link;
        }   

        public async Task<Link?> UpdateLink(Link link, string? code)
        => await _linkRepository.UpdateLink(link, code);
    }
}
