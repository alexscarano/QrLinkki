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
                user_id = user.UserId,
                email = user.Email,
                password = string.Empty, // nunca expor a senha de volta
                created_at = user.CreatedAt,
                updated_at = user.UpdatedAt,
            };
        }

        public static User ToEntity(this UserDto userDto)
        {
            var user = new User
            {
                Email = userDto.email,
                CreatedAt = userDto.created_at,
                UpdatedAt = userDto.updated_at
            };

            if (!string.IsNullOrWhiteSpace(userDto.password))
            {
                user.PasswordHash = userDto.password.HashPassword();
            }

            return user;
        }
    }
}
