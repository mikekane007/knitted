using System.Text.Json.Serialization;

namespace Knitted.Api.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        
        [JsonIgnore]
        public Event? Event { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
