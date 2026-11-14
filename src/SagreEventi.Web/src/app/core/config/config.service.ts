import { Injectable, computed, signal } from '@angular/core';

/** Servizi della mappa: tile di sfondo e ricerca indirizzi. Si cambiano in `config.json` senza ripubblicare l'app. */
export interface ConfigMappa {
  /** Modello degli URL delle tile, con i segnaposto `{z}`, `{x}`, `{y}` (es. `https://tile.openstreetmap.org/{z}/{x}/{y}.png`). */
  tileUrl: string;
  /** Endpoint di ricerca indirizzi, compatibile con Nominatim (es. `https://nominatim.openstreetmap.org/search`). */
  nominatimUrl: string;
}

export interface AppConfig {
  /** URL base dell'API (es. `https://api.example.com`). Vuoto = stessa origine (default): è il caso dietro nginx, che serve il frontend e inoltra `/api` al backend, e con il proxy di sviluppo. */
  apiBaseUrl: string;
  /** Servizi della mappa. */
  mappa: ConfigMappa;
}

/** Valori di default della mappa: usati finché `config.json` non li sovrascrive o se un valore non è valido. */
export const MAPPA_PREDEFINITA: ConfigMappa = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  nominatimUrl: 'https://nominatim.openstreetmap.org/search',
};

/** Solo `https://` e tile con i tre segnaposto: un valore diverso (es. `javascript:` o un URL senza `{z}`) non viene mai usato. */
export function tileUrlValido(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('https://') && ['{z}', '{x}', '{y}'].every((s) => url.includes(s));
}

/** Solo `https://` per la ricerca indirizzi. */
export function nominatimUrlValido(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('https://');
}

/** Legge `config.json` all'avvio, così l'URL dell'API e i servizi della mappa si cambiano senza ricompilare. */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly config = signal<AppConfig>({ apiBaseUrl: '', mappa: MAPPA_PREDEFINITA });
  readonly apiBaseUrl = computed(() => this.config().apiBaseUrl.replace(/\/+$/, ''));
  readonly mappa = computed(() => this.config().mappa);

  async load(): Promise<void> {
    try {
      const res = await fetch('config.json', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as Partial<{ apiBaseUrl: unknown; mappa: Partial<Record<keyof ConfigMappa, unknown>> }>;
      const apiBaseUrl = typeof json.apiBaseUrl === 'string' ? json.apiBaseUrl : '';
      const tileUrl = tileUrlValido(json.mappa?.tileUrl) ? json.mappa.tileUrl : MAPPA_PREDEFINITA.tileUrl;
      const nominatimUrl = nominatimUrlValido(json.mappa?.nominatimUrl) ? json.mappa.nominatimUrl : MAPPA_PREDEFINITA.nominatimUrl;
      this.config.set({ apiBaseUrl, mappa: { tileUrl, nominatimUrl } });
    } catch {
      // config.json assente o non valido: si usano i valori di default.
    }
  }
}
