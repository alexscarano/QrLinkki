using QrLinkki.Domain.Entities;

namespace QrLinkki.Domain.Interfaces;

public interface ILinkRepository
{
    public Task<Link?> GetLink(int link_id); 

    public Task<IEnumerable<Link>?> GetLinks(int user_id);

    public Task<bool> CreateLink(Link link);

    public Task<Link?> UpdateLink(Link link);

    public Task<bool> DeleteLink(int link_id);

}

