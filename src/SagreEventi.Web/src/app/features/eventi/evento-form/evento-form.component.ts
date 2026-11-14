import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { EventiStore } from '../../../core/eventi-store/eventi-store.service';
import {
  MAX_INDIRIZZO,
  gradoValido,
  parseLocalDate,
  senzaCaratteriDiControllo,
  startOfToday,
  toDateOnlyIso,
} from '../../../core/evento-utils/evento-utils';
import { GeocodingService, PuntoTrovato } from '../../../core/geocoding/geocoding.service';
import { EventoDraft } from '../../../core/models/models';
import { PermessiService } from '../../../core/permessi/permessi.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { MappaComponent } from '../../../shared/mappa/mappa.component';

type CampoForm =
  'nomeEvento' | 'cittaEvento' | 'indirizzo' | 'dataInizioEvento' | 'dataFineEvento' | 'latitudine' | 'longitudine' | 'descrizioneEvento';

/** La fine non può precedere l'inizio. */
const intervalloDate: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const inizio = c.get('dataInizioEvento')?.value as Date | null;
  const fine = c.get('dataFineEvento')?.value as Date | null;
  return inizio && fine && fine.getTime() < inizio.getTime() ? { intervallo: true } : null;
};

/** Latitudine e longitudine vanno indicate insieme, oppure lasciate vuote entrambe. */
const coppiaCoordinate: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const latitudine = c.get('latitudine')?.value as number | null;
  const longitudine = c.get('longitudine')?.value as number | null;
  return (latitudine === null) !== (longitudine === null) ? { coppiaCoordinate: true } : null;
};

/** Indirizzo senza caratteri di controllo (a capo, tabulazioni e simili). La lunghezza è un validatore a parte. */
const indirizzoSicuro: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  senzaCaratteriDiControllo(String(c.value ?? '')) ? null : { caratteriNonValidi: true };

/** Un grado (latitudine o longitudine) nei limiti e con al massimo 6 decimali, come sul server. */
const gradi =
  (limite: number): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null => {
    const valore = c.value as number | null;
    return valore === null || gradoValido(valore, limite) ? null : { gradi: true };
  };

@Component({
  selector: 'app-evento-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    TextareaModule,
    EmptyStateComponent,
    MappaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evento-form.component.html',
})
export class EventoFormComponent implements OnInit {
  /** Presente solo nella rotta di modifica (`eventi/:id/modifica`). */
  readonly id = input<string>();

  protected readonly store = inject(EventiStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly messaggi = inject(MessageService);
  private readonly permessi = inject(PermessiService);

  protected readonly nonTrovato = signal(false);
  protected readonly maxIndirizzo = MAX_INDIRIZZO;
  private readonly geocoding = inject(GeocodingService);

  /** Ricerca sulla mappa in corso: il pulsante resta disattivato fino alla risposta. */
  protected readonly cercando = signal(false);
  /** Esito dell'ultima ricerca: il nome del punto trovato, o `null` se la ricerca non ha dato un risultato. */
  protected readonly trovato = signal<PuntoTrovato | null>(null);
  /** Risultato vuoto della ricerca (il servizio non conosce l'indirizzo). */
  protected readonly nessunRisultato = signal(false);
  /** La ricerca non è riuscita (rete assente o servizio bloccato). */
  protected readonly erroreRicerca = signal(false);

  /** A new report from someone who cannot moderate is published only after review (Admin and Editor publish at once). */
  protected readonly daModerare = computed(() => !this.id() && !this.permessi.puoModificare());

  protected readonly form = this.fb.group(
    {
      nomeEvento: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      cittaEvento: ['', [Validators.required, Validators.maxLength(100)]],
      indirizzo: ['', [Validators.maxLength(MAX_INDIRIZZO), indirizzoSicuro]],
      dataInizioEvento: this.fb.control<Date | null>(null, Validators.required),
      dataFineEvento: this.fb.control<Date | null>(null, Validators.required),
      latitudine: this.fb.control<number | null>(null, gradi(90)),
      longitudine: this.fb.control<number | null>(null, gradi(180)),
      descrizioneEvento: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(4000)]],
    },
    { validators: [intervalloDate, coppiaCoordinate] },
  );

  private readonly inizioValore = toSignal(this.form.controls.dataInizioEvento.valueChanges, {
    initialValue: this.form.controls.dataInizioEvento.value,
  });
  protected readonly inizio = computed(() => this.inizioValore() ?? startOfToday());

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const e = this.store.trova(id);
    if (!e) {
      this.nonTrovato.set(true);
      return;
    }
    this.form.patchValue({
      nomeEvento: e.nomeEvento,
      cittaEvento: e.cittaEvento,
      indirizzo: e.indirizzo ?? '',
      dataInizioEvento: parseLocalDate(e.dataInizioEvento),
      dataFineEvento: parseLocalDate(e.dataFineEvento),
      latitudine: e.latitudine ?? null,
      longitudine: e.longitudine ?? null,
      descrizioneEvento: e.descrizioneEvento,
    });
  }

  /** Messaggio di errore del campo. */
  protected errore(nome: CampoForm): string | null {
    const c = this.form.controls[nome];
    if (!c.invalid || !(c.touched || c.dirty)) return null;
    if (c.hasError('required')) {
      const obbligatori: Partial<Record<CampoForm, string>> = {
        nomeEvento: "Il nome dell'evento è obbligatorio.",
        cittaEvento: 'La città è obbligatoria.',
        dataInizioEvento: 'Indica il primo giorno.',
        dataFineEvento: "Indica l'ultimo giorno.",
        descrizioneEvento: 'La descrizione è obbligatoria.',
      };
      return obbligatori[nome] ?? null;
    }
    if (c.hasError('caratteriNonValidi')) return "L'indirizzo contiene caratteri non ammessi, come a capo o tabulazioni.";
    if (c.hasError('gradi')) {
      return nome === 'latitudine'
        ? 'La latitudine va da -90 a 90, con al massimo 6 decimali.'
        : 'La longitudine va da -180 a 180, con al massimo 6 decimali.';
    }
    const min = c.getError('minlength') as { requiredLength: number } | null;
    if (min) return `Servono almeno ${min.requiredLength} caratteri.`;
    const max = c.getError('maxlength') as { requiredLength: number } | null;
    if (max) return `Al massimo ${max.requiredLength} caratteri.`;
    return null;
  }

  /** Coordinate del form come segnali, perché la mappa le legge: si aggiornano con i campi, con la ricerca e con il tocco. */
  private readonly latitudineValore = toSignal(this.form.controls.latitudine.valueChanges, {
    initialValue: this.form.controls.latitudine.value,
  });
  private readonly longitudineValore = toSignal(this.form.controls.longitudine.valueChanges, {
    initialValue: this.form.controls.longitudine.value,
  });
  protected readonly latitudineMappa = computed(() => this.latitudineValore() ?? null);
  protected readonly longitudineMappa = computed(() => this.longitudineValore() ?? null);

  /** Il punto spostato sulla mappa (tocco o trascinamento) diventa la posizione del form. */
  protected sposta(punto: { latitudine: number; longitudine: number }): void {
    this.form.patchValue({ latitudine: punto.latitudine, longitudine: punto.longitudine });
    this.form.markAsDirty();
    this.nessunRisultato.set(false);
    this.erroreRicerca.set(false);
    this.trovato.set(null);
  }

  /**
   * Cerca indirizzo e città su Nominatim e porta il punto sul primo risultato. Una sola richiesta per clic.
   * Se la ricerca non trova nulla o fallisce, il form resta com'è: si può salvare senza posizione.
   */
  protected async trovaSullaMappa(): Promise<void> {
    const indirizzo = this.form.controls.indirizzo.value.trim();
    const citta = this.form.controls.cittaEvento.value.trim();
    const query = [indirizzo, citta].filter(Boolean).join(', ');
    if (!citta || !query) return;

    this.cercando.set(true);
    this.trovato.set(null);
    this.nessunRisultato.set(false);
    this.erroreRicerca.set(false);
    try {
      const punto = await this.geocoding.cerca(query);
      if (!punto) {
        this.nessunRisultato.set(true);
        return;
      }
      this.form.patchValue({ latitudine: punto.latitudine, longitudine: punto.longitudine });
      this.form.markAsDirty();
      this.trovato.set(punto);
    } catch {
      this.erroreRicerca.set(true);
    } finally {
      this.cercando.set(false);
    }
  }

  protected salva(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    if (!v.dataInizioEvento || !v.dataFineEvento) return;

    const draft: EventoDraft = {
      nomeEvento: v.nomeEvento.trim(),
      cittaEvento: v.cittaEvento.trim(),
      indirizzo: v.indirizzo.trim() || null,
      dataInizioEvento: toDateOnlyIso(v.dataInizioEvento),
      dataFineEvento: toDateOnlyIso(v.dataFineEvento),
      latitudine: v.latitudine,
      longitudine: v.longitudine,
      descrizioneEvento: v.descrizioneEvento.trim(),
    };

    const id = this.id();
    let destinazione: string;
    if (id) {
      this.store.aggiorna(id, draft);
      destinazione = id;
    } else {
      destinazione = this.store.crea(draft).id;
    }

    const inRevisione = this.daModerare();
    this.messaggi.add({
      severity: 'success',
      summary: id ? 'Modifiche salvate' : inRevisione ? 'Segnalazione ricevuta' : 'Evento segnalato',
      detail: inRevisione
        ? 'Sarà visibile a tutti dopo la revisione. Lo trovi in «Le mie segnalazioni».'
        : this.store.online()
          ? 'Lo sto inviando al server.'
          : 'Sei offline: partirà appena torni online.',
      life: inRevisione ? 7000 : 4000,
    });
    void this.store.sincronizza();
    void this.router.navigate(['/eventi', destinazione]);
  }
}
