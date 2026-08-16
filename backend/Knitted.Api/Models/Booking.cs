namespace Knitted.Api.Models
{
    public class Booking
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public int EventId { get; set; }
        public Event? Event { get; set; }

        public DateTime BookedAt { get; set; } = DateTime.UtcNow;
    }
}
