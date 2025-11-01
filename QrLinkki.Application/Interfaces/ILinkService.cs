using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.Interfaces;

public interface ILinkService
{
    public Task<Link?> GetLink(int link_id);
    public Task<IEnumerable<Link>?> GetLinksOfUserLogged(int user_id);
    public Task<Link> ShortenNewLink(Link link);
    public Task<Link?> UpdateLink(Link link);
    public Task<bool> DeleteLink(int link_id);

}
