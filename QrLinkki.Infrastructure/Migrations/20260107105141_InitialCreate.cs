using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QrLinkki.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tb_users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users_UserId", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "tb_links",
                columns: table => new
                {
                    link_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    original_url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    shortened_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    complete_shortened_url = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    qr_code_path = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    clicks = table.Column<int>(type: "int", nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_tb_links_user_id",
                table: "tb_links",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "UQ_Links_ShortenedCode",
                table: "tb_links",
                column: "shortened_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Users_Email",
                table: "tb_users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tb_links");

            migrationBuilder.DropTable(
                name: "tb_users");
        }
    }
}
