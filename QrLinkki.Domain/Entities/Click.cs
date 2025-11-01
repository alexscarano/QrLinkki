namespace QrLinkki.Domain.Entities
{
    public class Click
    {
        public int ClickId { get; set; }
        public DateTime ClickedAt { get; set; } = DateTime.Now;
        public string? DeviceInfo { get; set; }
        public int LinkId { get; set; }

        // Navigation property
        public Link Link { get; set; } = new Link();

    }
}
