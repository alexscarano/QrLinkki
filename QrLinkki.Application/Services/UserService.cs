using QrLinkki.Application.Interfaces;
using QrLinkki.Domain.Entities;
using QrLinkki.Domain.Interfaces;

namespace QrLinkki.Application.Services;
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> DeleteUser(int user_id)
        => await _userRepository.DeleteUser(user_id);

    public async Task<User?> GetUser(int user_id)
        => await _userRepository.GetUser(user_id);

    public async Task<IEnumerable<User>?> GetUsers()
        => await _userRepository.GetUsers();

    public async Task<bool> CreateUser(User user)
    {
        if (user is null || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            throw new ArgumentException("Usuário inválido.");
        }

        user.CreatedAt = DateTime.Now;
        return await _userRepository.CreateUser(user);
    }

    public async Task<User?> UpdateUser(User user)
        => await _userRepository.UpdateUser(user);

    public async Task<bool> VerifyIfUserExists(string user_id)
        => await _userRepository.VerifyIfUserExists(user_id);

    public async Task<User?> GetUserByEmail(string email)
        => await _userRepository.GetUserByEmail(email);
}
