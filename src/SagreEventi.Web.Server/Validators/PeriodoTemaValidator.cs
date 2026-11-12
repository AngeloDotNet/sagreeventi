using SagreEventi.Shared.Models;

namespace SagreEventi.Web.Server.Validators;

/// <summary>
/// Validation of the seasonal periods sent by an administrator. Minimal APIs do not validate the body on their own.
/// The errors are keyed by field (e.g. <c>periodi[0].giornoInizio</c>), so the form can show them next to the input.
/// </summary>
public static class PeriodoTemaValidator
{
    /// <summary>Maximum number of days a fixed-date period can last, counting the first and the last day.</summary>
    public const int MaxGiorniPeriodo = 60;

    /// <summary>Maximum number of days before Easter Sunday where the Easter period can start.</summary>
    public const int MaxGiorniPrimaPasqua = 14;

    /// <summary>Maximum number of days after Easter Sunday where the Easter period can end.</summary>
    public const int MaxGiorniDopoPasqua = 7;

    /// <summary>
    /// Non-leap reference year used to check the days: 29 February is never accepted as a boundary, because
    /// it would not exist in most years.
    /// </summary>
    private const int AnnoDiRiferimento = 2001;

    /// <summary>Returns the errors of the given periods; empty when they are all valid. The body must contain each period key exactly once.</summary>
    public static Dictionary<string, string[]> Valida(IReadOnlyList<PeriodoTemaModel>? periodi)
    {
        var errori = new Dictionary<string, string[]>();

        if (periodi is null || periodi.Count != ChiaviPeriodiTema.Tutte.Length)
        {
            errori["periodi"] = [$"Servono esattamente {ChiaviPeriodiTema.Tutte.Length} periodi."];
            return errori;
        }

        var chiaviTrovate = periodi.Select(p => p?.Chiave).ToList();
        if (chiaviTrovate.Distinct().Count() != ChiaviPeriodiTema.Tutte.Length
            || ChiaviPeriodiTema.Tutte.Any(chiave => !chiaviTrovate.Contains(chiave)))
        {
            errori["periodi"] = ["Ogni periodo deve comparire una sola volta, con la sua chiave."];
            return errori;
        }

        for (var i = 0; i < periodi.Count; i++)
        {
            var periodo = periodi[i];
            if (periodo.Chiave == ChiaviPeriodiTema.Pasqua)
            {
                ValidaPasqua(periodo, i, errori);
            }
            else
            {
                ValidaDateFisse(periodo, i, errori);
            }
        }

        return errori;
    }

    /// <summary>Easter is a rule: only the offsets are set, and they must be inside their limits.</summary>
    private static void ValidaPasqua(PeriodoTemaModel periodo, int indice, Dictionary<string, string[]> errori)
    {
        var prefisso = $"periodi[{indice}]";
        RifiutaSeValorizzati(periodo.GiornoInizio, $"{prefisso}.giornoInizio", errori);
        RifiutaSeValorizzati(periodo.MeseInizio, $"{prefisso}.meseInizio", errori);
        RifiutaSeValorizzati(periodo.GiornoFine, $"{prefisso}.giornoFine", errori);
        RifiutaSeValorizzati(periodo.MeseFine, $"{prefisso}.meseFine", errori);

        ValidaIntervallo(periodo.GiorniPrimaPasqua, 0, MaxGiorniPrimaPasqua, $"{prefisso}.giorniPrimaPasqua", errori);
        ValidaIntervallo(periodo.GiorniDopoPasqua, 0, MaxGiorniDopoPasqua, $"{prefisso}.giorniDopoPasqua", errori);
    }

    /// <summary>A fixed-date period needs a real start and end day, and must not last more than the limit.</summary>
    private static void ValidaDateFisse(PeriodoTemaModel periodo, int indice, Dictionary<string, string[]> errori)
    {
        var prefisso = $"periodi[{indice}]";
        RifiutaSeValorizzati(periodo.GiorniPrimaPasqua, $"{prefisso}.giorniPrimaPasqua", errori);
        RifiutaSeValorizzati(periodo.GiorniDopoPasqua, $"{prefisso}.giorniDopoPasqua", errori);

        var inizio = ValidaData(periodo.GiornoInizio, periodo.MeseInizio, $"{prefisso}.giornoInizio", $"{prefisso}.meseInizio", errori);
        var fine = ValidaData(periodo.GiornoFine, periodo.MeseFine, $"{prefisso}.giornoFine", $"{prefisso}.meseFine", errori);
        if (inizio is null || fine is null)
        {
            return;
        }

        // Counted inside the reference year, so a period may cross the end of the year (Christmas) and still be measured
        var giorniDiFerma = fine.Value.DayNumber - inizio.Value.DayNumber;
        if (giorniDiFerma < 0)
        {
            giorniDiFerma += 365;
        }

        if (giorniDiFerma + 1 > MaxGiorniPeriodo)
        {
            errori[$"{prefisso}.giornoFine"] = [$"Il periodo non può durare più di {MaxGiorniPeriodo} giorni."];
        }
    }

    /// <summary>Checks a day and a month together and returns the date in the reference year, or null if one is missing or wrong.</summary>
    private static DateOnly? ValidaData(int? giorno, int? mese, string campoGiorno, string campoMese, Dictionary<string, string[]> errori)
    {
        if (mese is null || mese < 1 || mese > 12)
        {
            errori[campoMese] = ["Il mese deve essere compreso tra 1 e 12."];
            return null;
        }

        if (giorno is null || giorno < 1 || giorno > DateTime.DaysInMonth(AnnoDiRiferimento, mese.Value))
        {
            errori[campoGiorno] = ["Il giorno non esiste in questo mese."];
            return null;
        }

        return new DateOnly(AnnoDiRiferimento, mese.Value, giorno.Value);
    }

    /// <summary>Required integer inside a closed range.</summary>
    private static void ValidaIntervallo(int? valore, int minimo, int massimo, string campo, Dictionary<string, string[]> errori)
    {
        if (valore is null || valore < minimo || valore > massimo)
        {
            errori[campo] = [$"Il valore deve essere compreso tra {minimo} e {massimo}."];
        }
    }

    /// <summary>A field that does not apply to the period must be empty, so a stale value is not kept silently.</summary>
    private static void RifiutaSeValorizzati(int? valore, string campo, Dictionary<string, string[]> errori)
    {
        if (valore is not null)
        {
            errori[campo] = ["Campo non previsto per questo periodo."];
        }
    }
}
