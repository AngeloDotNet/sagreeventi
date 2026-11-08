using System.ComponentModel.DataAnnotations;

namespace SagreEventi.Shared.Models;

public class EventoModel
{
    public const int MaxIdLength = 100;
    public const int MaxNomeLength = 200;
    public const int MaxCittaLength = 100;
    public const int MaxIndirizzoLength = 200;
    public const int MaxDescrizioneLength = 4000;
    /// <summary>Maximum number of decimals accepted for the coordinates (about 11 cm of precision).</summary>
    public const int MaxCoordinateDecimals = 6;

    // Field: Id
    [StringLength(MaxIdLength, ErrorMessage = "L'id dell'evento può essere lungo al massimo {1} caratteri")]
    public string Id { get; set; } = string.Empty;

    // Field: event name
    [StringLength(MaxNomeLength, ErrorMessage = "Il nome dell'evento può essere lungo al massimo {1} caratteri")]
    [Required(ErrorMessage = "Il nome dell'evento è obbligatorio")]
    [Display(Name = "Nome Evento")]
    [DataType(DataType.Text)]
    public string NomeEvento { get; set; } = string.Empty;

    // Field: event place
    [StringLength(MaxCittaLength, ErrorMessage = "Il luogo dell'evento può essere lungo al massimo {1} caratteri")]
    [Required(ErrorMessage = "Il luogo dell'evento è obbligatorio")]
    [Display(Name = "Luogo Evento")]
    [DataType(DataType.Text)]
    public string CittaEvento { get; set; } = string.Empty;

    // Field: optional street address (more precise than the city, helps to place the event on a map)
    [StringLength(MaxIndirizzoLength, ErrorMessage = "L'indirizzo dell'evento può essere lungo al massimo {1} caratteri")]
    [Display(Name = "Indirizzo Evento")]
    [DataType(DataType.Text)]
    public string? Indirizzo { get; set; }

    // Field: optional latitude, to be sent together with the longitude
    [Range(-90.0, 90.0, ErrorMessage = "La latitudine deve essere compresa tra {1} e {2}")]
    [Display(Name = "Latitudine")]
    public decimal? Latitudine { get; set; }

    // Field: optional longitude, to be sent together with the latitude
    [Range(-180.0, 180.0, ErrorMessage = "La longitudine deve essere compresa tra {1} e {2}")]
    [Display(Name = "Longitudine")]
    public decimal? Longitudine { get; set; }

    // Field: event start date
    [Required(ErrorMessage = "La data di inizio dell'evento è obbligatoria")]
    [Display(Name = "Data Inizio Evento")]
    [DataType(DataType.Date)]
    public Nullable<DateTime> DataInizioEvento { get; set; }

    // Field: event end date
    [Required(ErrorMessage = "La data di fine dell'evento è obbligatoria")]
    [Display(Name = "Data Fine Evento")]
    [DataType(DataType.Date)]
    public Nullable<DateTime> DataFineEvento { get; set; }

    // Field: event description
    [StringLength(MaxDescrizioneLength, ErrorMessage = "La descrizione dell'evento può essere lunga al massimo {1} caratteri")]
    [Required(ErrorMessage = "La descrizione dell'evento è obbligatoria")]
    [Display(Name = "Descrizione Evento")]
    [DataType(DataType.Text)]
    public string DescrizioneEvento { get; set; } = string.Empty;

    // Field: event concluded - tells whether the event is over
    public bool EventoConcluso { get; set; }

    // Field: date and time of the last change (used by the application service)
    public DateTime DataOraUltimaModifica { get; set; }

    // Field: moderation state - output only, the server ignores the value sent by the client
    public StatoModerazione Stato { get; set; }

    // Field: rejection note - output only, set when the state is Rifiutato
    public string? MotivoRifiuto { get; set; }
}
