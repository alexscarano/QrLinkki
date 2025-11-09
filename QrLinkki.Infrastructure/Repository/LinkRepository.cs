using Microsoft.EntityFrameworkCore;
using QrLinkki.Domain.Entities;
using QrLinkki.Domain.Interfaces;
using QrLinkki.Infrastructure.Persistence.Data;

namespace QrLinkki.Infrastructure.Repository;

public class LinkRepository : ILinkRepository
{
    private readonly AppDbContext _appDbContext;

    public LinkRepository(AppDbContext appDbContext)
    {
        _appDbContext  = appDbContext; 
    }

    public async Task<Link?> GetLink(string? code)
    {
        var parsedId = int.TryParse(code, out int id) ? id : -1;

        var link = await _appDbContext.Links
                     .FirstOrDefaultAsync(x => x.LinkId == parsedId
                     || x.ShortenedCode == code);

        if (link is null) 
        {
            return null;
        }

        link.RegisterClick();
        _appDbContext.Links.Update(link);
        await _appDbContext.SaveChangesAsync();

        return link;
    }

    public async Task<Link?> GetLinkWithoutIncrement(string code)
    {
        var parsedId = int.TryParse(code, out int id) ? id : -1;

        return await _appDbContext.Links
                 .FirstOrDefaultAsync(x => x.LinkId == parsedId
                 || x.ShortenedCode == code);
    }

    public async Task<IEnumerable<Link>?> GetLinks(int user_id)
    {
        return await _appDbContext.Links
                    .Where(x => x.UserId == user_id)
                    .ToListAsync();
    }

    public async Task<bool> CreateLink(Link link)
    {
        if (link is null)
            return false;

        try
        {
            if (link.UserId != 0)
            {
                // Valida existência do usuário referenciado para evitar violação de FK
                var user = await _appDbContext.Users.FindAsync(link.UserId);
                if (user is null)
                {
                    return false;
                }

                // Mantém navegação consistente no contexto
                link.User = user;
                // Não é necessário Attach se FindAsync retornou a entidade rastreada
            }

            await _appDbContext.Links.AddAsync(link);
            await _appDbContext.SaveChangesAsync();

            return true;
        }
        catch (DbUpdateException dbEx)
        {
            return false;
        }
        catch (Exception ex)
        {
            return false;
        }
    }

    public async Task<bool> DeleteLink(string link_id)
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

    public async Task<Link?> UpdateLink(Link link, string? code)
    {
        try
        {
            Link? linkDb = null;

            if (link.LinkId == 0)
                linkDb = await GetLink(code);
            else
                linkDb = await _appDbContext.Links.FindAsync(link.LinkId);

            if (linkDb is null)
                return null;

            // Atualiza somente os campos recebidos no DTO/objeto de entrada
            if (!string.IsNullOrWhiteSpace(link.OriginalUrl))
                linkDb.OriginalUrl = link.OriginalUrl;

            if (!string.IsNullOrWhiteSpace(link.ShortenedCode))
                linkDb.ShortenedCode = link.ShortenedCode;

            if (!string.IsNullOrWhiteSpace(link.QrCodePath))
                linkDb.QrCodePath = link.QrCodePath;

            // Se o caller pretende alterar o usuário referenciado, valide existência
            if (link.UserId != 0 && link.UserId != linkDb.UserId)
            {
                var user = await _appDbContext.Users.FindAsync(link.UserId);
                if (user is null)
                {
                    return null;
                }

                linkDb.UserId = link.UserId;
                linkDb.User = user;
            }

            _appDbContext.Links.Update(linkDb);
            await _appDbContext.SaveChangesAsync();

            return linkDb;
        }
        catch (Exception ex)
        {
            throw new ArgumentException(nameof(link));
        }
    }

    public async Task<string> GenerateShortCode(int length = 6)
    {
        bool exists = true;
        string cod = string.Empty;

        while (exists)
        {
            cod = Guid.NewGuid().ToString().Substring(0, length);

            bool existsInDb = await _appDbContext.Links
                    .AnyAsync(x => x.ShortenedCode == cod);

            if (!existsInDb)
                exists = false;

        }

        return cod;
    }

}
