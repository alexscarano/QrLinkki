using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CorrecoesBanco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ip_address",
                table: "tb_clicks",
                type: "TEXT",
                maxLength: 45,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ip_address",
                table: "tb_clicks");
        }
    }
}
