using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.QrLinkki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class removeClickTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tb_clicks");

            migrationBuilder.AddColumn<int>(
                name: "clicks",
                table: "tb_links",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "clicks",
                table: "tb_links");

            migrationBuilder.CreateTable(
                name: "tb_clicks",
                columns: table => new
                {
                    click_id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    link_id = table.Column<int>(type: "INTEGER", nullable: false),
                    clicked_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    device_info = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    ip_address = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clicks_ClickId", x => x.click_id);
                    table.ForeignKey(
                        name: "FK_Clicks_Links_LinkId",
                        column: x => x.link_id,
                        principalTable: "tb_links",
                        principalColumn: "link_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tb_clicks_link_id",
                table: "tb_clicks",
                column: "link_id");
        }
    }
}
