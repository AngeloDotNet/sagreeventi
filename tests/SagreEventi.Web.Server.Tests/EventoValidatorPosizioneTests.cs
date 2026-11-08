using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Validation;

namespace SagreEventi.Web.Server.Tests;

/// <summary>Unit tests of the rules on the optional address and coordinates of <see cref="EventoValidator"/>.</summary>
public class EventoValidatorPosizioneTests
{
    private static EventoModel Evento() => new()
    {
        Id = "val-1",
        NomeEvento = "Sagra",
        CittaEvento = "Verona",
        DataInizioEvento = new DateTime(2026, 7, 1),
        DataFineEvento = new DateTime(2026, 7, 3),
        DescrizioneEvento = "Descrizione",
    };

    private static Dictionary<string, string[]> Valida(EventoModel evento) => EventoValidator.Validate([evento]);

    [Fact]
    public void SenzaIndirizzoENessunaCoordinataEValido()
        => Assert.Empty(Valida(Evento()));

    [Fact]
    public void ConIndirizzoECoordinateValideEValido()
    {
        var evento = Evento();
        evento.Indirizzo = "Via Roma 12";
        evento.Latitudine = 45.4642m;
        evento.Longitudine = 9.19m;

        Assert.Empty(Valida(evento));
    }

    [Theory]
    [InlineData(90, 180)]
    [InlineData(-90, -180)]
    [InlineData(0, 0)]
    public void ICoordinateAgliEstremiSonoValide(double latitudine, double longitudine)
    {
        var evento = Evento();
        evento.Latitudine = (decimal)latitudine;
        evento.Longitudine = (decimal)longitudine;

        Assert.Empty(Valida(evento));
    }

    [Theory]
    [InlineData(90.000001, 0)]
    [InlineData(-90.000001, 0)]
    [InlineData(0, 180.000001)]
    [InlineData(0, -180.000001)]
    [InlineData(1000, 0)]
    public void CoordinateFuoriIntervalloSonoRifiutate(double latitudine, double longitudine)
    {
        var evento = Evento();
        evento.Latitudine = (decimal)latitudine;
        evento.Longitudine = (decimal)longitudine;

        var errori = Valida(evento);

        Assert.NotEmpty(errori);
    }

    [Fact]
    public void LaLatitudineDaSolaERifiutata()
    {
        var evento = Evento();
        evento.Latitudine = 45m;

        var errori = Valida(evento);

        Assert.Contains("eventi[0].Latitudine", errori.Keys);
        Assert.Contains("eventi[0].Longitudine", errori.Keys);
    }

    [Fact]
    public void LaLongitudineDaSolaERifiutata()
    {
        var evento = Evento();
        evento.Longitudine = 9m;

        Assert.NotEmpty(Valida(evento));
    }

    [Fact]
    public void PiuDiSeiDecimaliSonoRifiutati()
    {
        var evento = Evento();
        evento.Latitudine = 45.1234567m;
        evento.Longitudine = 9m;

        Assert.Contains("eventi[0].Latitudine", Valida(evento).Keys);
    }

    [Fact]
    public void GliZeriInCodaOltreISeiDecimaliSonoAmmessi()
    {
        var evento = Evento();
        evento.Latitudine = 45.4642000m;
        evento.Longitudine = 9.1900000m;

        Assert.Empty(Valida(evento));
    }

    [Fact]
    public void UnIndirizzoLungoAlMassimoEValido()
    {
        var evento = Evento();
        evento.Indirizzo = new string('a', EventoModel.MaxIndirizzoLength);

        Assert.Empty(Valida(evento));
    }

    [Fact]
    public void UnIndirizzoTroppoLungoERifiutato()
    {
        var evento = Evento();
        evento.Indirizzo = new string('a', EventoModel.MaxIndirizzoLength + 1);

        Assert.Contains("eventi[0].Indirizzo", Valida(evento).Keys);
    }

    [Theory]
    [InlineData("Via Roma\r\nX-Injected: 1")]
    [InlineData("Via Roma\n12")]
    [InlineData("Via\tRoma")]
    [InlineData("Via Roma\0")]
    public void UnIndirizzoConCaratteriDiControlloERifiutato(string indirizzo)
    {
        var evento = Evento();
        evento.Indirizzo = indirizzo;

        Assert.Contains("eventi[0].Indirizzo", Valida(evento).Keys);
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("x'); DROP TABLE Eventi; --")]
    [InlineData("../../etc/passwd")]
    public void UnTestoOstileNonEUnErroreDiValidazione(string indirizzo)
    {
        // These are stored as plain text and escaped on output: the validator only enforces length and control characters
        var evento = Evento();
        evento.Indirizzo = indirizzo;

        Assert.Empty(Valida(evento));
    }
}
