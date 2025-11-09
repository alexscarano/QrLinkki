using Microsoft.EntityFrameworkCore;
using QrLinkki.Domain.Entities;
using QrLinkki.Infrastructure.Persistence.Configurations;

namespace QrLinkki.Infrastructure.Persistence.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {}
    public DbSet<User> Users { get; set; }
    public DbSet<Link> Links { get; set; }
    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.ApplyConfiguration(new UserConfiguration());
        mb.ApplyConfiguration(new LinkConfiguration());
    }
}

