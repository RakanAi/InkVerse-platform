using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public static class GoogleTokenValidator
{
    private static readonly IConfigurationManager<OpenIdConnectConfiguration> _configManager =
        new ConfigurationManager<OpenIdConnectConfiguration>(
            "https://accounts.google.com/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever()
        );

    public static async Task<ClaimsPrincipal> ValidateAsync(string idToken, string googleClientId)
    {
        var config = await _configManager.GetConfigurationAsync(CancellationToken.None);

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers = new[]
            {
                "https://accounts.google.com",
                "accounts.google.com"
            },
            ValidateAudience = true,
            ValidAudience = googleClientId,
            ValidateLifetime = true,
            IssuerSigningKeys = config.SigningKeys
        };

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(idToken, validationParams, out _);
        return principal;
    }
}
