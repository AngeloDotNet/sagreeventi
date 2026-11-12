import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { PeriodoTema, TemiApiService } from '../../../core/temi-api/temi-api.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { TemiAdminComponent } from './temi-admin.component';

/** Periods as the server returns them, in any order (the form shows them in its own order). */
const periodiServer = (): PeriodoTema[] => [
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
];

/** Error of the API as Angular receives it: a ProblemDetails with the field errors. */
const erroreValidazione = (errors: Record<string, string[]>): HttpErrorResponse =>
  new HttpErrorResponse({ status: 400, statusText: 'Bad Request', error: { title: 'Dati non validi', errors } });

describe('TemiAdminComponent', () => {
  let fixture: ComponentFixture<TemiAdminComponent>;
  let servizio: { periodi: ReturnType<typeof vi.fn>; salvaPeriodi: ReturnType<typeof vi.fn> };
  let tema: { caricaPeriodi: ReturnType<typeof vi.fn> };

  const testo = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const titoli = (): string[] => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h2')).map((h) => h.textContent.trim());

  /** Creates the component and waits for the first load of the periods. */
  const crea = async (): Promise<void> => {
    fixture = TestBed.createComponent(TemiAdminComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    servizio = {
      periodi: vi.fn().mockResolvedValue(periodiServer()),
      salvaPeriodi: vi.fn().mockImplementation((periodi: PeriodoTema[]) => Promise.resolve(periodi)),
    };
    tema = { caricaPeriodi: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [MessageService, { provide: TemiApiService, useValue: servizio }, { provide: ThemeService, useValue: tema }],
    });
  });

  it('shows the four periods in the order Pasqua, Ferragosto, Halloween, Natale', async () => {
    await crea();

    expect(titoli()).toEqual(['Pasqua', 'Ferragosto', 'Halloween', 'Natale']);
  });

  it('explains that the Easter dates are recalculated every year', async () => {
    await crea();

    expect(testo()).toContain('Le date esatte si ricalcolano da sole ogni anno');
  });

  it('says that the Christmas period covers both Christmas themes', async () => {
    await crea();

    expect(testo()).toContain('sia per il tema Natale chiaro sia per quello scuro');
  });

  it('saves the four periods in form order, with the change made in the form', async () => {
    await crea();

    fixture.componentInstance.imposta(1, { giornoInizio: 5 });
    await fixture.componentInstance.salva();

    const inviati = servizio.salvaPeriodi.mock.calls[0][0] as PeriodoTema[];
    expect(inviati.map((p) => p.chiave)).toEqual(['pasqua', 'ferragosto', 'halloween', 'natale']);
    expect(inviati[1].giornoInizio).toBe(5);
  });

  it('reloads the theme periods after a successful save', async () => {
    await crea();

    await fixture.componentInstance.salva();

    expect(tema.caricaPeriodi).toHaveBeenCalledOnce();
  });

  it('shows a field error next to the input the server refers to', async () => {
    await crea();
    servizio.salvaPeriodi.mockRejectedValueOnce(
      erroreValidazione({ 'periodi[0].giorniPrimaPasqua': ['Il valore deve essere compreso tra 0 e 14.'] }),
    );

    await fixture.componentInstance.salva();
    fixture.detectChanges();

    expect(fixture.componentInstance.erroreCampo(0, 'giorniPrimaPasqua')).toBe('Il valore deve essere compreso tra 0 e 14.');
    expect(testo()).toContain('Il valore deve essere compreso tra 0 e 14.');
    expect(testo()).toContain('Controlla i campi evidenziati.');
  });

  it('shows an error that is not tied to a field at the top of the page', async () => {
    await crea();
    servizio.salvaPeriodi.mockRejectedValueOnce(erroreValidazione({ periodi: ['Servono esattamente 4 periodi.'] }));

    await fixture.componentInstance.salva();
    fixture.detectChanges();

    expect(testo()).toContain('Servono esattamente 4 periodi.');
  });

  it('shows the text of a server error as plain text, never as HTML', async () => {
    await crea();
    servizio.salvaPeriodi.mockRejectedValueOnce(erroreValidazione({ 'periodi[1].giornoInizio': ['<img src="x" onerror="alert(1)">'] }));

    await fixture.componentInstance.salva();
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('img')).toBeNull();
    expect(testo()).toContain('<img src="x" onerror="alert(1)">');
  });

  it('shows a generic message when the server cannot be reached', async () => {
    await crea();
    servizio.salvaPeriodi.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }));

    await fixture.componentInstance.salva();
    fixture.detectChanges();

    expect(testo()).toContain('Server non raggiungibile.');
  });

  it('shows an error and no period when the first load fails', async () => {
    servizio.periodi.mockRejectedValueOnce(new HttpErrorResponse({ status: 500 }));

    await crea();

    expect(titoli()).toEqual([]);
    expect(testo()).toContain('Impossibile leggere i periodi dei temi.');
  });
});
