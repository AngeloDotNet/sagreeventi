using Microsoft.EntityFrameworkCore;
using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Interfaces;
using SagreEventi.Web.Server.Models.Services.Infrastructure;
using ZiggyCreatures.Caching.Fusion;

namespace SagreEventi.Web.Server.Models.Services.Application;

/// <summary>
/// Entity Framework Core implementation of <see cref="IPeriodiTemaService"/>. The public read goes through FusionCache
/// (5 minutes, fail-safe as for the events); every write invalidates the cache by tag.
/// </summary>
public sealed class PeriodiTemaService(AppDbContext dbContext, IFusionCache cache) : IPeriodiTemaService
{
    private const string CacheKey = "periodi_tema";
    private const string CacheTag = "periodi-tema";

    /// <inheritdoc />
    public async Task<List<PeriodoTemaModel>> GetPeriodiAsync(CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(CacheKey, _
            => dbContext.PeriodiTema.AsNoTracking().OrderBy(periodo => periodo.Chiave)
                .Select(periodo => new PeriodoTemaModel(
                    periodo.Chiave, periodo.Attivo, periodo.GiornoInizio, periodo.MeseInizio,
                    periodo.GiornoFine, periodo.MeseFine, periodo.GiorniPrimaPasqua, periodo.GiorniDopoPasqua))
                .ToListAsync(cancellationToken), options =>
                {
                    // Same policy as the events: 5 minutes, with fail-safe and jitter
                    options.Duration = TimeSpan.FromMinutes(5);
                    options.IsFailSafeEnabled = true;
                    options.FailSafeMaxDuration = TimeSpan.FromMinutes(5);
                    options.FailSafeThrottleDuration = TimeSpan.FromMinutes(5);
                    options.JitterMaxDuration = TimeSpan.FromSeconds(30);
                }, tags: [CacheTag], token: cancellationToken);
    }

    /// <inheritdoc />
    public async Task SalvaPeriodiAsync(IReadOnlyList<PeriodoTemaModel> periodi, CancellationToken cancellationToken = default)
    {
        var righe = await dbContext.PeriodiTema.ToDictionaryAsync(periodo => periodo.Chiave, cancellationToken);
        foreach (var periodo in periodi)
        {
            // A missing key is a broken seed: the exception makes the request fail (500) instead of saving partially
            var riga = righe[periodo.Chiave];
            riga.Attivo = periodo.Attivo;
            riga.GiornoInizio = periodo.GiornoInizio;
            riga.MeseInizio = periodo.MeseInizio;
            riga.GiornoFine = periodo.GiornoFine;
            riga.MeseFine = periodo.MeseFine;
            riga.GiorniPrimaPasqua = periodo.GiorniPrimaPasqua;
            riga.GiorniDopoPasqua = periodo.GiorniDopoPasqua;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await cache.RemoveByTagAsync(CacheTag, token: cancellationToken);
    }
}
