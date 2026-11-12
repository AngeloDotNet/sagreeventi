using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Models.Identity;
using static SagreEventi.Web.Server.Tests.PeriodiTemaTestData;

namespace SagreEventi.Web.Server.Tests;

/// <summary>
/// Endpoint <c>/api/temi/periodi</c>: public read, Admin-only write, validation, malicious input and overposting.
/// Runs on the SQLite test database of <see cref="ApiFactory"/>, as the other integration tests of the project.
/// </summary>
public class TemiApiTests : IClassFixture<ApiFactory>
{
    private const string Url = "/api/temi/periodi";
    private const string Password = "Passw0rd!Test";
    private const string EditorEmail = "editor-temi-tests@test.local";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly Dictionary<(ApiFactory, string), string> Token = [];
    private static readonly SemaphoreSlim LoginLock = new(1, 1);

    private readonly ApiFactory factory;

    public TemiApiTests(ApiFactory factory)
    {
        this.factory = factory;
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("accessToken").GetString() ?? throw new InvalidOperationException("accessToken mancante");
    }

    // Login is rate limited: each user's token is obtained once per factory
    private async Task<HttpClient> ConTokenAsync(string email, string password)
    {
        var client = factory.CreateClient();
        await LoginLock.WaitAsync();
        try
        {
            if (!Token.TryGetValue((factory, email), out var token))
            {
                token = await LoginAsync(client, email, password);
                Token[(factory, email)] = token;
            }

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        finally
        {
            LoginLock.Release();
        }

        return client;
    }

    private Task<HttpClient> ComeAdminAsync() => ConTokenAsync(ApiFactory.AdminEmail, ApiFactory.AdminPassword);

    private async Task<HttpClient> ComeEditorAsync()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            if (await userManager.FindByEmailAsync(EditorEmail) is null)
            {
                var utente = new ApplicationUser { UserName = EditorEmail, Email = EditorEmail, EmailConfirmed = true };
                Assert.True((await userManager.CreateAsync(utente, Password)).Succeeded);
                Assert.True((await userManager.AddToRoleAsync(utente, Ruoli.Editor)).Succeeded);
            }
        }

        return await ConTokenAsync(EditorEmail, Password);
    }

    private static async Task<List<PeriodoTemaModel>> LeggiAsync(HttpClient client)
        => await client.GetFromJsonAsync<List<PeriodoTemaModel>>(Url, Json) ?? throw new InvalidOperationException("Risposta vuota");

    private static StringContent Corpo(string json) => new(json, Encoding.UTF8, "application/json");

    [Fact]
    public async Task Lettura_Anonima_RestituisceIPeriodiDelSeed()
    {
        var response = await factory.CreateClient().GetAsync(Url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var periodi = await response.Content.ReadFromJsonAsync<List<PeriodoTemaModel>>(Json);
        Assert.NotNull(periodi);
        Assert.Equal(ChiaviPeriodiTema.Tutte.OrderBy(c => c), periodi.Select(p => p.Chiave).OrderBy(c => c));

        var ferragosto = Assert.Single(periodi, p => p.Chiave == ChiaviPeriodiTema.Ferragosto);
        Assert.True(ferragosto.Attivo);
        Assert.Equal(1, ferragosto.GiornoInizio);
        Assert.Equal(8, ferragosto.MeseInizio);
        Assert.Equal(20, ferragosto.GiornoFine);
        Assert.Equal(8, ferragosto.MeseFine);

        var pasqua = Assert.Single(periodi, p => p.Chiave == ChiaviPeriodiTema.Pasqua);
        Assert.Equal(7, pasqua.GiorniPrimaPasqua);
        Assert.Equal(1, pasqua.GiorniDopoPasqua);
    }

    [Fact]
    public async Task Scrittura_Anonima_NonAutorizzata()
    {
        var body = JsonSerializer.Serialize(Valido(), Json);

        var response = await factory.CreateClient().PutAsync(Url, Corpo(body));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Scrittura_Editor_Vietata()
    {
        var body = JsonSerializer.Serialize(Valido(), Json);

        var response = await (await ComeEditorAsync()).PutAsync(Url, Corpo(body));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Salva_RispostaSenzaCache_ELetturaAggiornata()
    {
        var client = await ComeAdminAsync();
        var originali = await LeggiAsync(client);
        try
        {
            var modificati = Valido();
            modificati[1] = Fisso(ChiaviPeriodiTema.Ferragosto, 10, 8, 25, 8, attivo: false);

            var response = await client.PutAsJsonAsync(Url, modificati, Json);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.True(response.Headers.CacheControl?.NoStore == true);
            var salvati = await response.Content.ReadFromJsonAsync<List<PeriodoTemaModel>>(Json);
            var ferragosto = Assert.Single(salvati!, p => p.Chiave == ChiaviPeriodiTema.Ferragosto);
            Assert.False(ferragosto.Attivo);
            Assert.Equal(10, ferragosto.GiornoInizio);
            Assert.Equal(8, ferragosto.MeseInizio);
            Assert.Equal(25, ferragosto.GiornoFine);
            Assert.Equal(8, ferragosto.MeseFine);

            // A new read after the write must not return the cached previous value
            var letti = await LeggiAsync(factory.CreateClient());
            Assert.Contains(letti, p => p.Chiave == ChiaviPeriodiTema.Ferragosto && !p.Attivo && p.GiornoInizio == 10);
        }
        finally
        {
            await client.PutAsJsonAsync(Url, originali, Json);
        }
    }

    [Fact]
    public async Task Admin_ValoriNonValidi_400ConErroriPerCampo()
    {
        var client = await ComeAdminAsync();
        var nonValidi = Valido();
        nonValidi[0] = Pasqua(prima: 15, dopo: 1);

        var response = await client.PutAsJsonAsync(Url, nonValidi, Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("errors").TryGetProperty("periodi[0].giorniPrimaPasqua", out _));
    }

    [Theory]
    [InlineData("{\"non\":\"una lista\"}")]
    [InlineData("[{\"chiave\":\"pasqua\"")]
    [InlineData("")]
    public async Task Admin_JsonMalformatoOTipiErrati_400(string corpo)
    {
        var response = await (await ComeAdminAsync()).PutAsync(Url, Corpo(corpo));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("pasqua' OR '1'='1")]
    [InlineData("../../etc/passwd")]
    [InlineData("pasqua\r\nX-Injected: 1")]
    public async Task Admin_ChiaveMalevola_Rifiutata(string chiave)
    {
        var periodi = Valido();
        periodi[1] = periodi[1] with { Chiave = chiave };

        var response = await (await ComeAdminAsync()).PutAsJsonAsync(Url, periodi, Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Admin_OverPosting_CampiExtraIgnorati()
    {
        // Fields that the client must not control (role, owner) are not part of the contract and are ignored
        var client = await ComeAdminAsync();
        var originali = await LeggiAsync(client);
        try
        {
            var corpo = """
                [
                  {"chiave":"pasqua","attivo":true,"giorniPrimaPasqua":7,"giorniDopoPasqua":1,"ruolo":"Admin","id":"x"},
                  {"chiave":"ferragosto","attivo":true,"giornoInizio":1,"meseInizio":8,"giornoFine":20,"meseFine":8,"ruolo":"Admin"},
                  {"chiave":"halloween","attivo":true,"giornoInizio":24,"meseInizio":10,"giornoFine":31,"meseFine":10},
                  {"chiave":"natale","attivo":true,"giornoInizio":1,"meseInizio":12,"giornoFine":6,"meseFine":1,"isAdmin":true}
                ]
                """;

            var response = await client.PutAsync(Url, Corpo(corpo));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(4, (await LeggiAsync(client)).Count);
        }
        finally
        {
            await client.PutAsJsonAsync(Url, originali, Json);
        }
    }

    [Fact]
    public async Task Admin_AttivoMancante_LettoComeDisattivato()
    {
        var client = await ComeAdminAsync();
        var originali = await LeggiAsync(client);
        try
        {
            var corpo = """
                [
                  {"chiave":"pasqua","giorniPrimaPasqua":7,"giorniDopoPasqua":1},
                  {"chiave":"ferragosto","attivo":true,"giornoInizio":1,"meseInizio":8,"giornoFine":20,"meseFine":8},
                  {"chiave":"halloween","attivo":true,"giornoInizio":24,"meseInizio":10,"giornoFine":31,"meseFine":10},
                  {"chiave":"natale","attivo":true,"giornoInizio":1,"meseInizio":12,"giornoFine":6,"meseFine":1}
                ]
                """;

            var response = await client.PutAsync(Url, Corpo(corpo));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var pasqua = Assert.Single(await LeggiAsync(client), p => p.Chiave == ChiaviPeriodiTema.Pasqua);
            Assert.False(pasqua.Attivo);
        }
        finally
        {
            await client.PutAsJsonAsync(Url, originali, Json);
        }
    }
}
