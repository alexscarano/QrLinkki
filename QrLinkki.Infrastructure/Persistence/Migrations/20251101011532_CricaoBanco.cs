using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CricaoBanco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tb_users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users_UserId", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "tb_links",
                columns: table => new
                {
                    link_id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    original_url = table.Column<string>(type: "TEXT", maxLength: 2048, nullable: false),
                    shortened_code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    qr_code_path = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    expires_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    user_id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Links_LinkId", x => x.link_id);
                    table.ForeignKey(
                        name: "FK_Links_Users_UserId",
                        column: x => x.user_id,
                        principalTable: "tb_users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tb_clicks",
                columns: table => new
                {
                    click_id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    clicked_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    device_info = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    link_id = table.Column<int>(type: "INTEGER", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_tb_links_user_id",
                table: "tb_links",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tb_clicks");

            migrationBuilder.DropTable(
                name: "tb_links");

            migrationBuilder.DropTable(
                name: "tb_users");
        }
    }
}
