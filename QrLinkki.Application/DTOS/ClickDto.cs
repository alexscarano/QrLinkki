namespace QrLinkki.Application.DTOS;

public record ClickDto
{
    public DateTime clicked_at { get; init; } = DateTime.Now;
    public string? ip_address { get; init; }
    public string? device_info { get; init; }
}
