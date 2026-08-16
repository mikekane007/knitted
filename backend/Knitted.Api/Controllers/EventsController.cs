using Knitted.Api.Data;
using Knitted.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Knitted.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly KnittedDbContext _context;

        public EventsController(KnittedDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents()
        {
            return await _context.Events.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var @event = await _context.Events.FindAsync(id);
            if (@event == null)
            {
                return NotFound();
            }
            return @event;
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedEvents()
        {
            if (await _context.Events.AnyAsync())
            {
                return BadRequest("Database already has events.");
            }

            var events = new List<Event>
            {
                new Event
                {
                    Title = "Introduction to Hand Knitting",
                    Description = "Learn the basics of hand knitting, casting on, knit stitch, and binding off.",
                    Date = DateTime.UtcNow.AddDays(7),
                    TotalCapacity = 20,
                    AvailableTickets = 20
                },
                new Event
                {
                    Title = "Advanced Cable Knitting Workshop",
                    Description = "Master the art of knitting beautiful cables and reading cable charts.",
                    Date = DateTime.UtcNow.AddDays(14),
                    TotalCapacity = 15,
                    AvailableTickets = 15
                },
                new Event
                {
                    Title = "Knit & Sip Community Social",
                    Description = "Bring your current project, enjoy some refreshments, and chat with fellow knitters.",
                    Date = DateTime.UtcNow.AddDays(21),
                    TotalCapacity = 50,
                    AvailableTickets = 50
                }
            };

            _context.Events.AddRange(events);
            await _context.SaveChangesAsync();

            return Ok(events);
        }
    }
}
