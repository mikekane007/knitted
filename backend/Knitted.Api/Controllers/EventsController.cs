using System.Security.Claims;
using Knitted.Api.Data;
using Knitted.Api.Models;
using Microsoft.AspNetCore.Authorization;
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
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents(
            [FromQuery] string? search,
            [FromQuery] string? neighborhood,
            [FromQuery] string? price)
        {
            var query = _context.Events.Include(e => e.Host).AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(e => 
                    e.Title.ToLower().Contains(searchLower) || 
                    e.Description.ToLower().Contains(searchLower) ||
                    e.Category.ToLower().Contains(searchLower) ||
                    e.Tags.ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrEmpty(neighborhood) && !neighborhood.Equals("All NYC", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(e => e.Location.ToLower().Contains(neighborhood.ToLower()));
            }

            if (!string.IsNullOrEmpty(price))
            {
                if (price.Equals("Free", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(e => e.Price == 0);
                }
                else if (price.Equals("Under $20", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(e => e.Price < 20);
                }
            }

            return await query.OrderBy(e => e.Date).ToListAsync();
        }

        [HttpGet("categories-summary")]
        public async Task<ActionResult<IEnumerable<object>>> GetCategoriesSummary()
        {
            var categories = new[]
            {
                new {
                    Name = "Art & Design",
                    Tagline = "Sketch, build, and capture the city together.",
                    Description = "Drawing, sketching, painting, architecture tours, and hands-on design meetups in cozy local spots.",
                    CoverImage = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
                    ColorTheme = "#d97706"
                },
                new {
                    Name = "Food & Wine",
                    Tagline = "Share natural wines, sourdough, and great stories.",
                    Description = "Intimate supper clubs, natural wine tastings, high-fidelity listening bars, and local culinary collaborations.",
                    CoverImage = "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800",
                    ColorTheme = "#dc2626"
                },
                new {
                    Name = "Active & Outdoors",
                    Tagline = "Move, climb, run, and explore the landscape.",
                    Description = "Sunrise runs, outdoor bouldering, park workouts, sunset hiking, and high-energy athletic gatherings.",
                    CoverImage = "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800",
                    ColorTheme = "#059669"
                }
            };

            var eventCounts = await _context.Events
                .GroupBy(e => e.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Category ?? "", x => x.Count);

            var summary = categories.Select(c => new
            {
                c.Name,
                c.Tagline,
                c.Description,
                c.CoverImage,
                c.ColorTheme,
                ActiveCount = eventCounts.ContainsKey(c.Name) ? eventCounts[c.Name] : 0
            }).ToList();

            return Ok(summary);
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Event>> PostEvent([FromBody] CreateEventDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID not found or invalid.");
            }

            if (dto.Price < 0)
            {
                return BadRequest("Price cannot be negative.");
            }

            if (dto.TotalCapacity <= 0)
            {
                return BadRequest("Total capacity must be greater than zero.");
            }

            var @event = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                Date = dto.Date.Date,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Location = dto.Location,
                Price = dto.Price,
                Category = dto.Category,
                Tags = dto.Tags,
                CoverImage = string.IsNullOrEmpty(dto.CoverImage) 
                    ? "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800" 
                    : dto.CoverImage,
                TotalCapacity = dto.TotalCapacity,
                AvailableTickets = dto.TotalCapacity,
                HostId = userId
            };

            _context.Events.Add(@event);
            await _context.SaveChangesAsync();

            @event.Host = await _context.Users.FindAsync(userId);

            return CreatedAtAction(nameof(GetEvent), new { id = @event.Id }, @event);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var @event = await _context.Events
                .Include(e => e.Host)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null)
            {
                return NotFound();
            }
            return @event;
        }

        [HttpGet("{id}/attendees")]
        public async Task<ActionResult<IEnumerable<object>>> GetAttendees(int id)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.Id == id);
            if (!eventExists)
            {
                return NotFound("Event not found.");
            }

            var attendees = await _context.Bookings
                .Where(b => b.EventId == id)
                .Include(b => b.User)
                .Select(b => new
                {
                    b.User!.Id,
                    b.User.Name,
                    b.User.Email,
                    b.User.Location,
                    b.User.AvatarUrl,
                    b.User.IsVerified
                })
                .ToListAsync();

            return Ok(attendees);
        }

        [HttpGet("{id}/chat")]
        public async Task<ActionResult<IEnumerable<ChatMessage>>> GetChatMessages(int id)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.Id == id);
            if (!eventExists)
            {
                return NotFound("Event not found.");
            }

            var messages = await _context.ChatMessages
                .Where(c => c.EventId == id)
                .Include(c => c.User)
                .OrderBy(c => c.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }

        [Authorize]
        [HttpPost("{id}/chat")]
        public async Task<ActionResult<ChatMessage>> PostChatMessage(int id, [FromBody] PostChatMessageDto dto)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.Id == id);
            if (!eventExists)
            {
                return NotFound("Event not found.");
            }

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("User ID not found or invalid.");
            }

            var message = new ChatMessage
            {
                EventId = id,
                UserId = userId,
                Message = dto.Message,
                Timestamp = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // Load user data before returning
            message.User = await _context.Users.FindAsync(userId);

            return CreatedAtAction(nameof(GetChatMessages), new { id = message.Id }, message);
        }

        [HttpPost("scan-external")]
        public async Task<ActionResult<IEnumerable<Event>>> ScanExternal()
        {
            var externalHost = await _context.Users.FirstOrDefaultAsync(u => u.Email == "external.host@meetup.com");
            if (externalHost == null)
            {
                externalHost = new User
                {
                    Email = "external.host@meetup.com",
                    Name = "External Meetup Organizer",
                    Bio = "Automatically synced local meetups and community gatherings.",
                    Location = "New York, NY",
                    AvatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                    WovenThreads = "Community, Integration",
                    IsVerified = true
                };
                _context.Users.Add(externalHost);
                await _context.SaveChangesAsync();
            }

            var externalMeetups = new List<Event>
            {
                new Event
                {
                    Title = "DUMBO Tech Breakfast & Talk",
                    Description = "Meet local developers, creators, and tech enthusiasts. Grab a coffee and talk about latest tech developments in a casual environment.",
                    Date = DateTime.UtcNow.AddDays(2).Date,
                    StartTime = "08:30 AM",
                    EndTime = "10:00 AM",
                    Location = "Almondine Bakery, DUMBO",
                    Price = 0.00m,
                    Category = "Art & Design",
                    Tags = "Tech, Coffee, Networking, Imported",
                    CoverImage = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800",
                    TotalCapacity = 30,
                    AvailableTickets = 30,
                    HostId = externalHost.Id
                },
                new Event
                {
                    Title = "Brooklyn Sourdough Bakers Hub",
                    Description = "Share starters, talk hydration percentages, and exchange baking tips with fellow sourdough geeks. Bring your own loaf to share!",
                    Date = DateTime.UtcNow.AddDays(4).Date,
                    StartTime = "02:00 PM",
                    EndTime = "04:30 PM",
                    Location = "Marlow & Sons, Williamsburg",
                    Price = 0.00m,
                    Category = "Food & Wine",
                    Tags = "Sourdough, Baking, Foodie, Imported",
                    CoverImage = "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800",
                    TotalCapacity = 15,
                    AvailableTickets = 15,
                    HostId = externalHost.Id
                },
                new Event
                {
                    Title = "Sunset Run & Social Hour",
                    Description = "A friendly 5k jog along the waterfront followed by social drinks at a local brewery. All paces welcome!",
                    Date = DateTime.UtcNow.AddDays(3).Date,
                    StartTime = "06:30 PM",
                    EndTime = "08:30 PM",
                    Location = "Transmitter Park, Greenpoint",
                    Price = 0.00m,
                    Category = "Active & Outdoors",
                    Tags = "Running, Outdoors, Fitness, Imported",
                    CoverImage = "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=800",
                    TotalCapacity = 40,
                    AvailableTickets = 40,
                    HostId = externalHost.Id
                },
                new Event
                {
                    Title = "Watercolors in the Park",
                    Description = "Spend a relaxed afternoon sketching and painting the beautiful landscape of Central Park. Basic watercolor sets and paper provided.",
                    Date = DateTime.UtcNow.AddDays(6).Date,
                    StartTime = "01:00 PM",
                    EndTime = "03:30 PM",
                    Location = "Sheep Meadow, Central Park",
                    Price = 12.00m,
                    Category = "Art & Design",
                    Tags = "Painting, Art, Outdoors, Imported",
                    CoverImage = "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800",
                    TotalCapacity = 20,
                    AvailableTickets = 20,
                    HostId = externalHost.Id
                },
                new Event
                {
                    Title = "East Village Jazz Listening Club",
                    Description = "Come listen to classic jazz vinyl records through a premium sound system. Wine and light snacks available for purchase.",
                    Date = DateTime.UtcNow.AddDays(5).Date,
                    StartTime = "08:00 PM",
                    EndTime = "10:30 PM",
                    Location = "In Sheep's Clothing, East Village",
                    Price = 15.00m,
                    Category = "Food & Wine",
                    Tags = "Jazz, Vinyl, Music, Imported",
                    CoverImage = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800",
                    TotalCapacity = 25,
                    AvailableTickets = 25,
                    HostId = externalHost.Id
                }
            };

            var importedEvents = new List<Event>();
            foreach (var meetup in externalMeetups)
            {
                var exists = await _context.Events.AnyAsync(e => e.Title == meetup.Title && e.Location == meetup.Location);
                if (!exists)
                {
                    _context.Events.Add(meetup);
                    importedEvents.Add(meetup);
                }
            }

            if (importedEvents.Count > 0)
            {
                await _context.SaveChangesAsync();
            }

            var allEvents = await _context.Events.Include(e => e.Host).OrderBy(e => e.Date).ToListAsync();
            return Ok(allEvents);
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedEvents()
        {
            // Clear all data first
            _context.Bookings.RemoveRange(_context.Bookings);
            _context.ChatMessages.RemoveRange(_context.ChatMessages);
            _context.Events.RemoveRange(_context.Events);
            _context.Users.RemoveRange(_context.Users.Where(u => u.OAuthProvider == null)); // Keep only test external logins if any, else clear

            await _context.SaveChangesAsync();

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();

            // 1. Create premium hosts and test users
            var hostSarah = new User
            {
                Email = "sarah.j@example.com",
                Name = "Sarah Jenkins",
                Bio = "Visual artist & urban sketcher. Host of Sunday Morning Sketching.",
                Location = "New York, NY",
                AvatarUrl = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
                WovenThreads = "Creative, Art & Design",
                IsVerified = true
            };
            hostSarah.PasswordHash = hasher.HashPassword(hostSarah, "Password123");

            var hostElena = new User
            {
                Email = "elena.r@example.com",
                Name = "Elena Rossi",
                Bio = "Wine writer & vinyl selector. Spinning records and sharing low-intervention wines.",
                Location = "New York, NY",
                AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
                WovenThreads = "Food & Drink, Music",
                IsVerified = true
            };
            hostElena.PasswordHash = hasher.HashPassword(hostElena, "Password123");

            var hostMarcus = new User
            {
                Email = "marcus.j@example.com",
                Name = "Marcus Johnson",
                Bio = "Climber, runner, and espresso lover. Finding the best routes in NYC.",
                Location = "Brooklyn, NY",
                AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
                WovenThreads = "Outdoors, Fitness",
                IsVerified = true
            };
            hostMarcus.PasswordHash = hasher.HashPassword(hostMarcus, "Password123");

            var userDavid = new User
            {
                Email = "david.k@example.com",
                Name = "David Kim",
                Bio = "Lover of sourdough bread and creative communities.",
                Location = "Brooklyn, NY",
                AvatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
                WovenThreads = "Food & Drink, Creative",
                IsVerified = false
            };
            userDavid.PasswordHash = hasher.HashPassword(userDavid, "Password123");

            var userAlex = new User
            {
                Email = "alex.r@example.com",
                Name = "Alex Rivera",
                Bio = "Architecture enthusiast, sourdough experimenter, vinyl collector. Always up for morning coffee runs.",
                Location = "Brooklyn, NY",
                AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                WovenThreads = "Creative, Food & Drink, Outdoors, Music",
                IsVerified = true
            };
            userAlex.PasswordHash = hasher.HashPassword(userAlex, "Password123");

            _context.Users.AddRange(hostSarah, hostElena, hostMarcus, userDavid, userAlex);
            await _context.SaveChangesAsync();

            // 2. Create detailed events
            var event1 = new Event
            {
                Title = "Morning Coffee & Urban Sketching",
                Description = "Join us for a slow Sunday morning. We'll grab pour-overs at The Roastery and spend an hour sketching the historic cobblestone facades and ironwork. No formal experience required—just bring your favorite sketchbook and pen.",
                Date = DateTime.UtcNow.AddDays(1).Date, // Active tomorrow
                StartTime = "09:00 AM",
                EndTime = "11:30 AM",
                Location = "The Roastery, DUMBO",
                Price = 0.00m,
                Category = "Art & Design",
                Tags = "Sketching, Coffee, Beginner Friendly, Morning",
                CoverImage = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
                TotalCapacity = 15,
                AvailableTickets = 10, // 5 booked
                HostId = hostSarah.Id
            };

            var event2 = new Event
            {
                Title = "Natural Wine & High-Fidelity Vinyl Listening",
                Description = "An intimate evening dedicated to low-intervention skin-contact wines and warm analog sound. We're spinning Japanese ambient, late-70s jazz fusion, and dub records through our custom tube amplifier.",
                Date = DateTime.UtcNow.AddDays(3).Date,
                StartTime = "07:30 PM",
                EndTime = "10:30 PM",
                Location = "Cellar Door, East Village",
                Price = 22.00m,
                Category = "Food & Wine",
                Tags = "Vinyl, Natural Wine, Jazz, Vinyl Community",
                CoverImage = "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800",
                TotalCapacity = 12,
                AvailableTickets = 7, // 5 booked
                HostId = hostElena.Id
            };

            var event3 = new Event
            {
                Title = "Sunrise Bouldering & Espresso",
                Description = "An early morning session at the outdoor wall. We will climb for a couple of hours as the sun rises over the Manhattan bridge, then refuel with double espressos at our favorite local cart.",
                Date = DateTime.UtcNow.AddDays(5).Date,
                StartTime = "06:00 AM",
                EndTime = "08:30 AM",
                Location = "DUMBO Boulders",
                Price = 15.00m,
                Category = "Active & Outdoors",
                Tags = "Climbing, Bouldering, Fitness, Coffee",
                CoverImage = "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800",
                TotalCapacity = 20,
                AvailableTickets = 20,
                HostId = hostMarcus.Id
            };

            _context.Events.AddRange(event1, event2, event3);
            await _context.SaveChangesAsync();

            // 3. Create attendee bookings
            var bookings = new List<Booking>
            {
                // Event 1 bookings
                new Booking { UserId = hostSarah.Id, EventId = event1.Id, BookedAt = DateTime.UtcNow.AddHours(-12) }, // Sarah goes to her own event too
                new Booking { UserId = userDavid.Id, EventId = event1.Id, BookedAt = DateTime.UtcNow.AddHours(-10) },
                new Booking { UserId = hostElena.Id, EventId = event1.Id, BookedAt = DateTime.UtcNow.AddHours(-8) },
                new Booking { UserId = hostMarcus.Id, EventId = event1.Id, BookedAt = DateTime.UtcNow.AddHours(-6) },
                new Booking { UserId = userAlex.Id, EventId = event1.Id, BookedAt = DateTime.UtcNow.AddHours(-4) },

                // Event 2 bookings
                new Booking { UserId = hostSarah.Id, EventId = event2.Id, BookedAt = DateTime.UtcNow.AddHours(-11) },
                new Booking { UserId = userDavid.Id, EventId = event2.Id, BookedAt = DateTime.UtcNow.AddHours(-9) },
                new Booking { UserId = hostMarcus.Id, EventId = event2.Id, BookedAt = DateTime.UtcNow.AddHours(-7) },
                new Booking { UserId = userAlex.Id, EventId = event2.Id, BookedAt = DateTime.UtcNow.AddHours(-5) },
                new Booking { UserId = hostElena.Id, EventId = event2.Id, BookedAt = DateTime.UtcNow.AddHours(-3) }
            };

            _context.Bookings.AddRange(bookings);
            await _context.SaveChangesAsync();

            // 4. Create chat messages
            var chats = new List<ChatMessage>
            {
                new ChatMessage
                {
                    EventId = event1.Id,
                    UserId = userDavid.Id,
                    Message = "Will watercolors be fine or strictly pens?",
                    Timestamp = DateTime.UtcNow.AddHours(-2)
                },
                new ChatMessage
                {
                    EventId = event1.Id,
                    UserId = hostSarah.Id,
                    Message = "Watercolors are very welcome! We'll have water cups available.",
                    Timestamp = DateTime.UtcNow.AddHours(-1).AddMinutes(-30)
                }
            };

            _context.ChatMessages.AddRange(chats);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Database successfully seeded with realistic premium events." });
        }
    }

    public class PostChatMessageDto
    {
        public string Message { get; set; } = string.Empty;
    }

    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Tags { get; set; } = string.Empty;
        public string CoverImage { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
    }
}
