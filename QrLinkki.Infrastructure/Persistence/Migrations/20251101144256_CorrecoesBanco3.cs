using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CorrecoesBanco3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_Users_Email",
                table: "tb_users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "UQ_Users_Email",
                table: "tb_users",
                column: "email",
                unique: true);
        }
    }
}
