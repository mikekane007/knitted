using System.Text.Json.Serialization;

namespace Knitted.Api.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int TotalCapacity { get; set; }
        public int AvailableTickets { get; set; }

        public string Location { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public decimal Price { get; set; } = 0.00m;
        public string Category { get; set; } = string.Empty;
        public string Tags { get; set; } = string.Empty;
        public string CoverImage { get; set; } = string.Empty;

        public int? HostId { get; set; }
        public User? Host { get; set; }

        [JsonIgnore]
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
