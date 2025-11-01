namespace QrLinkki.Domain.Entities
{
    public class User
    {
        public int UserId { get; set; }

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties can be added here in the future
        public ICollection<Link> Links { get; set; } = new List<Link>();

    }
}
