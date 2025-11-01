using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.DTOS.Mappers;

public static class LinkMapper
{
    public static LinkDto ToDto(this Link link)
    {
        return new LinkDto
        {
            original_url = link.OriginalUrl,
            shortened_code = link.ShortenedCode,
            qr_code_path = link.QrCodePath,
            created_at = link.CreatedAt,
            expires_at = link.ExpiresAt,
            clicks = link.Clicks.Select(c => c.ToDto()).ToList()
        };
    }

    public static Link ToEntity(this LinkDto linkDto)
    {
        return new Link
        {
            OriginalUrl = linkDto.original_url,
            ShortenedCode = linkDto.shortened_code,
            QrCodePath = linkDto.qr_code_path,
            CreatedAt = linkDto.created_at,
            ExpiresAt = linkDto.expires_at,
        };
    }
}
