using System.Text.Json.Serialization;

namespace Knitted.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string? OAuthProvider { get; set; }
        public string? OAuthProviderKey { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? Location { get; set; }
        public string? AvatarUrl { get; set; }
        public string? WovenThreads { get; set; }
        public bool IsVerified { get; set; } = false;
        public DateTime JoinedDate { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
