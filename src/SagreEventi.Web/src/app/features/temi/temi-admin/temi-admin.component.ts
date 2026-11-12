import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { messaggioErroreApi } from '../../../core/admin-utenti/admin-utenti.service';
import { ChiavePeriodo, PeriodoTema, TemiApiService } from '../../../core/temi-api/temi-api.service';
import { ThemeService } from '../../../core/theme/theme.service';

/** Order of the periods in the form and in the request: the server reports field errors by position. */
const ORDINE: readonly ChiavePeriodo[] = ['pasqua', 'ferragosto', 'halloween', 'natale'];

/** Names of the periods, as shown in the form. */
const NOMI: Readonly<Record<ChiavePeriodo, string>> = {
  pasqua: 'Pasqua',
  ferragosto: 'Ferragosto',
  halloween: 'Halloween',
  natale: 'Natale',
};

const GIORNI = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
].map((nome, i) => ({ label: nome, value: i + 1 }));

/** Campi di un periodo che il server può segnalare con un errore (chiave `periodi[i].campo`). */
type CampoPeriodo = 'giornoInizio' | 'meseInizio' | 'giornoFine' | 'meseFine' | 'giorniPrimaPasqua' | 'giorniDopoPasqua';

/** Form of the seasonal theme periods (Admin only): one card per period, saved together. */
@Component({
  selector: 'app-temi-admin',
  imports: [FormsModule, ButtonModule, InputNumberModule, MessageModule, SelectModule, ToggleSwitchModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './temi-admin.component.html',
  styleUrl: './temi-admin.component.css',
})
export class TemiAdminComponent implements OnInit {
  private readonly servizio = inject(TemiApiService);
  private readonly theme = inject(ThemeService);
  private readonly messaggi = inject(MessageService);

  protected readonly nomi = NOMI;
  protected readonly giorni = GIORNI;
  protected readonly mesi = MESI;

  protected readonly periodi = signal<PeriodoTema[]>([]);
  protected readonly caricamento = signal(false);
  protected readonly occupato = signal(false);
  /** Error that is not tied to one field (or a generic one). */
  protected readonly errore = signal<string | null>(null);
  /** Field errors from the server, keyed as `periodi[i].campo`. */
  protected readonly erroriCampo = signal<Readonly<Record<string, string>>>({});

  ngOnInit(): void {
    void this.carica();
  }

  /** Reads the periods from the server into the form. */
  async carica(): Promise<void> {
    this.caricamento.set(true);
    this.errore.set(null);
    try {
      this.periodi.set(ordina(await this.servizio.periodi()));
    } catch (err) {
      this.errore.set(messaggioErroreApi(err, 'Impossibile leggere i periodi dei temi.'));
    } finally {
      this.caricamento.set(false);
    }
  }

  /** Changes some fields of one period in the form (nothing is saved yet). */
  imposta(indice: number, modifiche: Partial<PeriodoTema>): void {
    this.periodi.update((lista) => lista.map((p, i) => (i === indice ? { ...p, ...modifiche } : p)));
  }

  /** Saves the four periods. Field errors stay next to their inputs; the saved periods replace the form. */
  async salva(): Promise<void> {
    this.occupato.set(true);
    this.errore.set(null);
    this.erroriCampo.set({});
    try {
      this.periodi.set(ordina(await this.servizio.salvaPeriodi(this.periodi())));
      this.messaggi.add({ severity: 'success', summary: 'Periodi dei temi salvati', life: 4000 });
      void this.theme.caricaPeriodi();
    } catch (err) {
      this.gestisciErrore(err);
    } finally {
      this.occupato.set(false);
    }
  }

  /** Error of one field of one period, if the server reported it. */
  erroreCampo(indice: number, campo: CampoPeriodo): string | null {
    return this.erroriCampo()[`periodi[${indice}].${campo}`] ?? null;
  }

  private gestisciErrore(err: unknown): void {
    if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
      this.errore.set(messaggioErroreApi(err, 'Salvataggio non riuscito.'));
      return;
    }

    const errori = (err.error as { errors?: Record<string, string[]> } | null)?.errors ?? {};
    const campi: Record<string, string> = {};
    const generali: string[] = [];
    for (const [chiave, messaggi] of Object.entries(errori)) {
      if (chiave.startsWith('periodi[')) campi[chiave] = messaggi.join(' ');
      else generali.push(...messaggi);
    }

    this.erroriCampo.set(campi);
    if (generali.length > 0) this.errore.set(generali.join(' '));
    else if (Object.keys(campi).length > 0) this.errore.set('Controlla i campi evidenziati.');
    else this.errore.set(messaggioErroreApi(err, 'Salvataggio non riuscito.'));
  }
}

/** Sorts the periods in the form order; the unknown ones (not possible with the API) are dropped. */
function ordina(periodi: readonly PeriodoTema[]): PeriodoTema[] {
  return ORDINE.flatMap((chiave) => periodi.filter((p) => p.chiave === chiave));
}
