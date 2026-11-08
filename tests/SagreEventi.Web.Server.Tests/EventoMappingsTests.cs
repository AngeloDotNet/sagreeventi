using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Models.Entities;
using SagreEventi.Web.Server.Models.Mapping;

namespace SagreEventi.Web.Server.Tests;

public class EventoMappingsTests
{
    private static EventoModel Dto() => new()
    {
        Id = "m-1",
        NomeEvento = "Sagra",
        CittaEvento = "Verona",
        DataInizioEvento = new DateTime(2026, 7, 1),
        DataFineEvento = new DateTime(2026, 7, 3),
        DescrizioneEvento = "Descrizione",
        DataOraUltimaModifica = new DateTime(2026, 6, 1, 10, 0, 0, DateTimeKind.Utc),
    };

    [Fact]
    public void ToEntity_PartireDaUnDtoLasciaLoStatoInAttesa()
    {
        var dto = Dto();
        dto.Stato = StatoModerazione.Approvato;
        dto.MotivoRifiuto = "inviato dal client";

        var evento = dto.ToEntity();

        Assert.Equal(StatoModerazione.InAttesa, evento.Stato);
        Assert.Null(evento.MotivoRifiuto);
    }

    [Fact]
    public void ApplyFrom_NonCopiaStatoMotivoERevisione()
    {
        var evento = new Evento { Id = "m-1", Stato = StatoModerazione.Rifiutato, MotivoRifiuto = "spam", RevisionatoDa = "ed@test.local", DataRevisione = DateTime.UtcNow };
        var dto = Dto();
        dto.Stato = StatoModerazione.Approvato;
        dto.MotivoRifiuto = null;

        evento.ApplyFrom(dto);

        Assert.Equal(StatoModerazione.Rifiutato, evento.Stato);
        Assert.Equal("spam", evento.MotivoRifiuto);
        Assert.Equal("ed@test.local", evento.RevisionatoDa);
        Assert.NotNull(evento.DataRevisione);
    }

    [Fact]
    public void ApplyFrom_NonCopiaEventoConcluso()
    {
        var evento = new Evento { Id = "m-1", EventoConcluso = false };
        var dto = Dto();
        dto.EventoConcluso = true;

        evento.ApplyFrom(dto);

        Assert.False(evento.EventoConcluso);
        Assert.False(dto.ToEntity().EventoConcluso);
    }

    [Fact]
    public void ApplyFrom_CopiaIndirizzoECoordinateEPulisceLoSpazio()
    {
        var evento = new Evento { Id = "m-1" };
        var dto = Dto();
        dto.Indirizzo = "  Via Roma 12  ";
        dto.Latitudine = 45.4642m;
        dto.Longitudine = 9.19m;

        evento.ApplyFrom(dto);

        Assert.Equal("Via Roma 12", evento.Indirizzo);
        Assert.Equal(45.4642m, evento.Latitudine);
        Assert.Equal(9.19m, evento.Longitudine);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ApplyFrom_UnIndirizzoVuotoDiventaNull(string? indirizzo)
    {
        var evento = new Evento { Id = "m-1", Indirizzo = "Via vecchia" };
        var dto = Dto();
        dto.Indirizzo = indirizzo;

        evento.ApplyFrom(dto);

        Assert.Null(evento.Indirizzo);
    }

    [Fact]
    public void ApplyFrom_SenzaCoordinateAzzeraQuelleEsistenti()
    {
        var evento = new Evento { Id = "m-1", Latitudine = 45m, Longitudine = 9m };

        evento.ApplyFrom(Dto());

        Assert.Null(evento.Latitudine);
        Assert.Null(evento.Longitudine);
    }

    [Fact]
    public void ToDto_ProiettaIndirizzoECoordinate()
    {
        var evento = Dto().ToEntity();
        evento.Indirizzo = "Via Roma 12";
        evento.Latitudine = 45.4642m;
        evento.Longitudine = 9.19m;

        var dto = EventoMappings.ToDto.Compile()(evento);

        Assert.Equal("Via Roma 12", dto.Indirizzo);
        Assert.Equal(45.4642m, dto.Latitudine);
        Assert.Equal(9.19m, dto.Longitudine);
    }

    [Fact]
    public void ToDtoPubblico_MostraLaPosizioneSoloSeApprovato()
    {
        var evento = Dto().ToEntity();
        evento.Indirizzo = "Via Roma 12";
        evento.Latitudine = 45.4642m;
        evento.Longitudine = 9.19m;

        evento.Stato = StatoModerazione.Approvato;
        var approvato = EventoMappings.ToDtoPubblico.Compile()(evento);
        evento.Stato = StatoModerazione.Rifiutato;
        var ritirato = EventoMappings.ToDtoPubblico.Compile()(evento);

        Assert.Equal("Via Roma 12", approvato.Indirizzo);
        Assert.Equal(45.4642m, approvato.Latitudine);
        Assert.Null(ritirato.Indirizzo);
        Assert.Null(ritirato.Latitudine);
        Assert.Null(ritirato.Longitudine);
    }

    [Fact]
    public void ToDto_ProiettaStatoEMotivo()
    {
        var evento = Dto().ToEntity();
        evento.Stato = StatoModerazione.Rifiutato;
        evento.MotivoRifiuto = "duplicato";

        var dto = EventoMappings.ToDto.Compile()(evento);

        Assert.Equal(StatoModerazione.Rifiutato, dto.Stato);
        Assert.Equal("duplicato", dto.MotivoRifiuto);
    }
}
