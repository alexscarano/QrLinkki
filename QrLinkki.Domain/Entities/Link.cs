namespace QrLinkki.Domain.Entities
{
    public class Link
    {
        public int LinkId { get; set; }
    
        public string OriginalUrl { get; set; } = string.Empty;
    
        public string ShortenedCode { get; set; } = string.Empty;

        public string QrCodePath { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ExpiresAt { get; set; }
        
        public int UserId { get; set; }

        // Navigation properties
        public User User { get; set; } = new User();

        public ICollection<Click> Clicks { get; set; } = new List<Click>();

    }
}
