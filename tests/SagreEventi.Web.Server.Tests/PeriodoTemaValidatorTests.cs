using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Validators;
using static SagreEventi.Web.Server.Tests.PeriodiTemaTestData;

namespace SagreEventi.Web.Server.Tests;

/// <summary>Unit tests of <see cref="PeriodoTemaValidator"/>: no database, no HTTP.</summary>
public class PeriodoTemaValidatorTests
{
    [Fact]
    public void Valido_NessunErrore()
    {
        Assert.Empty(PeriodoTemaValidator.Valida(Valido()));
    }

    [Fact]
    public void ListaNulla_ErroreSulleChiavi()
    {
        var errori = PeriodoTemaValidator.Valida(null);

        Assert.Contains("periodi", errori.Keys);
    }

    [Fact]
    public void PeriodiMancanti_Errore()
    {
        var periodi = Valido().Take(3).ToList();

        Assert.Contains("periodi", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void PeriodiExtra_Errore()
    {
        var periodi = Valido();
        periodi.Add(Fisso("carnevale", 1, 2, 5, 2));

        Assert.Contains("periodi", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void ChiaveDuplicata_Errore()
    {
        var periodi = Valido();
        periodi[3] = Fisso(ChiaviPeriodiTema.Halloween, 1, 12, 6, 1);

        Assert.Contains("periodi", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void ChiaveSconosciuta_Errore()
    {
        var periodi = Valido();
        periodi[3] = Fisso("carnevale", 1, 12, 6, 1);

        Assert.Contains("periodi", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void ElementoNullo_ErroreSenzaEccezione()
    {
        var periodi = Valido();
        periodi[3] = null!;

        Assert.Contains("periodi", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(14, 7)]
    public void Pasqua_AiLimiti_Valida(int prima, int dopo)
    {
        var periodi = Valido();
        periodi[0] = Pasqua(prima, dopo);

        Assert.Empty(PeriodoTemaValidator.Valida(periodi));
    }

    [Theory]
    [InlineData(-1, 1, "periodi[0].giorniPrimaPasqua")]
    [InlineData(15, 1, "periodi[0].giorniPrimaPasqua")]
    [InlineData(7, -1, "periodi[0].giorniDopoPasqua")]
    [InlineData(7, 8, "periodi[0].giorniDopoPasqua")]
    [InlineData(null, 1, "periodi[0].giorniPrimaPasqua")]
    [InlineData(7, null, "periodi[0].giorniDopoPasqua")]
    public void Pasqua_FuoriLimite_Errore(int? prima, int? dopo, string campo)
    {
        var periodi = Valido();
        periodi[0] = Pasqua(prima, dopo);

        Assert.Contains(campo, PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void Pasqua_ConDateValorizzate_Errore()
    {
        var periodi = Valido();
        periodi[0] = periodi[0] with { GiornoInizio = 1, MeseInizio = 4 };

        Assert.Contains("periodi[0].giornoInizio", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void DateFisse_ConOffsetPasqua_Errore()
    {
        var periodi = Valido();
        periodi[1] = periodi[1] with { GiorniPrimaPasqua = 3 };

        Assert.Contains("periodi[1].giorniPrimaPasqua", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Theory]
    [InlineData(31, 4, "periodi[1].giornoInizio")]
    [InlineData(0, 8, "periodi[1].giornoInizio")]
    [InlineData(1, 13, "periodi[1].meseInizio")]
    [InlineData(1, 0, "periodi[1].meseInizio")]
    public void DateFisse_GiornoOMeseInesistenti_Errore(int giorno, int mese, string campo)
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, giorno, mese, 20, 8);

        Assert.Contains(campo, PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void DateFisse_29Febbraio_NonAmmessoComeEstremo()
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 1, 2, 29, 2);

        Assert.Contains("periodi[1].giornoFine", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void DateFisse_StessoGiorno_Valido()
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 15, 8, 15, 8);

        Assert.Empty(PeriodoTemaValidator.Valida(periodi));
    }

    [Fact]
    public void DateFisse_DurataDi60Giorni_Valida()
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 1, 8, 29, 9);

        Assert.Empty(PeriodoTemaValidator.Valida(periodi));
    }

    [Fact]
    public void DateFisse_DurataDi61Giorni_Errore()
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 1, 8, 30, 9);

        Assert.Contains("periodi[1].giornoFine", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void Natale_AttraversoCapodanno_DurataAlLimite_Valida()
    {
        var periodi = Valido();
        periodi[3] = Fisso(ChiaviPeriodiTema.Natale, 1, 12, 29, 1);

        Assert.Empty(PeriodoTemaValidator.Valida(periodi));
    }

    [Fact]
    public void Natale_AttraversoCapodanno_TroppoLungo_Errore()
    {
        var periodi = Valido();
        periodi[3] = Fisso(ChiaviPeriodiTema.Natale, 1, 12, 30, 1);

        Assert.Contains("periodi[3].giornoFine", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void Natale_QuasiTuttoAnno_Errore()
    {
        var periodi = Valido();
        periodi[3] = Fisso(ChiaviPeriodiTema.Natale, 2, 12, 1, 12);

        Assert.Contains("periodi[3].giornoFine", PeriodoTemaValidator.Valida(periodi).Keys);
    }

    [Fact]
    public void PeriodoDisattivato_StessiControlli()
    {
        var periodi = Valido();
        periodi[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 31, 4, 20, 8, attivo: false);

        Assert.Contains("periodi[1].giornoInizio", PeriodoTemaValidator.Valida(periodi).Keys);
    }
}
