using Microsoft.Extensions.Configuration;
using QrLinkki.Application.DTOS;
using QrLinkki.Application.Interfaces;
using QrLinkki.Domain.Interfaces;

namespace QrLinkki.Application.Services;

public class AuthService : IAuthService
{

    private readonly IUserRepository _repository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository repository, IConfiguration configuration)
    {
        _repository = repository;
        _configuration = configuration;
    }

    public async Task<string?> AuthenticateUser(UserDto user)
    {
        var userDb = await _repository.GetUserByEmail(user.email);

        if (userDb is null)
        {
            return string.Empty;
        }

        if (PasswordServices.VerifyPassword(user.password, userDb.PasswordHash))
        {
            return TokenService.GenerateToken(userDb, _configuration);
        }

        return string.Empty;
    }
}
