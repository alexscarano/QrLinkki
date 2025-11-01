using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AdicionandoCampoEmLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "complete_shortened_url",
                table: "tb_links",
                type: "TEXT",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "UQ_Users_Email",
                table: "tb_users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_Users_Email",
                table: "tb_users");

            migrationBuilder.DropColumn(
                name: "complete_shortened_url",
                table: "tb_links");
        }
    }
}
