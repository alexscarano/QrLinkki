using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QrLinkki.Domain.Entities;

namespace QrLinkki.Infrastructure.Persistence.Configurations
{
    public class LinkConfiguration : IEntityTypeConfiguration<Link>
    {
        public void Configure(EntityTypeBuilder<Link> b)
        {
            b.ToTable("tb_links");

            b.HasKey(l => l.LinkId)
                .HasName("PK_Links_LinkId");

            b.Property(l => l.LinkId)
                .HasColumnName("link_id");

            b.Property(l => l.OriginalUrl)
                .IsRequired()
                .HasMaxLength(2048)
                .HasColumnName("original_url");

            b.Property(l => l.ShortenedCode)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("shortened_code");

            b.Property(l => l.QrCodePath)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("qr_code_path");

            b.Property(l => l.CreatedAt)
                .HasColumnName("created_at");

            b.Property(l => l.ExpiresAt)
                .HasColumnName("expires_at");

            b.Property(l => l.UserId)
                .HasColumnName("user_id");

            b.HasOne(l => l.User)
                .WithMany(u => u.Links)
                .HasForeignKey(l => l.UserId)
                .HasConstraintName("FK_Links_Users_UserId")
                .OnDelete(DeleteBehavior.Cascade);

            b.HasMany(l => l.Clicks)
                .WithOne(c => c.Link)
                .HasForeignKey(c => c.LinkId)
                .HasConstraintName("FK_Clicks_Links_LinkId")
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
