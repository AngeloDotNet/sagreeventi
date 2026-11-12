using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SagreEventi.Web.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPeriodiTema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PeriodiTema",
                columns: table => new
                {
                    Chiave = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Attivo = table.Column<bool>(type: "bit", nullable: false),
                    GiornoInizio = table.Column<int>(type: "int", nullable: true),
                    MeseInizio = table.Column<int>(type: "int", nullable: true),
                    GiornoFine = table.Column<int>(type: "int", nullable: true),
                    MeseFine = table.Column<int>(type: "int", nullable: true),
                    GiorniPrimaPasqua = table.Column<int>(type: "int", nullable: true),
                    GiorniDopoPasqua = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PeriodiTema", x => x.Chiave);
                });

            migrationBuilder.InsertData(
                table: "PeriodiTema",
                columns: new[] { "Chiave", "Attivo", "GiorniDopoPasqua", "GiorniPrimaPasqua", "GiornoFine", "GiornoInizio", "MeseFine", "MeseInizio" },
                values: new object[,]
                {
                    { "ferragosto", true, null, null, 20, 1, 8, 8 },
                    { "halloween", true, null, null, 31, 24, 10, 10 },
                    { "natale", true, null, null, 6, 1, 1, 12 },
                    { "pasqua", true, 1, 7, null, null, null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PeriodiTema");
        }
    }
}
