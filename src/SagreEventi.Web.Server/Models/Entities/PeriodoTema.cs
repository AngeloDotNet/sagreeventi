namespace SagreEventi.Web.Server.Models.Entities;

/// <summary>
/// Row of the <c>PeriodiTema</c> table: the period in which a seasonal theme is offered. There is one row per period
/// (<c>pasqua</c>, <c>ferragosto</c>, <c>halloween</c>, <c>natale</c>); the Christmas row covers both Christmas themes.
/// Easter is a rule (days before and after Easter Sunday, computed each year); the other periods are a day and month
/// range, which may cross the end of the year.
/// </summary>
public class PeriodoTema
{
    /// <summary>Stable key of the period, also the primary key (e.g. <c>natale</c>).</summary>
    public string Chiave { get; set; } = string.Empty;

    /// <summary>Whether the period is enabled; a disabled period offers no seasonal theme on any date.</summary>
    public bool Attivo { get; set; } = true;

    /// <summary>First day of a fixed-date period (1–31); null for the Easter rule.</summary>
    public int? GiornoInizio { get; set; }

    /// <summary>First month of a fixed-date period (1–12); null for the Easter rule.</summary>
    public int? MeseInizio { get; set; }

    /// <summary>Last day of a fixed-date period (1–31); null for the Easter rule.</summary>
    public int? GiornoFine { get; set; }

    /// <summary>Last month of a fixed-date period (1–12); null for the Easter rule.</summary>
    public int? MeseFine { get; set; }

    /// <summary>Days before Easter Sunday where the period starts; set only for the Easter rule.</summary>
    public int? GiorniPrimaPasqua { get; set; }

    /// <summary>Days after Easter Sunday where the period ends; set only for the Easter rule.</summary>
    public int? GiorniDopoPasqua { get; set; }
}
