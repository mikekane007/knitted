using System.Security.Claims;
using FluentAssertions;
using Knitted.Api.Controllers;
using Knitted.Api.Data;
using Knitted.Api.Models;
using Knitted.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Knitted.Tests
{
    [TestFixture]
    public class AuthControllerTests
    {
        private KnittedDbContext _context = null!;
        private AuthController _controller = null!;

        private class DummyTokenService : ITokenService
        {
            public string GenerateToken(User user) => "dummy-token";
        }

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<KnittedDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new KnittedDbContext(options);
            _context.Database.EnsureCreated();

            // Set up a default user claims identity (User ID 1)
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, "1"),
                new(ClaimTypes.Email, "test@knitted.com")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller = new AuthController(_context, new DummyTokenService())
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = claimsPrincipal }
                }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetProfile_ShouldReturnProfile_WhenUserIsAuthenticated()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@knitted.com",
                Name = "Test User",
                Location = "Brooklyn, NY",
                Bio = "Self-taught coder",
                WovenThreads = "Tech, Food"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetProfile();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Should().NotBeNull();

            var returnedUser = okResult!.Value as User;
            returnedUser.Should().NotBeNull();
            returnedUser!.Name.Should().Be("Test User");
            returnedUser.Location.Should().Be("Brooklyn, NY");
            returnedUser.Bio.Should().Be("Self-taught coder");
            returnedUser.WovenThreads.Should().Be("Tech, Food");
        }

        [Test]
        public async Task UpdateProfile_ShouldModifyProfileFields_WhenValidDataIsProvided()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@knitted.com",
                Name = "Old Name",
                Location = "Manhattan",
                Bio = "Old Bio"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var dto = new UpdateProfileDto
            {
                Name = "New Name",
                Location = "Queens",
                Bio = "New Bio",
                AvatarUrl = "new.jpg",
                WovenThreads = "Art & Design, Music & Sound"
            };

            // Act
            var result = await _controller.UpdateProfile(dto);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Should().NotBeNull();

            var returnedUser = okResult!.Value as User;
            returnedUser.Should().NotBeNull();
            returnedUser!.Name.Should().Be("New Name");
            returnedUser.Location.Should().Be("Queens");
            returnedUser.Bio.Should().Be("New Bio");
            returnedUser.AvatarUrl.Should().Be("new.jpg");
            returnedUser.WovenThreads.Should().Be("Art & Design, Music & Sound");

            // Verify database update
            var dbUser = await _context.Users.FindAsync(1);
            dbUser!.Name.Should().Be("New Name");
        }
    }
}
