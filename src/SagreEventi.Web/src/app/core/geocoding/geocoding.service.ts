import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { gradoValido } from '../evento-utils/evento-utils';

/** Punto trovato dalla ricerca di un indirizzo: coordinate con la scala del server e il nome che ha restituito il servizio. */
export interface PuntoTrovato {
  latitudine: number;
  longitudine: number;
  nome: string;
}

/** Limite di Nominatim: al massimo una richiesta al secondo. Vale per l'intera app. */
export const INTERVALLO_RICERCA_MS = 1000;

/** Lunghezza massima del nome mostrato all'utente. */
const MAX_NOME = 200;

/**
 * Ricerca indirizzi con Nominatim (`config.json`, `mappa.nominatimUrl`). Una richiesta per azione dell'utente,
 * risultati in cache per query, richieste in fila per rispettare il limite di una al secondo.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly cache = new Map<string, PuntoTrovato | null>();
  private ultimaRichiesta = 0;
  private coda: Promise<unknown> = Promise.resolve();

  /**
   * Primo risultato per la query, o `null` se il servizio non trova nulla. Errori di rete o risposte di errore
   * vengono lanciati: il chiamante mostra il messaggio e l'utente può comunque salvare senza posizione.
   */
  cerca(query: string): Promise<PuntoTrovato | null> {
    const testo = query.trim();
    const chiave = testo.replace(/\s+/g, ' ').toLowerCase();
    if (!chiave) return Promise.resolve(null);
    if (this.cache.has(chiave)) return Promise.resolve(this.cache.get(chiave) ?? null);

    const esito = this.coda.then(() => this.richiedi(testo, chiave));
    this.coda = esito.catch(() => undefined);
    return esito;
  }

  private async richiedi(testo: string, chiave: string): Promise<PuntoTrovato | null> {
    const attesa = INTERVALLO_RICERCA_MS - (Date.now() - this.ultimaRichiesta);
    if (attesa > 0) await new Promise<void>((resolve) => setTimeout(resolve, attesa));
    this.ultimaRichiesta = Date.now();

    const risposta = await firstValueFrom(
      this.http.get<unknown>(this.config.mappa().nominatimUrl, {
        params: { q: testo, format: 'jsonv2', limit: '1', 'accept-language': 'it' },
      }),
    );
    const punto = leggiRisultato(risposta);
    this.cache.set(chiave, punto);
    return punto;
  }
}

/** Legge il primo risultato di Nominatim. Qualunque forma inattesa (non è una lista, coordinate non numeriche o fuori limite) dà `null`. */
export function leggiRisultato(risposta: unknown): PuntoTrovato | null {
  if (!Array.isArray(risposta) || risposta.length === 0) return null;
  const primo = risposta[0] as { lat?: unknown; lon?: unknown; display_name?: unknown } | null;
  if (!primo || typeof primo.lat !== 'string' || typeof primo.lon !== 'string') return null;

  const latitudine = arrotonda(primo.lat);
  const longitudine = arrotonda(primo.lon);
  if (latitudine === null || longitudine === null) return null;
  if (!gradoValido(latitudine, 90) || !gradoValido(longitudine, 180)) return null;

  const nome = typeof primo.display_name === 'string' ? primo.display_name.slice(0, MAX_NOME) : '';
  return { latitudine, longitudine, nome };
}

/** Converte una coordinata testuale nella scala del server (6 decimali); `null` se non è un numero. */
function arrotonda(testo: string): number | null {
  if (testo.trim() === '') return null;
  const valore = Number(testo);
  return Number.isFinite(valore) ? Math.round(valore * 1_000_000) / 1_000_000 : null;
}
