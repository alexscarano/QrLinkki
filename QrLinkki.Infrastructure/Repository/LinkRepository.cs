using Microsoft.EntityFrameworkCore;
using QrLinkki.Domain.Entities;
using QrLinkki.Domain.Interfaces;
using QrLinkki.Infrastructure.Persistence.Data;

namespace QrLinkki.Infrastructure.Repository;

public class LinkRepository : ILinkRespository
{
    private readonly AppDbContext _appDbContext;

    public LinkRepository(AppDbContext appDbContext)
    {
        _appDbContext  = appDbContext; 
    }

    public async Task<Link?> GetLink(int link_id)
    {
        return await _appDbContext.Links
                     .FirstOrDefaultAsync(x => x.LinkId == link_id);
    }
    public async Task<IEnumerable<Link>?> GetLinks(int user_id)
    {
        return await _appDbContext.Links
                    .Where(x => x.UserId == user_id)
                    .ToListAsync();
    }

    public async Task<bool> CreateLink(Link link)
    {
        try
        {
            if (link is null)
                return false;

            await _appDbContext.Links.AddAsync(link);
            await _appDbContext.SaveChangesAsync();

            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteLink(int link_id)
    {
        try
        {
            var link = await GetLink(link_id);

            if (link is null)
                return false;

            _appDbContext.Links.Remove(link);
            await _appDbContext.SaveChangesAsync();

            return true;
        }
        catch 
        {
            return false;
        }

    }

    public async Task<Link?> UpdateLink(Link link)
    {
        try
        {
            var linkDb = await GetLink(link.LinkId);

            if (linkDb is null)
                return null;

            if (linkDb.OriginalUrl is not null)
                link.OriginalUrl = linkDb.OriginalUrl;
            if (linkDb.ShortenedCode is not null)
                link.ShortenedCode = linkDb.ShortenedCode;
            if (linkDb.QrCodePath is not null)
                link.QrCodePath = linkDb.QrCodePath;

            _appDbContext.Links.Update(link);
            await _appDbContext.SaveChangesAsync();

            return link;
        }
        catch 
        {
            throw new ArgumentException(nameof(link));
        }
    }
}
