using QrLinkki.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace QrLinkki.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> b)
        {
            b.ToTable("tb_users");

            b.HasKey(u => u.UserId)
                .HasName("PK_Users_UserId");

            b.Property(u => u.UserId)
                .HasColumnName("user_id");
            
            b.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("email");

            b.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("password_hash");

            b.Property(u => u.CreatedAt)
                .HasColumnName("created_at");

            b.Property(u => u.UpdatedAt)
                .HasColumnName("updated_at");

            //b.HasIndex(u => u.Email)
            //    .IsUnique()
            //    .HasDatabaseName("UQ_Users_Email");

            b.HasMany(u => u.Links)
                .WithOne(l => l.User)
                .HasForeignKey(l => l.UserId)
                .HasConstraintName("FK_Links_Users_UserId")
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
