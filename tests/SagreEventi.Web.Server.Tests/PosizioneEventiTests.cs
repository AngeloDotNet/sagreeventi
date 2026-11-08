using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Models.Entities;
using SagreEventi.Web.Server.Models.Services.Infrastructure;

namespace SagreEventi.Web.Server.Tests;

/// <summary>
/// Integration tests (real database) of the optional address and coordinates of an event: saving, public visibility,
/// protection against changes by users without permissions, and rejection of hostile input.
/// </summary>
public class PosizioneEventiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly DateTime Passato = new(2000, 1, 1);

    private static EventoModel NuovoEvento(string id) => new()
    {
        Id = id,
        NomeEvento = "Sagra " + id,
        CittaEvento = "Verona",
        DataInizioEvento = new DateTime(2026, 7, 1),
        DataFineEvento = new DateTime(2026, 7, 3),
        DescrizioneEvento = "Descrizione",
        DataOraUltimaModifica = DateTime.UtcNow.AddMinutes(-5),
    };

    private async Task<Evento?> LeggiDalDbAsync(string id)
    {
        using var scope = factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().Eventi.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
    }

    private async Task ImpostaStatoAsync(string id, StatoModerazione stato, bool concluso = false)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var evento = await db.Eventi.SingleAsync(x => x.Id == id);
        evento.Stato = stato;
        evento.EventoConcluso = concluso;
        evento.DataOraUltimaModifica = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    private static string Url(DateTime since) => $"/api/Eventi/GetEventi?since={since:yyyy-MM-ddTHH:mm:ss}";

    // Raw JSON body, to send values that the typed model would not let us express (strings instead of numbers, overflow, ...)
    private static StringContent Corpo(string id, string campiExtra)
        => new($$"""[{"Id":"{{id}}","NomeEvento":"Sagra","CittaEvento":"Verona","DescrizioneEvento":"D","DataInizioEvento":"2026-07-01T00:00:00","DataFineEvento":"2026-07-03T00:00:00",{{campiExtra}}}]""",
            Encoding.UTF8, "application/json");

    [Fact]
    public async Task Put_SalvaIndirizzoECoordinateConLoSpazioPulito()
    {
        var evento = NuovoEvento("pos-salva");
        evento.Indirizzo = "  Via Roma 12  ";
        evento.Latitudine = 45.464203m;
        evento.Longitudine = 9.19m;

        var response = await factory.CreateClient().PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var salvato = await LeggiDalDbAsync("pos-salva");
        Assert.Equal("Via Roma 12", salvato!.Indirizzo);
        Assert.Equal(45.464203m, salvato.Latitudine);
        Assert.Equal(9.19m, salvato.Longitudine);
    }

    [Fact]
    public async Task Put_SenzaPosizioneSalvaNull()
    {
        var response = await factory.CreateClient().PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { NuovoEvento("pos-assente") });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var salvato = await LeggiDalDbAsync("pos-assente");
        Assert.Null(salvato!.Indirizzo);
        Assert.Null(salvato.Latitudine);
        Assert.Null(salvato.Longitudine);
    }

    [Fact]
    public async Task Put_UnIndirizzoConTestoOstileEMemorizzatoComeTesto()
    {
        var evento = NuovoEvento("pos-ostile");
        evento.Indirizzo = "<script>alert(1)</script> x'); DROP TABLE Eventi; --";

        var response = await factory.CreateClient().PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(evento.Indirizzo, (await LeggiDalDbAsync("pos-ostile"))!.Indirizzo);
    }

    [Fact]
    public async Task Get_RestituisceLaPosizioneDiUnEventoApprovato()
    {
        var client = factory.CreateClient();
        var evento = NuovoEvento("pos-pubblico");
        evento.Indirizzo = "Via Roma 12";
        evento.Latitudine = 45.4642m;
        evento.Longitudine = 9.19m;
        await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });
        await ImpostaStatoAsync("pos-pubblico", StatoModerazione.Approvato);

        var eventi = await client.GetFromJsonAsync<List<EventoModel>>(Url(Passato));

        var restituito = Assert.Single(eventi!, e => e.Id == "pos-pubblico");
        Assert.Equal("Via Roma 12", restituito.Indirizzo);
        Assert.Equal(45.4642m, restituito.Latitudine);
        Assert.Equal(9.19m, restituito.Longitudine);
    }

    [Fact]
    public async Task Get_UnEventoInAttesaConPosizioneNonEPubblico()
    {
        var client = factory.CreateClient();
        var evento = NuovoEvento("pos-in-attesa");
        evento.Latitudine = 45m;
        evento.Longitudine = 9m;
        await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });

        var eventi = await client.GetFromJsonAsync<List<EventoModel>>(Url(Passato));

        Assert.DoesNotContain(eventi!, e => e.Id == "pos-in-attesa");
    }

    [Fact]
    public async Task Get_UnEventoRitiratoNonRivelaLaPosizione()
    {
        var client = factory.CreateClient();
        var evento = NuovoEvento("pos-ritirato");
        evento.Indirizzo = "Via Segreta 1";
        evento.Latitudine = 45m;
        evento.Longitudine = 9m;
        await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });
        await ImpostaStatoAsync("pos-ritirato", StatoModerazione.Rifiutato, concluso: true);

        var eventi = await client.GetFromJsonAsync<List<EventoModel>>(Url(Passato));

        var lapide = Assert.Single(eventi!, e => e.Id == "pos-ritirato");
        Assert.Null(lapide.Indirizzo);
        Assert.Null(lapide.Latitudine);
        Assert.Null(lapide.Longitudine);
    }

    [Fact]
    public async Task Put_AnonimoNonCambiaLaPosizioneDiUnEventoEsistente()
    {
        var client = factory.CreateClient();
        var originale = NuovoEvento("pos-anon");
        originale.Latitudine = 45m;
        originale.Longitudine = 9m;
        await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { originale });

        var modificato = NuovoEvento("pos-anon");
        modificato.DataOraUltimaModifica = DateTime.UtcNow.AddMinutes(5);
        modificato.Latitudine = 10m;
        modificato.Longitudine = 10m;
        var response = await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { modificato });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var salvato = await LeggiDalDbAsync("pos-anon");
        Assert.Equal(45m, salvato!.Latitudine);
        Assert.Equal(9m, salvato.Longitudine);
    }

    [Fact]
    public async Task Put_AnonimoNonCambiaNeppureSoloLIndirizzo()
    {
        var client = factory.CreateClient();
        var originale = NuovoEvento("pos-anon-ind");
        originale.Indirizzo = "Via Roma 12";
        await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { originale });

        var modificato = NuovoEvento("pos-anon-ind");
        modificato.DataOraUltimaModifica = DateTime.UtcNow.AddMinutes(5);
        modificato.Indirizzo = "Via Altrove 99";
        var response = await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { modificato });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("Via Roma 12", (await LeggiDalDbAsync("pos-anon-ind"))!.Indirizzo);
    }

    [Fact]
    public async Task Put_ReinvioIdenticoConPosizioneDaAnonimoRestaOk()
    {
        var client = factory.CreateClient();
        var evento = NuovoEvento("pos-retry");
        evento.Indirizzo = "  Via Roma 12 ";
        evento.Latitudine = 45.4642m;
        evento.Longitudine = 9.19m;
        (await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento })).EnsureSuccessStatusCode();

        var risposta = await client.PutAsJsonAsync("/api/Eventi/UpdateEventi", new[] { evento });

        Assert.Equal(HttpStatusCode.OK, risposta.StatusCode);
    }

    [Theory]
    [InlineData("\"Latitudine\":91,\"Longitudine\":0")]
    [InlineData("\"Latitudine\":-91,\"Longitudine\":0")]
    [InlineData("\"Latitudine\":0,\"Longitudine\":181")]
    [InlineData("\"Latitudine\":0,\"Longitudine\":-181")]
    [InlineData("\"Latitudine\":45")]
    [InlineData("\"Longitudine\":9")]
    [InlineData("\"Latitudine\":45.1234567,\"Longitudine\":9")]
    [InlineData("\"Latitudine\":\"abc\",\"Longitudine\":9")]
    [InlineData("\"Latitudine\":\"45; DROP TABLE Eventi\",\"Longitudine\":9")]
    [InlineData("\"Latitudine\":1e999,\"Longitudine\":9")]
    [InlineData("\"Latitudine\":[45],\"Longitudine\":9")]
    [InlineData("\"Latitudine\":{\"x\":1},\"Longitudine\":9")]
    [InlineData("\"Indirizzo\":\"Via Roma\\r\\nX-Injected: 1\"")]
    [InlineData("\"Indirizzo\":\"Via\\u0000Roma\"")]
    [InlineData("\"Indirizzo\":12345")]
    public async Task Put_PosizioneOstileDa400SenzaSalvareESenzaDettagliInterni(string campi)
    {
        var id = "pos-ostile-" + Guid.NewGuid().ToString("N");

        var response = await factory.CreateClient().PutAsync("/api/Eventi/UpdateEventi", Corpo(id, campi));
        var testo = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.DoesNotContain("   at ", testo);
        Assert.DoesNotContain("SagreEventi.Web.Server", testo);
        Assert.Null(await LeggiDalDbAsync(id));
    }

    [Fact]
    public async Task Put_UnIndirizzoTroppoLungoDa400()
    {
        var id = "pos-lungo-" + Guid.NewGuid().ToString("N");

        var response = await factory.CreateClient().PutAsync("/api/Eventi/UpdateEventi",
            Corpo(id, "\"Indirizzo\":\"" + new string('a', EventoModel.MaxIndirizzoLength + 1) + "\""));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(await LeggiDalDbAsync(id));
    }

    [Fact]
    public async Task Put_ICampiDiPosizioneAgliEstremiVengonoAccettati()
    {
        var id = "pos-estremi-" + Guid.NewGuid().ToString("N");

        var response = await factory.CreateClient().PutAsync("/api/Eventi/UpdateEventi",
            Corpo(id, "\"Latitudine\":90,\"Longitudine\":-180"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var salvato = await LeggiDalDbAsync(id);
        Assert.Equal(90m, salvato!.Latitudine);
        Assert.Equal(-180m, salvato.Longitudine);
    }
}
