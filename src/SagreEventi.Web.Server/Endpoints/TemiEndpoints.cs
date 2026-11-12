using Microsoft.AspNetCore.Mvc;
using SagreEventi.Shared.Models;
using SagreEventi.Web.Server.Interfaces;
using SagreEventi.Web.Server.Models.Identity;
using SagreEventi.Web.Server.Validators;

namespace SagreEventi.Web.Server.Endpoints;

/// <summary>Seasonal theme periods (<c>/api/temi/periodi</c>): public read, saved by Admin only.</summary>
public static class TemiEndpoints
{
    /// <summary>Maps the period endpoints: <c>GET</c> anonymous, <c>PUT</c> reserved to Admin (policy <c>SoloAdmin</c>).</summary>
    public static IEndpointRouteBuilder MapTemiEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/temi").WithTags("Temi");

        group.MapGet("/periodi", GetPeriodiAsync);
        group.MapPut("/periodi", SalvaPeriodiAsync).RequireAuthorization(Policies.SoloAdmin);

        return app;
    }

    private static async Task<IResult> GetPeriodiAsync(IPeriodiTemaService periodiTemaService, CancellationToken cancellationToken)
    {
        return Results.Ok(await periodiTemaService.GetPeriodiAsync(cancellationToken));
    }

    private static async Task<IResult> SalvaPeriodiAsync(
        [FromBody] List<PeriodoTemaModel>? periodi, IPeriodiTemaService periodiTemaService, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var errori = PeriodoTemaValidator.Valida(periodi);
        if (errori.Count > 0)
        {
            return Results.ValidationProblem(errori);
        }

        await periodiTemaService.SalvaPeriodiAsync(periodi!, cancellationToken);

        // Response of an administrator: never stored by browsers or proxies
        httpContext.Response.Headers.CacheControl = "no-store";
        return Results.Ok(await periodiTemaService.GetPeriodiAsync(cancellationToken));
    }
}
