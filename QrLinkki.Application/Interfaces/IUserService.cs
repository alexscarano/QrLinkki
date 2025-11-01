using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.Interfaces;
public interface IUserService
{
    public Task<User?> GetUser(int user_id);

    public Task<IEnumerable<User>?> GetUsers();

    public Task<bool> CreateUser(User user);

    public Task<User?> UpdateUser(User user);

    public Task<bool> DeleteUser(int user_id);

    public Task<bool> VerifyIfUserExists(string user_id);

    public Task<User?> GetUserByEmail(string email);
}
