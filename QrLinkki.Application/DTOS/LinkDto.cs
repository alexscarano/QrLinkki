namespace QrLinkki.Application.DTOS;

public record LinkDto
{
    public string original_url { get; init; } = string.Empty;
    public string shortened_code { get; init; } = string.Empty;
    public string? qr_base64 { get; init; } = string.Empty;
    public string complete_shortened_url { get; init; } = string.Empty;
    public DateTime created_at { get; init; } = DateTime.Now;
    public DateTime? expires_at { get; init; }
    public int user_id { get; init; }

}
