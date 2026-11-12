using SagreEventi.Shared.Models;

namespace SagreEventi.Web.Server.Interfaces;

/// <summary>Application service for the configurable periods of the seasonal themes.</summary>
public interface IPeriodiTemaService
{
    /// <summary>Returns the four periods, served through the cache; the reads are public.</summary>
    Task<List<PeriodoTemaModel>> GetPeriodiAsync(CancellationToken cancellationToken = default);

    /// <summary>Saves the given periods (already validated) and invalidates the cache. Each key must exist in the table.</summary>
    Task SalvaPeriodiAsync(IReadOnlyList<PeriodoTemaModel> periodi, CancellationToken cancellationToken = default);
}
