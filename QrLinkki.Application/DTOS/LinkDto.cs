namespace QrLinkki.Application.DTOS;

public record LinkDto
{
    public string original_url { get; init; } = string.Empty;
    public string shortened_code { get; init; } = string.Empty;
    public string  qr_code_path { get; init; } = string.Empty;
    public DateTime created_at { get; init; }
    public DateTime? expires_at { get; init; }

    public IEnumerable<ClickDto>? clicks { get; init; }
}
