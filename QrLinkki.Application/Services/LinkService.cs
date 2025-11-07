using QrLinkki.Application.Interfaces;
using QrLinkki.Domain.Entities;
using QrLinkki.Application.Helpers;
using QrLinkki.Domain.Interfaces;

namespace QrLinkki.Application.Services
{
    public class LinkService : ILinkService
    {
        private readonly ILinkRepository _linkRepository;
        private readonly string _baseUrl = "https://localhost:5001";

        public LinkService(ILinkRepository linkRepository)
        {
            _linkRepository = linkRepository;
        }

        public async Task<bool> DeleteLink(string link_id)
        => await _linkRepository.DeleteLink(link_id);

        public async Task<Link?> GetLink(string code)
        => await _linkRepository.GetLink(code);

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

            link.CompleteShortenedUrl = $"{_baseUrl}/{randomCode}";

            // por enquanto 
            link.QrCodePath = $"qrcodes/{randomCode}.png";

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
