namespace QrLinkki.Application.DTOS;

public record UserDto
{
    public string email { get; init; } = string.Empty;
    public string password_hash { get; init; } = string.Empty;
    public DateTime created_at { get; init; } 
    public DateTime? updated_at { get; init; }

    public IEnumerable<LinkDto>? links { get; init; }
}
