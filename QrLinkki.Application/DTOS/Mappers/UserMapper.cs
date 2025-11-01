using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.DTOS.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(this User user)
        {
            return new UserDto
            {
                email = user.Email,
                password_hash = user.PasswordHash,
                created_at = user.CreatedAt,
                updated_at = user.UpdatedAt,
                links = user.Links.Select(c => c.ToDto()).ToList()
            };
        }

        public static User ToEntity(this UserDto userDto)
        {
            return new User
            {
                Email = userDto.email,
                PasswordHash = userDto.password_hash,
                CreatedAt = userDto.created_at,
                UpdatedAt = userDto.updated_at
            };
        }
    }
}
