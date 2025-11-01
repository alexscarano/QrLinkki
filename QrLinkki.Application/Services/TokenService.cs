using System;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using QrLinkki.Domain.Entities;

namespace QrLinkki.Application.Services
{
    public static class TokenService
    {
        public static string GenerateToken(User user, IConfiguration _config)
        {
            if (user is null) throw new ArgumentNullException(nameof(user));
            if (_config is null) throw new ArgumentNullException(nameof(_config));

            var secret = _config["Jwt:authQrLinkki"];
            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException("JWT secret not configured at 'Jwt:authQrLinkki'.");

            byte[] key;
            // Interpret secret as Base64 if possible, otherwise use UTF8 bytes
            try
            {
                key = Convert.FromBase64String(secret);
            }
            catch (FormatException)
            {
                key = Encoding.UTF8.GetBytes(secret);
            }

            // Require key length > 256 bits (i.e., > 32 bytes)
            if (key.Length * 8 <= 256)
            {
                throw new InvalidOperationException(
                    $"JWT secret is too short: {key.Length * 8} bits. It must be greater than 256 bits. " +
                    "Use a longer secret (recommend at least 32 random bytes, encoded as Base64, or a UTF-8 string with 33+ characters)."
                );
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(2),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
