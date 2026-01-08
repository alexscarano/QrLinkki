namespace QrLinkki.Application.DTOS;

public record UserDto
{
    public int user_id { get; init; }
    public string email { get; init; } = string.Empty;

    // Recebe senha em texto puro no input; não expor em responses
    public string password { get; init; } = string.Empty;
    public DateTime created_at { get; init; } = DateTime.Now;
    public DateTime? updated_at { get; init; }
}
