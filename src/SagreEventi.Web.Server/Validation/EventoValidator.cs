using System.ComponentModel.DataAnnotations;
using SagreEventi.Shared.Models;

namespace SagreEventi.Web.Server.Validation;

/// <summary>
/// Explicit validation of incoming DTOs: Minimal APIs do not validate on their own.
/// Uses the DataAnnotations of <c>EventoModel</c> and also requires the Id (the table key).
/// </summary>
public static class EventoValidator
{
    /// <summary>Returns the errors keyed by element index (e.g. <c>eventi[0].NomeEvento</c>); empty when everything is valid.</summary>
    public static Dictionary<string, string[]> Validate(IReadOnlyList<EventoModel> eventi)
    {
        var errori = new Dictionary<string, string[]>();

        for (var i = 0; i < eventi.Count; i++)
        {
            var evento = eventi[i];
            if (evento is null)
            {
                errori[$"eventi[{i}]"] = ["L'evento non può essere nullo."];
                continue;
            }

            var risultati = new List<ValidationResult>();
            Validator.TryValidateObject(evento, new ValidationContext(evento), risultati, validateAllProperties: true);

            if (string.IsNullOrWhiteSpace(evento.Id))
            {
                risultati.Add(new ValidationResult("L'id dell'evento è obbligatorio.", [nameof(EventoModel.Id)]));
            }

            AggiungiErrori(evento, risultati);

            foreach (var gruppo in risultati.SelectMany(r => r.MemberNames.DefaultIfEmpty(string.Empty), (r, membro) => (membro, r.ErrorMessage))
                         .GroupBy(x => x.membro))
            {
                var chiave = string.IsNullOrEmpty(gruppo.Key) ? $"eventi[{i}]" : $"eventi[{i}].{gruppo.Key}";
                errori[chiave] = gruppo.Select(x => x.ErrorMessage ?? "Valore non valido.").ToArray();
            }
        }

        return errori;
    }

    // Rules that the DataAnnotations cannot express: address without control characters, coordinates in pairs and with limited decimals
    private static void AggiungiErrori(EventoModel evento, List<ValidationResult> risultati)
    {
        if (evento.Indirizzo is not null && evento.Indirizzo.Any(char.IsControl))
        {
            risultati.Add(new ValidationResult("L'indirizzo dell'evento contiene caratteri non validi.", [nameof(EventoModel.Indirizzo)]));
        }

        if (evento.Latitudine.HasValue != evento.Longitudine.HasValue)
        {
            risultati.Add(new ValidationResult("Latitudine e longitudine vanno indicate insieme.",
                [nameof(EventoModel.Latitudine), nameof(EventoModel.Longitudine)]));
        }

        if (HaTroppiDecimali(evento.Latitudine))
        {
            risultati.Add(new ValidationResult($"La latitudine può avere al massimo {EventoModel.MaxCoordinateDecimals} decimali.", [nameof(EventoModel.Latitudine)]));
        }

        if (HaTroppiDecimali(evento.Longitudine))
        {
            risultati.Add(new ValidationResult($"La longitudine può avere al massimo {EventoModel.MaxCoordinateDecimals} decimali.", [nameof(EventoModel.Longitudine)]));
        }
    }

    // decimal.Round returns a different value only when digits beyond the allowed scale are non-zero (45.4642000 is fine)
    private static bool HaTroppiDecimali(decimal? valore)
        => valore.HasValue && decimal.Round(valore.Value, EventoModel.MaxCoordinateDecimals) != valore.Value;
}
