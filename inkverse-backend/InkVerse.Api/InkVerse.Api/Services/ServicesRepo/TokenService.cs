using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly SymmetricSecurityKey _Key;
        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
#pragma warning disable CS8604 // Possible null reference argument.
            _Key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(s: _configuration["JWT:SigningKey"]));
#pragma warning restore CS8604 // Possible null reference argument.
        }
        public string CreateToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
    {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id), // ✅ pick ONE value (id is best)
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())

    };

            // ✅ add roles as claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var creds = new SigningCredentials(_Key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = creds,
                Issuer = _configuration["JWT:ValidIssuer"],
                Audience = _configuration["JWT:ValidAudience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }


    }
    
    }

