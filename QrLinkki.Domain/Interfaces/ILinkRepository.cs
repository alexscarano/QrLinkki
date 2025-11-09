using QrLinkki.Domain.Entities;

namespace QrLinkki.Domain.Interfaces;

public interface ILinkRepository
{
    public Task<Link?> GetLink(string code);

    public Task<Link?> GetLinkWithoutIncrement(string code);

    public Task<IEnumerable<Link>?> GetLinks(int user_id);

    public Task<bool> CreateLink(Link link);

    public Task<Link?> UpdateLink(Link link, string? code);

    public Task<bool> DeleteLink(string link_id);

    public Task<string> GenerateShortCode(int length = 6);
}

