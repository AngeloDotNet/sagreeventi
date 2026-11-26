import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EventiStore } from '../../../core/eventi-store/eventi-store.service';
import { GeocodingService } from '../../../core/geocoding/geocoding.service';
import { EventoLocale } from '../../../core/models/models';
import { PermessiService } from '../../../core/permessi/permessi.service';
import { EventoFormComponent } from './evento-form.component';

const TESTO_AVVISO =
  'La segnalazione sarà visibile a tutti solo dopo la verifica degli amministratori, per evitare spam e contenuti non idonei.';

describe('EventoFormComponent moderation notice', () => {
  const moderatore = signal(false);
  const esistente: EventoLocale = {
    id: 'a',
    nomeEvento: 'Sagra della castagna',
    cittaEvento: 'Soriano',
    dataInizioEvento: '2026-10-24T00:00:00',
    dataFineEvento: '2026-10-26T00:00:00',
    descrizioneEvento: 'Caldarroste e vino novello',
    eventoConcluso: false,
    dataOraUltimaModifica: '2026-10-01T10:00:00Z',
    stato: 'Approvato',
  };

  const crea = (id?: string): HTMLElement => {
    const fixture: ComponentFixture<EventoFormComponent> = TestBed.createComponent(EventoFormComponent);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    // The notice lives in the last step of the stepper
    fixture.componentInstance['passo'].set(3);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const avviso = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('p-message')).find((m) => m.textContent?.includes('verifica degli amministratori'));

  beforeEach(() => {
    moderatore.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MessageService,
        { provide: PermessiService, useValue: { puoModificare: () => moderatore() } },
        {
          provide: EventiStore,
          useValue: { citta: signal<string[]>([]), trova: (id: string) => (id === esistente.id ? esistente : undefined) },
        },
      ],
    });
  });

  it('is shown above the buttons on a new report from someone who cannot moderate', () => {
    const el = crea();

    const riquadro = avviso(el);
    expect(riquadro?.textContent?.replace(/\s+/g, ' ').trim()).toBe(TESTO_AVVISO);
    // The notice comes before the submit buttons
    const azioni = el.querySelector('.form-azioni');
    expect(riquadro && azioni && riquadro.compareDocumentPosition(azioni) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is not shown to an Admin or Editor, whose reports are published at once', () => {
    moderatore.set(true);

    expect(avviso(crea())).toBeUndefined();
  });

  it('is not shown when editing an existing event', () => {
    moderatore.set(true);

    expect(avviso(crea('a'))).toBeUndefined();
  });

  it('is not shown when editing, even without moderation rights', () => {
    expect(avviso(crea('a'))).toBeUndefined();
  });
});

describe('EventoFormComponent posizione', () => {
  const posizionato: EventoLocale = {
    id: 'a',
    nomeEvento: 'Sagra della castagna',
    cittaEvento: 'Soriano',
    indirizzo: 'Piazza Municipio 1',
    latitudine: 41.5,
    longitudine: 12.25,
    dataInizioEvento: '2026-10-24T00:00:00',
    dataFineEvento: '2026-10-26T00:00:00',
    descrizioneEvento: 'Caldarroste e vino novello',
    eventoConcluso: false,
    dataOraUltimaModifica: '2026-10-01T10:00:00Z',
    stato: 'Approvato',
  };

  /** Store finto: registra le segnalazioni create, senza rete né storage. */
  const store = {
    citta: signal<string[]>([]),
    online: signal(true),
    trova: (id: string) => (id === posizionato.id ? posizionato : undefined),
    crea: vi.fn(() => ({ id: 'nuovo' })),
    aggiorna: vi.fn(),
    sincronizza: vi.fn(() => Promise.resolve(true)),
  };

  /** Il form è `protected`: lo si legge con la notazione a indice, come fa lo strumento di test di Angular. */
  const avvia = (id?: string): ComponentFixture<EventoFormComponent> => {
    const fixture = TestBed.createComponent(EventoFormComponent);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  };

  const compila = (fixture: ComponentFixture<EventoFormComponent>, valori: Record<string, unknown>) => {
    const form = fixture.componentInstance['form'];
    form.patchValue({
      nomeEvento: 'Sagra della castagna',
      cittaEvento: 'Soriano',
      dataInizioEvento: new Date(2026, 9, 24),
      dataFineEvento: new Date(2026, 9, 26),
      descrizioneEvento: 'Caldarroste e vino novello',
      ...valori,
    });
  };

  /** Shows a step of the stepper: messages are rendered inside the panel of their step, and only the last step saves. */
  const vai = (fixture: ComponentFixture<EventoFormComponent>, passo: 1 | 2 | 3) => {
    fixture.componentInstance['passo'].set(passo);
    fixture.detectChanges();
  };

  const testo = (fixture: ComponentFixture<EventoFormComponent>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

  /** Servizio di ricerca finto: nessuna chiamata a Nominatim dai test. */
  const geocoding = { cerca: vi.fn() };

  beforeEach(() => {
    store.crea.mockClear();
    geocoding.cerca.mockReset();
    TestBed.configureTestingModule({
      providers: [
        // Il salvataggio naviga alla pagina dell'evento: una rotta generica evita un rifiuto di navigazione non gestito
        provideRouter([{ path: '**', children: [] }]),
        MessageService,
        { provide: PermessiService, useValue: { puoModificare: () => true } },
        { provide: EventiStore, useValue: store },
        { provide: GeocodingService, useValue: geocoding },
      ],
    });
  });

  describe('ricerca sulla mappa', () => {
    it('fills the coordinates with the first result and shows where it was found', async () => {
      geocoding.cerca.mockResolvedValue({ latitudine: 41.5, longitudine: 12.25, nome: 'Piazza Municipio 1, Soriano nel Cimino' });
      const fixture = avvia();
      compila(fixture, { indirizzo: 'Piazza Municipio 1' });
      vai(fixture, 2);

      await fixture.componentInstance['trovaSullaMappa']();
      fixture.detectChanges();

      expect(geocoding.cerca).toHaveBeenCalledWith('Piazza Municipio 1, Soriano');
      expect(fixture.componentInstance['form'].controls.latitudine.value).toBe(41.5);
      expect(fixture.componentInstance['form'].controls.longitudine.value).toBe(12.25);
      expect(testo(fixture)).toContain('Trovato: Piazza Municipio 1, Soriano nel Cimino');
    });

    it('searches by city alone when the address is empty', async () => {
      geocoding.cerca.mockResolvedValue(null);
      const fixture = avvia();
      compila(fixture, { indirizzo: '' });

      await fixture.componentInstance['trovaSullaMappa']();

      expect(geocoding.cerca).toHaveBeenCalledWith('Soriano');
    });

    it('does not search without a city', () => {
      const fixture = avvia();
      compila(fixture, { cittaEvento: '   ' });

      void fixture.componentInstance['trovaSullaMappa']();

      expect(geocoding.cerca).not.toHaveBeenCalled();
    });

    it('says when nothing was found and keeps the coordinates empty', async () => {
      geocoding.cerca.mockResolvedValue(null);
      const fixture = avvia();
      compila(fixture, { indirizzo: 'Via che non esiste' });
      vai(fixture, 2);

      await fixture.componentInstance['trovaSullaMappa']();
      fixture.detectChanges();

      expect(testo(fixture)).toContain('Nessun risultato per questo indirizzo');
      expect(fixture.componentInstance['form'].controls.latitudine.value).toBeNull();
    });

    it('says when the search is not available and lets the user save without a position', async () => {
      geocoding.cerca.mockRejectedValue(new Error('rete assente'));
      const fixture = avvia();
      compila(fixture, { indirizzo: 'Piazza Municipio 1' });
      vai(fixture, 2);

      await fixture.componentInstance['trovaSullaMappa']();
      fixture.detectChanges();
      expect(testo(fixture)).toContain('La ricerca non è disponibile adesso');

      vai(fixture, 3);
      fixture.componentInstance['salva']();

      expect(store.crea).toHaveBeenCalledWith(expect.objectContaining({ latitudine: null, longitudine: null }));
    });

    it('moves the point to the position touched on the map', () => {
      const fixture = avvia();

      fixture.componentInstance['sposta']({ latitudine: 41.123457, longitudine: 12.5 });

      expect(fixture.componentInstance['form'].controls.latitudine.value).toBe(41.123457);
      expect(fixture.componentInstance['form'].controls.longitudine.value).toBe(12.5);
    });

    it('shows a name returned by the search as text, never as HTML', async () => {
      geocoding.cerca.mockResolvedValue({ latitudine: 41.5, longitudine: 12.25, nome: '<img src="x" onerror="alert(1)">' });
      const fixture = avvia();
      compila(fixture, { indirizzo: 'Piazza Municipio 1' });
      vai(fixture, 2);

      await fixture.componentInstance['trovaSullaMappa']();
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
      expect(testo(fixture)).toContain('<img src="x" onerror="alert(1)">');
    });
  });

  it('shows the address and the coordinates of an event when editing', () => {
    const form = avvia('a').componentInstance['form'];

    expect(form.controls.indirizzo.value).toBe('Piazza Municipio 1');
    expect(form.controls.latitudine.value).toBe(41.5);
    expect(form.controls.longitudine.value).toBe(12.25);
  });


  it('sends the trimmed address and the coordinates with a new report', () => {
    const fixture = avvia();
    compila(fixture, { indirizzo: '  Piazza Municipio 1  ', latitudine: 41.5, longitudine: 12.25 });
    vai(fixture, 3);

    fixture.componentInstance['salva']();

    expect(store.crea).toHaveBeenCalledWith(
      expect.objectContaining({ indirizzo: 'Piazza Municipio 1', latitudine: 41.5, longitudine: 12.25 }),
    );
  });

  it('sends no address and no coordinates when they are left empty', () => {
    const fixture = avvia();
    compila(fixture, { indirizzo: '   ' });
    vai(fixture, 3);

    fixture.componentInstance['salva']();

    expect(store.crea).toHaveBeenCalledWith(expect.objectContaining({ indirizzo: null, latitudine: null, longitudine: null }));
  });

  it('refuses an address with control characters and says why', () => {
    const fixture = avvia();
    compila(fixture, { indirizzo: 'Via\nRoma' });
    fixture.componentInstance['form'].markAllAsTouched();
    vai(fixture, 2);

    expect(testo(fixture)).toContain('caratteri non ammessi');
    vai(fixture, 3);
    fixture.componentInstance['salva']();
    expect(store.crea).not.toHaveBeenCalled();
  });

  it('refuses an address over 200 characters', () => {
    const fixture = avvia();
    compila(fixture, { indirizzo: 'a'.repeat(201) });
    fixture.componentInstance['form'].markAllAsTouched();
    vai(fixture, 2);

    expect(testo(fixture)).toContain('Al massimo 200 caratteri.');
    vai(fixture, 3);
    fixture.componentInstance['salva']();
    expect(store.crea).not.toHaveBeenCalled();
  });

  it('asks for latitude and longitude together', () => {
    const fixture = avvia();
    compila(fixture, { latitudine: 41.5, longitudine: null });
    fixture.componentInstance['form'].markAllAsTouched();
    vai(fixture, 2);

    expect(testo(fixture)).toContain('Indica latitudine e longitudine insieme');
    vai(fixture, 3);
    fixture.componentInstance['salva']();
    expect(store.crea).not.toHaveBeenCalled();
  });

  it('refuses a latitude out of range', () => {
    const fixture = avvia();
    compila(fixture, { latitudine: 91, longitudine: 12 });
    fixture.componentInstance['form'].markAllAsTouched();
    fixture.componentInstance['coordinateAperte'].set(true);
    vai(fixture, 2);

    expect(testo(fixture)).toContain('La latitudine va da -90 a 90');
  });

  it('refuses a longitude with more than 6 decimals', () => {
    const fixture = avvia();
    compila(fixture, { latitudine: 41.5, longitudine: 12.1234567 });
    fixture.componentInstance['form'].markAllAsTouched();
    fixture.componentInstance['coordinateAperte'].set(true);
    vai(fixture, 2);

    expect(testo(fixture)).toContain('La longitudine va da -180 a 180');
  });

  it('keeps an address written as markup as plain text, sent unchanged', () => {
    const fixture = avvia();
    const malevolo = '<img src="x" onerror="alert(1)">';
    compila(fixture, { indirizzo: malevolo });
    vai(fixture, 3);

    fixture.componentInstance['salva']();
    fixture.detectChanges();

    expect(store.crea).toHaveBeenCalledWith(expect.objectContaining({ indirizzo: malevolo }));
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
  });
});

describe('EventoFormComponent passi', () => {
  const esistente: EventoLocale = {
    id: 'a',
    nomeEvento: 'Sagra della castagna',
    cittaEvento: 'Soriano',
    dataInizioEvento: '2026-10-24T00:00:00',
    dataFineEvento: '2026-10-26T00:00:00',
    descrizioneEvento: 'Caldarroste e vino novello',
    eventoConcluso: false,
    dataOraUltimaModifica: '2026-10-01T10:00:00Z',
    stato: 'Approvato',
  };

  const store = {
    citta: signal<string[]>([]),
    online: signal(true),
    trova: (id: string) => (id === esistente.id ? esistente : undefined),
    crea: vi.fn(() => ({ id: 'nuovo' })),
    aggiorna: vi.fn(),
    sincronizza: vi.fn(() => Promise.resolve(true)),
  };

  const avvia = (id?: string): ComponentFixture<EventoFormComponent> => {
    const fixture = TestBed.createComponent(EventoFormComponent);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  };

  const passo = (fixture: ComponentFixture<EventoFormComponent>) => fixture.componentInstance['passo']();
  const testo = (fixture: ComponentFixture<EventoFormComponent>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

  /** Fills the required fields of every step with valid values. */
  const compila = (fixture: ComponentFixture<EventoFormComponent>, valori: Record<string, unknown> = {}) => {
    fixture.componentInstance['form'].patchValue({
      nomeEvento: 'Sagra della castagna',
      cittaEvento: 'Soriano',
      dataInizioEvento: new Date(2026, 9, 24),
      dataFineEvento: new Date(2026, 9, 26),
      descrizioneEvento: 'Caldarroste e vino novello',
      ...valori,
    });
  };

  beforeEach(() => {
    store.crea.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        MessageService,
        { provide: PermessiService, useValue: { puoModificare: () => true } },
        { provide: EventiStore, useValue: store },
        { provide: GeocodingService, useValue: { cerca: vi.fn() } },
      ],
    });
  });

  it('stays on the first step while it is invalid and shows what is missing', () => {
    const fixture = avvia();

    fixture.componentInstance['avanti']();
    fixture.detectChanges();

    expect(passo(fixture)).toBe(1);
    expect(testo(fixture)).toContain("Il nome dell'evento è obbligatorio.");
    expect(testo(fixture)).toContain('La città è obbligatoria.');
  });

  it('moves to the second step when the first is valid, and unlocks it', () => {
    const fixture = avvia();
    compila(fixture);

    fixture.componentInstance['avanti']();

    expect(passo(fixture)).toBe(2);
    expect(fixture.componentInstance['passoMassimo']()).toBe(2);
  });

  it('lets the optional second step be skipped when it is empty', () => {
    const fixture = avvia();
    compila(fixture);
    fixture.componentInstance['avanti']();

    fixture.componentInstance['avanti']();

    expect(passo(fixture)).toBe(3);
  });

  it('does not leave the second step with a single coordinate, and opens the manual fields', () => {
    const fixture = avvia();
    compila(fixture, { latitudine: 41.5, longitudine: null });
    fixture.componentInstance['avanti']();

    fixture.componentInstance['avanti']();

    expect(passo(fixture)).toBe(2);
    expect(fixture.componentInstance['coordinateAperte']()).toBe(true);
  });

  it('does not allow jumping to a later step while creating', () => {
    const fixture = avvia();

    fixture.componentInstance['vaiAlPasso'](3);
    fixture.componentInstance['vaiAlPasso'](undefined);

    expect(passo(fixture)).toBe(1);
  });

  it('allows every step at once when editing', () => {
    const fixture = avvia('a');

    fixture.componentInstance['vaiAlPasso'](3);

    expect(fixture.componentInstance['passoMassimo']()).toBe(3);
    expect(passo(fixture)).toBe(3);
  });

  it('goes back without validating', () => {
    const fixture = avvia();
    compila(fixture);
    fixture.componentInstance['avanti']();
    fixture.componentInstance['form'].patchValue({ nomeEvento: '' });

    fixture.componentInstance['indietro']();

    expect(passo(fixture)).toBe(1);
  });

  it('moves forward instead of saving when submitted from an earlier step', () => {
    const fixture = avvia();
    compila(fixture);

    fixture.componentInstance['salva']();

    expect(store.crea).not.toHaveBeenCalled();
    expect(passo(fixture)).toBe(2);
  });

  it('takes the user back to the first step with errors when the final submit is refused', () => {
    const fixture = avvia();
    compila(fixture, { indirizzo: 'a'.repeat(201) });
    fixture.componentInstance['passo'].set(3);

    fixture.componentInstance['salva']();

    expect(store.crea).not.toHaveBeenCalled();
    expect(passo(fixture)).toBe(2);
  });

  it('summarises the data in the last step', () => {
    const fixture = avvia();
    compila(fixture);
    fixture.componentInstance['passo'].set(3);
    fixture.detectChanges();

    const t = testo(fixture);
    expect(t).toContain('Sagra della castagna');
    expect(t).toContain('dal 24/10/2026 al 26/10/2026');
    expect(t).toContain('Non indicato');
    expect(t).toContain('Non indicata');
  });

  it('says the position is set once the coordinates are filled', () => {
    const fixture = avvia();
    compila(fixture, { latitudine: 41.5, longitudine: 12.25, indirizzo: 'Piazza Municipio 1' });
    fixture.componentInstance['passo'].set(3);
    fixture.detectChanges();

    expect(testo(fixture)).toContain('Indicata sulla mappa');
    expect(testo(fixture)).toContain('Piazza Municipio 1');
  });

  it('shows hostile text in the summary as plain text, never as HTML', () => {
    const fixture = avvia();
    const malevolo = '<img src="x" onerror="alert(1)">';
    compila(fixture, { nomeEvento: malevolo, cittaEvento: malevolo });
    fixture.componentInstance['passo'].set(3);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
    expect(testo(fixture)).toContain(malevolo);
  });
});
