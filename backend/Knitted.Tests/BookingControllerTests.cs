using System.Security.Claims;
using FluentAssertions;
using Knitted.Api.Controllers;
using Knitted.Api.Data;
using Knitted.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Knitted.Tests
{
    [TestFixture]
    public class BookingControllerTests
    {
        private KnittedDbContext _context = null!;
        private BookingsController _controller = null!;

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

            _controller = new BookingsController(_context)
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
        public async Task CreateBooking_ShouldSucceed_WhenTicketsAreAvailable()
        {
            // Arrange
            var testEvent = new Event
            {
                Title = "Knitting Basics",
                Description = "Fun workshop",
                Date = DateTime.UtcNow.AddDays(2),
                TotalCapacity = 10,
                AvailableTickets = 10
            };
            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            var dto = new CreateBookingDto { EventId = testEvent.Id };

            // Act
            var result = await _controller.CreateBooking(dto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            
            var createdResult = result as CreatedAtActionResult;
            createdResult.Should().NotBeNull();

            // Verify ticket was decremented
            var updatedEvent = await _context.Events.FindAsync(testEvent.Id);
            updatedEvent.Should().NotBeNull();
            updatedEvent!.AvailableTickets.Should().Be(9);

            // Verify booking was saved
            var bookings = await _context.Bookings.ToListAsync();
            bookings.Should().HaveCount(1);
            bookings[0].UserId.Should().Be(1);
            bookings[0].EventId.Should().Be(testEvent.Id);
        }

        [Test]
        public async Task CreateBooking_ShouldFail_WhenTicketsAreSoldOut()
        {
            // Arrange
            var testEvent = new Event
            {
                Title = "Advanced Knitting",
                Description = "Popular workshop",
                Date = DateTime.UtcNow.AddDays(5),
                TotalCapacity = 10,
                AvailableTickets = 0 // Sold out
            };
            _context.Events.Add(testEvent);
            await _context.SaveChangesAsync();

            var dto = new CreateBookingDto { EventId = testEvent.Id };

            // Act
            var result = await _controller.CreateBooking(dto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();

            // Verify tickets didn't drop below 0
            var updatedEvent = await _context.Events.FindAsync(testEvent.Id);
            updatedEvent!.AvailableTickets.Should().Be(0);

            // Verify no bookings were saved
            var bookings = await _context.Bookings.ToListAsync();
            bookings.Should().BeEmpty();
        }

        [Test]
        public async Task CreateBooking_ShouldReturnNotFound_WhenEventDoesNotExist()
        {
            // Arrange
            var dto = new CreateBookingDto { EventId = 999 };

            // Act
            var result = await _controller.CreateBooking(dto);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Test]
        public async Task GetMyPasses_ShouldReturnActivePasses_ForAuthenticatedUser()
        {
            // Arrange
            var host = new User { Name = "John Host", Email = "host@knitted.com" };
            _context.Users.Add(host);
            await _context.SaveChangesAsync();

            var testEvent = new Event
            {
                Title = "Knitting Basics",
                Description = "Fun workshop",
                Date = DateTime.UtcNow.AddDays(2),
                Location = "Central Park",
                StartTime = "3:00 PM",
                Price = 15.0m,
                CoverImage = "bas.jpg",
                HostId = host.Id,
                Host = host
            };
            _context.Events.Add(testEvent);

            var booking = new Booking
            {
                UserId = 1, // authenticated user ID
                Event = testEvent
            };
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetMyPasses();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult.Should().NotBeNull();
            
            var list = okResult!.Value as System.Collections.IEnumerable;
            list.Should().NotBeNull();
            
            var enumerator = list!.GetEnumerator();
            enumerator.MoveNext().Should().BeTrue();
            
            var firstItem = enumerator.Current;
            firstItem.Should().NotBeNull();
            
            firstItem.GetType().GetProperty("Title")?.GetValue(firstItem).Should().Be("Knitting Basics");
            firstItem.GetType().GetProperty("HostName")?.GetValue(firstItem).Should().Be("John Host");
            firstItem.GetType().GetProperty("TicketCode")?.GetValue(firstItem).Should().Be($"KNIT-{booking.Id:D4}-{testEvent.Id:D4}");
        }
    }
}
