using QrLinkki.Application.Interfaces;
using QrLinkki.Infrastructure.Repository;
using QrLinkki.Domain.Entities;
using QrLinkki.Application.Helpers;
using System.Reflection.Metadata.Ecma335;

namespace QrLinkki.Api.Services
{
    public class LinkService : ILinkService
    {
        private readonly LinkRepository _linkRepository;

        public LinkService(LinkRepository linkRepository)
        {
            _linkRepository = linkRepository;
        }

        public async Task<bool> DeleteLink(int link_id)
        => await _linkRepository.DeleteLink(link_id);

        public async Task<Link?> GetLink(int link_id)
        => await _linkRepository.GetLink(link_id);

        public async Task<IEnumerable<Link>?> GetLinksOfUserLogged(int user_id)
        => await _linkRepository.GetLinks(user_id);

        public async Task<Link> ShortenNewLink(Link link)
        {
            if (link is null || !Validations.IsValidUrl(link.OriginalUrl))
            {
                throw new Exception("Link inválido.");
            }

            link.ShortenedCode = CodeGenerator.GenerateShortCode();

            // por enquanto 
            link.QrCodePath = $"qrcodes/{link.ShortenedCode}.png";
            
            var created = await _linkRepository.CreateLink(link);

            if (!created)
            {
                throw new Exception("Failed to create the shortened link.");
            }

            return link;
        }   

        public async Task<Link?> UpdateLink(Link link)
        => await _linkRepository.UpdateLink(link);
    }
}
