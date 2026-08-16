using System.Security.Claims;
using Knitted.Api.Data;
using Knitted.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Knitted.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly KnittedDbContext _context;

        public BookingsController(KnittedDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyBookings()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID claim not found or invalid.");
            }

            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Event)
                .Select(b => new
                {
                    b.Id,
                    b.BookedAt,
                    Event = new
                    {
                        b.Event!.Id,
                        b.Event.Title,
                        b.Event.Description,
                        b.Event.Date
                    }
                })
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID claim not found or invalid.");
            }

            // Check if we are running in unit tests (InMemory Database)
            if (_context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
            {
                var ev = await _context.Events.FindAsync(dto.EventId);
                if (ev == null)
                {
                    return NotFound("The specified event was not found.");
                }
                if (ev.AvailableTickets <= 0)
                {
                    return BadRequest("No tickets available for this event.");
                }
                ev.AvailableTickets--;

                var booking = new Booking
                {
                    UserId = userId,
                    EventId = dto.EventId,
                    BookedAt = DateTime.UtcNow
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMyBookings), new { id = booking.Id }, new
                {
                    booking.Id,
                    booking.EventId,
                    booking.UserId,
                    booking.BookedAt
                });
            }

            // Begin transaction for concurrency control (SQL Server)
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Decrement AvailableTickets atomically only if it is greater than 0.
                // This prevents overbooking.
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Events SET AvailableTickets = AvailableTickets - 1 WHERE Id = {dto.EventId} AND AvailableTickets > 0"
                );

                if (rowsAffected == 0)
                {
                    var eventExists = await _context.Events.AnyAsync(e => e.Id == dto.EventId);
                    if (!eventExists)
                    {
                        return NotFound("The specified event was not found.");
                    }
                    return BadRequest("No tickets available for this event.");
                }

                var booking = new Booking
                {
                    UserId = userId,
                    EventId = dto.EventId,
                    BookedAt = DateTime.UtcNow
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetMyBookings), new { id = booking.Id }, new
                {
                    booking.Id,
                    booking.EventId,
                    booking.UserId,
                    booking.BookedAt
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An error occurred while booking the ticket: {ex.Message}");
            }
        }
    }

    public class CreateBookingDto
    {
        public int EventId { get; set; }
    }
}
