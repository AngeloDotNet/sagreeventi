using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SagreEventi.Web.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPosizioneEventi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Indirizzo",
                table: "Eventi",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitudine",
                table: "Eventi",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitudine",
                table: "Eventi",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Indirizzo",
                table: "Eventi");

            migrationBuilder.DropColumn(
                name: "Latitudine",
                table: "Eventi");

            migrationBuilder.DropColumn(
                name: "Longitudine",
                table: "Eventi");
        }
    }
}
