import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PERIODI_PREDEFINITI, ThemeService, inStagione, pasqua } from './theme.service';
import { PeriodoTema } from '../temi-api/temi-api.service';

const KEY = 'sagreeventi.theme';
const API = 'https://api.test';
const CLASSI = ['app-dark', 'app-pasqua', 'app-ferragosto', 'app-halloween', 'app-natale', 'app-natale-scuro'];

/** Fakes the system preference; jsdom does not implement `matchMedia`. */
const preferenzaSistema = (scuro: boolean) => vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: scuro }));

const ripulisci = () => document.documentElement.classList.remove(...CLASSI);

/** Sets today's date (only `Date` is faked, so TestBed and effects keep working). */
const oggi = (mese: number, giorno: number) => vi.setSystemTime(new Date(2026, mese - 1, giorno));

/** Periods as the server returns them: a complete set, with Halloween from 1 to 5 November. */
const periodiServer = (): PeriodoTema[] =>
  PERIODI_PREDEFINITI.map((p) =>
    p.chiave === 'halloween' ? { ...p, giornoInizio: 1, meseInizio: 11, giornoFine: 5, meseFine: 11 } : { ...p },
  );

describe('ThemeService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    oggi(10, 30); // in season for Halloween
    localStorage.clear();
    ripulisci();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ConfigService, useValue: { apiBaseUrl: () => API } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    ripulisci();
  });

  const crea = (): ThemeService => TestBed.inject(ThemeService);

  describe('initial theme', () => {
    it.each(['light', 'dark', 'pasqua', 'ferragosto', 'halloween', 'natale', 'natale-scuro'] as const)(
      'uses the saved %s preference',
      (tema) => {
        if (tema.startsWith('natale')) oggi(12, 20);
        if (tema === 'pasqua') oggi(4, 1);
        if (tema === 'ferragosto') oggi(8, 10);
        localStorage.setItem(KEY, tema);
        preferenzaSistema(true);

        expect(crea().tema()).toBe(tema);
      },
    );

    it.each([true, false])('follows the system preference (dark: %s) when nothing is saved', (scuro) => {
      preferenzaSistema(scuro);

      expect(crea().tema()).toBe(scuro ? 'dark' : 'light');
    });

    it('treats a saved theme that no longer exists (sepia) as light', () => {
      localStorage.setItem(KEY, 'sepia');

      expect(crea().tema()).toBe('light');
    });

    it('treats an unknown saved value as light', () => {
      localStorage.setItem(KEY, 'blue');

      expect(crea().tema()).toBe('light');
    });

    it('is light when the system preference is not available', () => {
      vi.stubGlobal('matchMedia', undefined);

      expect(crea().tema()).toBe('light');
    });

    it('is light when the storage cannot be read', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Denied', 'SecurityError');
      });

      expect(crea().tema()).toBe('light');
    });
  });

  describe('seasonal themes', () => {
    it.each([
      ['pasqua', 3, 28, false],
      ['pasqua', 3, 29, true],
      ['pasqua', 4, 5, true],
      ['pasqua', 4, 6, true],
      ['pasqua', 4, 7, false],
      ['ferragosto', 7, 31, false],
      ['ferragosto', 8, 1, true],
      ['ferragosto', 8, 20, true],
      ['ferragosto', 8, 21, false],
      ['halloween', 10, 23, false],
      ['halloween', 10, 24, true],
      ['halloween', 10, 31, true],
      ['halloween', 11, 1, false],
      ['natale', 11, 30, false],
      ['natale', 12, 1, true],
      ['natale', 12, 31, true],
      ['natale-scuro', 1, 6, true],
      ['natale-scuro', 1, 7, false],
      ['dark', 7, 15, true],
      ['light', 7, 15, true],
    ] as const)('%s on %i/%i is available: %s', (tema, mese, giorno, atteso) => {
      expect(inStagione(tema, new Date(2026, mese - 1, giorno))).toBe(atteso);
    });

    it.each([
      [2024, 2, 31],
      [2025, 3, 20],
      [2026, 3, 5],
      [2027, 2, 28],
    ])('computes Easter %i', (anno, mese, giorno) => {
      expect(pasqua(anno)).toEqual(new Date(anno, mese, giorno));
    });

    it('follows the Easter of each year, not a fixed date', () => {
      expect(inStagione('pasqua', new Date(2025, 3, 14))).toBe(true); // Easter 2025 is April 20
      expect(inStagione('pasqua', new Date(2026, 3, 14))).toBe(false); // Easter 2026 is April 5
    });

    it('falls back to the system preference when the saved seasonal theme is out of season', () => {
      localStorage.setItem(KEY, 'natale-scuro');
      preferenzaSistema(true);
      oggi(7, 15);

      expect(crea().tema()).toBe('dark');
    });

    it('keeps the saved seasonal theme in season', () => {
      localStorage.setItem(KEY, 'halloween');
      oggi(10, 31);

      expect(crea().tema()).toBe('halloween');
    });
  });

  describe('periodi dal server', () => {
    const caricamento = (service: ThemeService) => service.caricaPeriodi();

    it('uses the periods received from the server', async () => {
      oggi(11, 2);
      const service = crea();
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush(periodiServer());
      await attesa;

      expect(service.disponibile('halloween')).toBe(true);
      expect(service.periodi()).toEqual(periodiServer());
    });

    it('keeps the predefined periods when the request fails', async () => {
      const service = crea();
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush('errore', { status: 500, statusText: 'Server Error' });
      await attesa;

      expect(service.periodi()).toEqual(PERIODI_PREDEFINITI);
      expect(service.disponibile('halloween')).toBe(true);
    });

    it('keeps the predefined periods when the answer is incomplete', async () => {
      const service = crea();
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush([PERIODI_PREDEFINITI[0]]);
      await attesa;

      expect(service.periodi()).toEqual(PERIODI_PREDEFINITI);
    });

    it('keeps the predefined periods when the answer is not a list', async () => {
      const service = crea();
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush({ non: 'una lista' });
      await attesa;

      expect(service.periodi()).toEqual(PERIODI_PREDEFINITI);
    });

    it('makes a seasonal theme unavailable when its period is disabled', async () => {
      const service = crea();
      const attesa = caricamento(service);
      const disattivati = periodiServer().map((p) => (p.chiave === 'halloween' ? { ...p, attivo: false } : p));

      http.expectOne(`${API}/api/temi/periodi`).flush(disattivati);
      await attesa;

      expect(service.disponibile('halloween')).toBe(false);
      expect(service.disponibile('natale')).toBe(false);
      expect(service.disponibile('light')).toBe(true);
    });

    it('recomputes the theme with the loaded periods when the user has not chosen one', async () => {
      oggi(11, 2);
      preferenzaSistema(false);
      localStorage.setItem(KEY, 'halloween');
      const service = crea();
      expect(service.tema()).toBe('light'); // with the predefined periods Halloween is over on 2 November
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush(periodiServer());
      await attesa;

      expect(service.tema()).toBe('halloween');
    });

    it('does not override a theme chosen by the user', async () => {
      oggi(11, 2);
      const service = crea();
      service.imposta('dark');
      const attesa = caricamento(service);

      http.expectOne(`${API}/api/temi/periodi`).flush(periodiServer());
      await attesa;

      expect(service.tema()).toBe('dark');
    });
  });

  describe('inStagione con periodi espliciti', () => {
    const conPasqua = (prima: number, dopo: number): PeriodoTema[] =>
      PERIODI_PREDEFINITI.map((p) => (p.chiave === 'pasqua' ? { ...p, giorniPrimaPasqua: prima, giorniDopoPasqua: dopo } : p));

    it('uses the configured days around Easter', () => {
      // Easter 2026 is April 5
      const periodi = conPasqua(0, 0);

      expect(inStagione('pasqua', new Date(2026, 3, 4), periodi)).toBe(false);
      expect(inStagione('pasqua', new Date(2026, 3, 5), periodi)).toBe(true);
      expect(inStagione('pasqua', new Date(2026, 3, 6), periodi)).toBe(false);
    });

    it('lets the dark Christmas theme follow the Christmas period', () => {
      const periodi = PERIODI_PREDEFINITI.map((p) => (p.chiave === 'natale' ? { ...p, attivo: false } : p));

      expect(inStagione('natale-scuro', new Date(2026, 11, 20), periodi)).toBe(false);
      expect(inStagione('natale', new Date(2026, 11, 20), periodi)).toBe(false);
    });
  });

  describe('scuro', () => {
    it('is true only for the plain dark theme', () => {
      const service = crea();

      service.imposta('dark');
      expect(service.scuro()).toBe(true);

      service.imposta('halloween');
      expect(service.scuro()).toBe(false);

      service.imposta('light');
      expect(service.scuro()).toBe(false);
    });
  });

  describe('document class', () => {
    const ha = (classe: string) => document.documentElement.classList.contains(classe);

    it('applies only the dark class for the dark theme', () => {
      localStorage.setItem(KEY, 'dark');
      crea();
      TestBed.tick();

      expect(ha('app-dark')).toBe(true);
      expect(ha('app-halloween')).toBe(false);
    });

    it('applies the dark and the Halloween classes for the Halloween theme', () => {
      localStorage.setItem(KEY, 'halloween');
      crea();
      TestBed.tick();

      expect(ha('app-dark')).toBe(true);
      expect(ha('app-halloween')).toBe(true);
    });

    it('applies only the Christmas class for the light Christmas theme', () => {
      oggi(12, 20);
      localStorage.setItem(KEY, 'natale');
      crea();
      TestBed.tick();

      expect(ha('app-natale')).toBe(true);
      expect(ha('app-dark')).toBe(false);
      expect(ha('app-natale-scuro')).toBe(false);
    });

    it('applies the dark and the dark Christmas classes for the dark Christmas theme', () => {
      oggi(12, 20);
      localStorage.setItem(KEY, 'natale-scuro');
      crea();
      TestBed.tick();

      expect(ha('app-natale-scuro')).toBe(true);
      expect(ha('app-dark')).toBe(true);
      expect(ha('app-natale')).toBe(false);
    });

    it.each([
      ['pasqua', 'app-pasqua', 4, 1],
      ['ferragosto', 'app-ferragosto', 8, 10],
    ] as const)('applies only its own class for the light %s theme', (tema, classe, mese, giorno) => {
      oggi(mese, giorno);
      localStorage.setItem(KEY, tema);
      crea();
      TestBed.tick();

      expect(ha(classe)).toBe(true);
      expect(ha('app-dark')).toBe(false);
    });

    it('removes the classes when going back to light', () => {
      localStorage.setItem(KEY, 'halloween');
      const service = crea();
      TestBed.tick();

      service.imposta('light');
      TestBed.tick();

      expect(CLASSI.some(ha)).toBe(false);
    });
  });

  describe('imposta', () => {
    it('switches the theme and saves the choice', () => {
      const service = crea();

      service.imposta('halloween');
      expect(service.tema()).toBe('halloween');
      expect(localStorage.getItem(KEY)).toBe('halloween');

      service.imposta('dark');
      expect(service.tema()).toBe('dark');
      expect(localStorage.getItem(KEY)).toBe('dark');
    });

    it('still switches when the preference cannot be saved', () => {
      const service = crea();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      expect(() => service.imposta('dark')).not.toThrow();
      expect(service.scuro()).toBe(true);
    });
  });
});
