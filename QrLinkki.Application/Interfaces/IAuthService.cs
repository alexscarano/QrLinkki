using QrLinkki.Application.DTOS;

namespace QrLinkki.Application.Interfaces;

public interface IAuthService
{
    public Task<string?> AuthenticateUser(UserDto user);
}
