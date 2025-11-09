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
            qr_base64 = link.QrCodePath,
            complete_shortened_url = link.CompleteShortenedUrl,
            click = link.Clicks,
            created_at = link.CreatedAt,
            expires_at = link.ExpiresAt,
            user_id = link.UserId
        };
    }

    public static LinkDto ToDtoMinimal(this Link link)
    {
        return new LinkDto
        {
            original_url = link.OriginalUrl,
            shortened_code = link.ShortenedCode,
            qr_base64 = string.Empty,
            click = 0,
            complete_shortened_url = link.CompleteShortenedUrl,
            created_at = link.CreatedAt,
            expires_at = link.ExpiresAt,
        };
    }

    public static Link ToEntity(this LinkDto linkDto)
    {
        return new Link
        {
            OriginalUrl = linkDto.original_url,
            ShortenedCode = linkDto.shortened_code,
            QrCodePath = linkDto.qr_base64 ?? string.Empty,
            CompleteShortenedUrl = linkDto.complete_shortened_url,
            CreatedAt = linkDto.created_at,
            ExpiresAt = linkDto.expires_at,
            UserId = linkDto.user_id
        };
    }
}
