using QrLinkki.Domain.Entities;
using QrLinkki.Application.Services;

namespace QrLinkki.Application.DTOS.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(this User user)
        {
            return new UserDto
            {
                email = user.Email,
                password = string.Empty, // never expose password back
                created_at = user.CreatedAt,
                updated_at = user.UpdatedAt,
            };
        }

        public static User ToEntity(this UserDto userDto)
        {
            return new User
            {
                Email = userDto.email,
                PasswordHash = userDto.password.HashPassword(),
                CreatedAt = userDto.created_at,
                UpdatedAt = userDto.updated_at
            };
        }
    }
}
