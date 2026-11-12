namespace SagreEventi.Shared.Models;

/// <summary>
/// Configurable period of a seasonal theme, as exchanged by <c>/api/temi/periodi</c>. Fixed-date periods set the day and
/// month of start and end; the Easter period sets the days before and after Easter Sunday instead. Fields that do not
/// apply to the period are null.
/// </summary>
/// <param name="Chiave">Stable key of the period, one of <see cref="ChiaviPeriodiTema"/>.</param>
/// <param name="Attivo">Whether the period is enabled. A missing value is read as disabled.</param>
/// <param name="GiornoInizio">First day of a fixed-date period (1–31).</param>
/// <param name="MeseInizio">First month of a fixed-date period (1–12).</param>
/// <param name="GiornoFine">Last day of a fixed-date period (1–31).</param>
/// <param name="MeseFine">Last month of a fixed-date period (1–12).</param>
/// <param name="GiorniPrimaPasqua">Days before Easter Sunday where the Easter period starts (0–14).</param>
/// <param name="GiorniDopoPasqua">Days after Easter Sunday where the Easter period ends (0–7).</param>
public sealed record PeriodoTemaModel(
    string Chiave,
    bool Attivo,
    int? GiornoInizio,
    int? MeseInizio,
    int? GiornoFine,
    int? MeseFine,
    int? GiorniPrimaPasqua,
    int? GiorniDopoPasqua);

/// <summary>Keys of the configurable periods. The Christmas period also covers the dark Christmas theme.</summary>
public static class ChiaviPeriodiTema
{
    /// <summary>Easter, computed by rule.</summary>
    public const string Pasqua = "pasqua";
    /// <summary>Ferragosto (mid-August).</summary>
    public const string Ferragosto = "ferragosto";
    /// <summary>Halloween.</summary>
    public const string Halloween = "halloween";
    /// <summary>Christmas, for both the light and the dark Christmas themes.</summary>
    public const string Natale = "natale";

    /// <summary>All the period keys; a PUT must contain each of them exactly once.</summary>
    public static readonly string[] Tutte = [Pasqua, Ferragosto, Halloween, Natale];
}
