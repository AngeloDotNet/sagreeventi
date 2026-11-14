import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { MessageService } from 'primeng/api';
import { EventiStore } from '../../../core/eventi-store/eventi-store.service';
import { EventoLocale } from '../../../core/models/models';
import { PermessiService } from '../../../core/permessi/permessi.service';
import { EventoDetailComponent } from './evento-detail.component';

/** Evento di prova con posizione facoltativa: senza coordinate il dettaglio non mostra la mappa. */
const eventoConPosizione = (parziale: Partial<EventoLocale> = {}): EventoLocale => ({
  id: 'a',
  nomeEvento: 'Sagra della castagna',
  cittaEvento: 'Soriano nel Cimino',
  dataInizioEvento: '2026-10-24T00:00:00',
  dataFineEvento: '2026-10-26T00:00:00',
  descrizioneEvento: 'Caldarroste e vino novello',
  eventoConcluso: false,
  dataOraUltimaModifica: '2026-10-01T10:00:00Z',
  stato: 'Approvato',
  ...parziale,
});

describe('EventoDetailComponent posizione', () => {
  const crea = (evento: EventoLocale): ComponentFixture<EventoDetailComponent> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MessageService,
        { provide: EventiStore, useValue: { trova: () => evento, sincronizzando: signal(false), sincronizza: () => undefined } },
        { provide: PermessiService, useValue: { puoModificare: signal(false) } },
      ],
    });
    const fixture = TestBed.createComponent(EventoDetailComponent);
    fixture.componentRef.setInput('id', 'a');
    fixture.detectChanges();
    return fixture;
  };

  const linkMappa = (fixture: ComponentFixture<EventoDetailComponent>) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a')).find((a) =>
      a.textContent?.includes('Apri la mappa'),
    );

  it('shows the map when the event has coordinates, and the link to the exact point', () => {
    const fixture = crea(eventoConPosizione({ latitudine: 41.5, longitudine: 12.25 }));

    expect((fixture.nativeElement as HTMLElement).querySelector('app-mappa')).not.toBeNull();
    expect(linkMappa(fixture)?.href).toContain('query=41.5%2C12.25');
  });

  it('shows no map and links to the city when the event has no coordinates', () => {
    const fixture = crea(eventoConPosizione());

    expect((fixture.nativeElement as HTMLElement).querySelector('app-mappa')).toBeNull();
    expect(linkMappa(fixture)?.href).toContain(`query=${encodeURIComponent('Soriano nel Cimino')}`);
  });

  it('shows the address when the event has one', () => {
    const fixture = crea(eventoConPosizione({ indirizzo: 'Piazza Municipio 1' }));

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Piazza Municipio 1');
  });

  it('has no serious accessibility violations, with the map shown', async () => {
    const fixture = crea(eventoConPosizione({ indirizzo: 'Piazza Municipio 1', latitudine: 41.5, longitudine: 12.25 }));

    // Il contrasto non si misura in jsdom (non c'è un layout reale): resta verificato a mano sul tema
    const risultati = await axe.run(fixture.nativeElement as HTMLElement, { rules: { 'color-contrast': { enabled: false } } });
    const gravi = risultati.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);

    expect(gravi).toEqual([]);
  });
});

describe('EventoDetailComponent links', () => {
  const evento = (descrizioneEvento: string): EventoLocale => ({
    id: 'a',
    nomeEvento: 'Halloween Night',
    cittaEvento: 'Venegono Inferiore',
    dataInizioEvento: '2026-10-31T00:00:00',
    dataFineEvento: '2026-10-31T00:00:00',
    descrizioneEvento,
    eventoConcluso: false,
    dataOraUltimaModifica: '2026-10-01T10:00:00Z',
    stato: 'Approvato',
  });

  const crea = (descrizione: string): HTMLElement => {
    const trovato = evento(descrizione);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        MessageService,
        { provide: EventiStore, useValue: { trova: () => trovato, sincronizzando: signal(false), sincronizza: () => undefined } },
        { provide: PermessiService, useValue: { puoModificare: signal(false) } },
      ],
    });
    const fixture = TestBed.createComponent(EventoDetailComponent);
    fixture.componentRef.setInput('id', 'a');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const linkNelTesto = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLAnchorElement>('.dettaglio-descrizione a'));
  const pulsante = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLAnchorElement>('.dettaglio-azioni a')).find((a) => a.textContent?.includes('Apri il programma'));

  it('draws an address in the description as a link named after the site, opened in a new tab', () => {
    const el = crea('Il programma è disponibile qui: https://www.comune.example.it/eventi/halloween-1');

    const link = linkNelTesto(el);
    expect(link).toHaveLength(1);
    expect(link[0].textContent?.trim()).toBe('comune.example.it');
    expect(link[0].getAttribute('href')).toBe('https://www.comune.example.it/eventi/halloween-1');
    expect(link[0].getAttribute('target')).toBe('_blank');
    expect(link[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(el.querySelector('.dettaglio-descrizione')?.textContent).toContain('Il programma è disponibile qui: comune.example.it');
  });

  it('shows the "Apri il programma" button, pointing to the only link', () => {
    const el = crea('Programma: https://a.example/programma');

    const bottone = pulsante(el);
    expect(bottone).toBeDefined();
    expect(bottone?.getAttribute('href')).toBe('https://a.example/programma');
    expect(bottone?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('with several links, the button points to the first and every link stays in the text', () => {
    const el = crea('Vedi https://uno.example/x e anche https://due.example/y');

    expect(el.querySelectorAll('.dettaglio-azioni a[href^="https://"]:not([href*="google.com"])')).toHaveLength(1);
    expect(pulsante(el)?.getAttribute('href')).toBe('https://uno.example/x');
    expect(linkNelTesto(el).map((a) => a.textContent?.trim())).toEqual(['uno.example', 'due.example']);
  });

  it('has no button and no link when the description has no address', () => {
    const el = crea('Caldarroste e vino novello');

    expect(pulsante(el)).toBeUndefined();
    expect(linkNelTesto(el)).toHaveLength(0);
    expect(el.querySelector('.dettaglio-descrizione')?.textContent).toBe('Caldarroste e vino novello');
  });

  it('does not turn a javascript: address into a link or a button', () => {
    const el = crea('Clicca javascript:alert(1) oppure data:text/html,<b>x</b>');

    expect(linkNelTesto(el)).toHaveLength(0);
    expect(pulsante(el)).toBeUndefined();
  });

  it('never interprets the description as HTML', () => {
    const el = crea('<img src=x onerror=alert(1)> <script>alert(2)</script> https://a.example/x');

    expect(el.querySelector('.dettaglio-descrizione img')).toBeNull();
    expect(el.querySelector('.dettaglio-descrizione script')).toBeNull();
    expect(el.querySelector('.dettaglio-descrizione')?.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(linkNelTesto(el)).toHaveLength(1);
  });
});
