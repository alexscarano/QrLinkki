using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrLinkki.Domain.Entities;

namespace QrLinkki.Infrastructure.Persistence.Configurations
{
    public class ClickConfiguration : IEntityTypeConfiguration<Click>
    {
        public void Configure(EntityTypeBuilder<Click> b)
        {
            b.ToTable("tb_clicks");

            b.HasKey(c => c.ClickId)
                .HasName("PK_Clicks_ClickId");

            b.Property(c => c.ClickId)
                .HasColumnName("click_id");

            b.Property(c => c.ClickedAt)
                .HasColumnName("clicked_at");

            b.Property(c => c.DeviceInfo)
                .HasMaxLength(255)
                .HasColumnName("device_info");

            b.Property(c => c.LinkId)
                .HasColumnName("link_id");

            b.HasOne(c => c.Link)
                .WithMany(l => l.Clicks)
                .HasForeignKey(c => c.LinkId)
                .HasConstraintName("FK_Clicks_Links_LinkId")
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
