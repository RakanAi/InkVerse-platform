using Microsoft.AspNetCore.Identity;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Data
{
    public static class IdentitySeeder
    {
        public static async Task SeedRolesAndAdminAsync(
            IServiceProvider services,
            IConfiguration config)
        {
            using var scope = services.CreateScope();

            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

            // ---- ROLES ----
            string[] roles = { "Admin", "User", "Author" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // ---- ADMIN USER ----
            var adminEmail = config["SeedAdmin:Email"];
            var adminUserName = config["SeedAdmin:UserName"];
            var adminPassword = config["SeedAdmin:Password"];

            if (string.IsNullOrWhiteSpace(adminEmail) ||
                string.IsNullOrWhiteSpace(adminUserName) ||
                string.IsNullOrWhiteSpace(adminPassword))
                return;

            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new AppUser
                {
                    Email = adminEmail,
                    UserName = adminUserName,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (!result.Succeeded)
                    throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
}
