using SagreEventi.Shared.Models;

namespace SagreEventi.Web.Server.Tests;

/// <summary>Builders of valid seasonal periods, shared by the validator unit tests and the endpoint integration tests.</summary>
public static class PeriodiTemaTestData
{
    /// <summary>Easter period with the given offsets (7 days before, 1 after by default, as the seed).</summary>
    public static PeriodoTemaModel Pasqua(int? prima = 7, int? dopo = 1, bool attivo = true)
        => new(ChiaviPeriodiTema.Pasqua, attivo, null, null, null, null, prima, dopo);

    /// <summary>Fixed-date period with the given start and end (day and month).</summary>
    public static PeriodoTemaModel Fisso(string chiave, int giornoInizio, int meseInizio, int giornoFine, int meseFine, bool attivo = true)
        => new(chiave, attivo, giornoInizio, meseInizio, giornoFine, meseFine, null, null);

    /// <summary>The four periods with the seed values, all valid.</summary>
    public static List<PeriodoTemaModel> Valido()
        =>
        [
            Pasqua(),
            Fisso(ChiaviPeriodiTema.Ferragosto, 1, 8, 20, 8),
            Fisso(ChiaviPeriodiTema.Halloween, 24, 10, 31, 10),
            Fisso(ChiaviPeriodiTema.Natale, 1, 12, 6, 1),
        ];
}
