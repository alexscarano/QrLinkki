using QrLinkki.Application.DTOS;
using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.Interfaces;

public interface ILinkService
{
    public Task<LinkDto?> GetLink(string code);
    public Task<LinkDto?> GetLinkWithQrBase64(string code);
    public Task<IEnumerable<Link>?> GetLinksOfUserLogged(int user_id);
    public Task<Link> ShortenNewLink(Link link);
    public Task<Link?> UpdateLink(Link link, string? code);
    public Task<bool> DeleteLink(string code);

}
