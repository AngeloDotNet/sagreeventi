import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';

/** Chiavi dei periodi configurabili: il Natale vale anche per il tema Natale scuro. */
export type ChiavePeriodo = 'pasqua' | 'ferragosto' | 'halloween' | 'natale';

/** Periodo di un tema stagionale, come lo restituisce e lo accetta `api/temi/periodi`. I campi che non riguardano il periodo sono `null`. */
export interface PeriodoTema {
  chiave: ChiavePeriodo;
  /** Interruttore: un periodo disattivato non rende disponibile il tema. */
  attivo: boolean;
  /** Periodi a data fissa: giorno e mese di inizio e di fine. */
  giornoInizio: number | null;
  meseInizio: number | null;
  giornoFine: number | null;
  meseFine: number | null;
  /** Pasqua: giorni prima e dopo la domenica di Pasqua. */
  giorniPrimaPasqua: number | null;
  giorniDopoPasqua: number | null;
}

/** Client degli endpoint dei periodi dei temi (`api/temi/periodi`). La lettura è pubblica, il salvataggio solo per l'Admin. */
@Injectable({ providedIn: 'root' })
export class TemiApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  private get url(): string {
    return `${this.config.apiBaseUrl()}/api/temi/periodi`;
  }

  /** Legge i periodi dei temi stagionali. */
  periodi(): Promise<PeriodoTema[]> {
    return firstValueFrom(this.http.get<PeriodoTema[]>(this.url));
  }

  /** Salva i quattro periodi (solo Admin) e restituisce quelli salvati. */
  salvaPeriodi(periodi: PeriodoTema[]): Promise<PeriodoTema[]> {
    return firstValueFrom(this.http.put<PeriodoTema[]>(this.url, periodi));
  }
}
