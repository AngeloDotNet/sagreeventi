import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ChiavePeriodo, PeriodoTema, TemiApiService } from '../temi-api/temi-api.service';

const KEY = 'sagreeventi.theme';

/** Available themes. */
export type Tema = 'light' | 'dark' | 'pasqua' | 'ferragosto' | 'halloween' | 'natale' | 'natale-scuro';

const TEMI: readonly Tema[] = ['light', 'dark', 'pasqua', 'ferragosto', 'halloween', 'natale', 'natale-scuro'];

/** Themes built on the PrimeNG dark surfaces. */
const TEMI_SCURI: ReadonlySet<Tema> = new Set<Tema>(['dark', 'halloween', 'natale-scuro']);

/** Document class of each themed palette (light and dark use only the PrimeNG dark class). */
const CLASSI_TEMA: Readonly<Partial<Record<Tema, string>>> = {
  pasqua: 'app-pasqua',
  ferragosto: 'app-ferragosto',
  halloween: 'app-halloween',
  natale: 'app-natale',
  'natale-scuro': 'app-natale-scuro',
};

/** Period that governs each seasonal theme. The dark Christmas theme shares the Christmas period. */
const PERIODO_DI_TEMA: Readonly<Partial<Record<Tema, ChiavePeriodo>>> = {
  pasqua: 'pasqua',
  ferragosto: 'ferragosto',
  halloween: 'halloween',
  natale: 'natale',
  'natale-scuro': 'natale',
};

/** Periods used until the server answers, or when it cannot be reached (the app stays usable offline). They match the database seed. */
export const PERIODI_PREDEFINITI: readonly PeriodoTema[] = [
  {
    chiave: 'pasqua',
    attivo: true,
    giornoInizio: null,
    meseInizio: null,
    giornoFine: null,
    meseFine: null,
    giorniPrimaPasqua: 7,
    giorniDopoPasqua: 1,
  },
  {
    chiave: 'ferragosto',
    attivo: true,
    giornoInizio: 1,
    meseInizio: 8,
    giornoFine: 20,
    meseFine: 8,
    giorniPrimaPasqua: null,
    giorniDopoPasqua: null,
  },
  {
    chiave: 'halloween',
    attivo: true,
    giornoInizio: 24,
    meseInizio: 10,
    giornoFine: 31,
    meseFine: 10,
    giorniPrimaPasqua: null,
    giorniDopoPasqua: null,
  },
  {
    chiave: 'natale',
    attivo: true,
    giornoInizio: 1,
    meseInizio: 12,
    giornoFine: 6,
    meseFine: 1,
    giorniPrimaPasqua: null,
    giorniDopoPasqua: null,
  },
];

/** Easter Sunday of the given year (Gregorian calendar, Meeus/Jones/Butcher algorithm). */
export function pasqua(anno: number): Date {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anno, mese - 1, giorno);
}

const MS_GIORNO = 86_400_000;

/** Day number of a calendar date, independent of the time of day and of daylight saving time. */
const numeroGiorno = (data: Date): number => Math.round(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / MS_GIORNO);

/** Easter period: from the given days before Easter Sunday to the given days after it. */
const inPasqua = (periodo: PeriodoTema, oggi: Date): boolean => {
  const { giorniPrimaPasqua: prima, giorniDopoPasqua: dopo } = periodo;
  if (prima === null || dopo === null) return false;
  const domenica = numeroGiorno(pasqua(oggi.getFullYear()));
  const giorno = numeroGiorno(oggi);
  return giorno >= domenica - prima && giorno <= domenica + dopo;
};

/** Fixed-date period, from the start day to the end day included; a start after the end spans the new year. */
const inDataFissa = (periodo: PeriodoTema, oggi: Date): boolean => {
  const { giornoInizio, meseInizio, giornoFine, meseFine } = periodo;
  if (giornoInizio === null || meseInizio === null || giornoFine === null || meseFine === null) return false;
  const inizio = meseInizio * 100 + giornoInizio;
  const fine = meseFine * 100 + giornoFine;
  const giorno = (oggi.getMonth() + 1) * 100 + oggi.getDate();
  return inizio <= fine ? giorno >= inizio && giorno <= fine : giorno >= inizio || giorno <= fine;
};

/** Whether a period is in force on the given day: it must be enabled and the day must be inside its dates. */
const inPeriodo = (periodo: PeriodoTema, oggi: Date): boolean => {
  if (!periodo.attivo) return false;
  return periodo.chiave === 'pasqua' ? inPasqua(periodo, oggi) : inDataFissa(periodo, oggi);
};

/** Whether the theme can be chosen on the given day: the seasonal ones only inside their period, the others always. */
export function inStagione(tema: Tema, oggi: Date = new Date(), periodi: readonly PeriodoTema[] = PERIODI_PREDEFINITI): boolean {
  const chiave = PERIODO_DI_TEMA[tema];
  if (!chiave) return true;
  const periodo = periodi.find((p) => p.chiave === chiave);
  return periodo ? inPeriodo(periodo, oggi) : false;
}

/** Keys that must all be present in the periods received from the server, otherwise the predefined ones are kept. */
const CHIAVI_PERIODI: readonly ChiavePeriodo[] = ['pasqua', 'ferragosto', 'halloween', 'natale'];

const sonoCompleti = (periodi: PeriodoTema[]): boolean => CHIAVI_PERIODI.every((chiave) => periodi.some((p) => p.chiave === chiave));

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly api = inject(TemiApiService);

  /** Periods in force: the predefined ones until the server answers. Declared before `tema`, which reads them. */
  readonly periodi = signal<readonly PeriodoTema[]>(PERIODI_PREDEFINITI);

  /** The current theme. */
  readonly tema = signal<Tema>(this.iniziale());
  readonly scuro = computed(() => this.tema() === 'dark');

  /** Whether the user chose a theme in this session: a later load of the periods does not override it. */
  private sceltaUtente = false;

  constructor() {
    effect(() => {
      const tema = this.tema();
      const classi = this.doc.documentElement.classList;
      classi.toggle('app-dark', TEMI_SCURI.has(tema));
      for (const [nome, classe] of Object.entries(CLASSI_TEMA)) classi.toggle(classe, tema === nome);
    });
  }

  /** Whether the theme can be chosen today, with the periods in force. */
  disponibile(tema: Tema): boolean {
    return inStagione(tema, new Date(), this.periodi());
  }

  /**
   * Loads the periods from the server. If the request fails or the answer is incomplete, the predefined periods stay.
   * Unless the user already chose a theme, the theme is recomputed with the loaded periods.
   */
  async caricaPeriodi(): Promise<void> {
    let ricevuti: PeriodoTema[];
    try {
      ricevuti = await this.api.periodi();
    } catch {
      return;
    }
    if (!Array.isArray(ricevuti) || !sonoCompleti(ricevuti)) return;

    this.periodi.set(ricevuti);
    if (!this.sceltaUtente) this.tema.set(this.iniziale());
  }

  /** Switches to the given theme and saves the choice (the switch works even if it cannot be saved). */
  imposta(tema: Tema): void {
    this.sceltaUtente = true;
    this.tema.set(tema);
    try {
      localStorage.setItem(KEY, tema);
    } catch {
      // preferenza non persistita
    }
  }

  /** Saved theme if it still exists and is in season; an unknown one is light; an expired seasonal one falls back to the system preference. */
  private iniziale(): Tema {
    try {
      const salvato = localStorage.getItem(KEY);
      const tema = TEMI.find((t) => t === salvato);
      if (tema && inStagione(tema, new Date(), this.periodi())) return tema;
      if (salvato && !tema) return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
