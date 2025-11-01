using Microsoft.EntityFrameworkCore;
using QrLinkki.Domain.Entities;
using QrLinkki.Domain.Interfaces;
using QrLinkki.Infrastructure.Persistence.Data;

namespace QrLinkki.Infrastructure.Repository;
public class UserRepository : IUserRepository
{
    private readonly AppDbContext _appDbContext;

    public UserRepository(AppDbContext appDbContext)
    {
        _appDbContext = appDbContext;
    }
    public async Task<User?> GetUser(int user_id)
    => await _appDbContext.Users.FirstOrDefaultAsync(x => x.UserId == user_id);
    public async Task<IEnumerable<User>?> GetUsers()
    =>  await _appDbContext.Users.ToListAsync();
    public async Task<bool> CreateUser(User user)
    {
        try
        {
            if (user is null)
                return false;

            await _appDbContext.Users.AddAsync(user);
            await _appDbContext.SaveChangesAsync();

            return true;
        }
        catch 
        {
            return false;
        }
    }
    public async Task<User?> UpdateUser(User user)
    {
        try
        {
            var userDb = await GetUser(user.UserId);

            if (userDb is null)
                return null;

            // Apply incoming non-empty values to the database entity
            if (!string.IsNullOrWhiteSpace(user.Email))
                userDb.Email = user.Email;
            if (!string.IsNullOrWhiteSpace(user.PasswordHash))
                userDb.PasswordHash = user.PasswordHash;

            userDb.UpdatedAt = DateTime.Now;

            _appDbContext.Users.Update(userDb);
            await _appDbContext.SaveChangesAsync();

            return userDb;
        }
        catch 
        {
            return null;
        }
    }
    public async Task<bool> DeleteUser(int user_id)
    {
        try
        {
            var user = await GetUser(user_id);

            if (user is null)
                return false;

            _appDbContext.Users.Remove(user);
            await _appDbContext.SaveChangesAsync();

            return true;
        }
        catch
        {
            return false;
        }

    }
    public async Task<bool> VerifyIfUserExists(string user_id)
    => await _appDbContext.Users.AnyAsync(u => u.Email == user_id);

    public async Task<User?> GetUserByEmail(string email)
    => await _appDbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
}
