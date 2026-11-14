import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MappaComponent } from './mappa.component';

/** Stato condiviso con il finto Leaflet: il test può far fallire la creazione della mappa e leggere i gestori degli eventi. */
const leaflet = vi.hoisted(() => ({
  fallisci: false,
  gestori: {} as Record<string, (evento: { latlng: { lat: number; lng: number } }) => void>,
}));

// jsdom non ha un layout reale: Leaflet si simula, si prova la logica del componente
vi.mock('leaflet', () => {
  const segnaposto = () => {
    const marker = {
      addTo: () => marker,
      setLatLng: () => marker,
      remove: () => marker,
      on: () => marker,
      dragging: { enable: () => undefined, disable: () => undefined },
    };
    return marker;
  };
  const mappa = () => {
    if (leaflet.fallisci) throw new Error('mappa non creabile');
    const map = {
      setView: () => map,
      on: (evento: string, gestore: (e: { latlng: { lat: number; lng: number } }) => void) => {
        leaflet.gestori[evento] = gestore;
        return map;
      },
      remove: () => undefined,
    };
    return map;
  };
  return {
    map: mappa,
    tileLayer: () => ({ addTo: () => ({}) }),
    marker: segnaposto,
    divIcon: () => ({}),
  };
});

describe('MappaComponent', () => {
  let fixture: ComponentFixture<MappaComponent>;

  const crea = async (valori: { latitudine?: number | null; longitudine?: number | null; modificabile?: boolean } = {}) => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(MappaComponent);
    fixture.componentRef.setInput('etichetta', 'Posizione di prova');
    fixture.componentRef.setInput('latitudine', valori.latitudine ?? null);
    fixture.componentRef.setInput('longitudine', valori.longitudine ?? null);
    fixture.componentRef.setInput('modificabile', valori.modificabile ?? false);
    fixture.detectChanges();
    // Le operazioni dopo il render (creazione della mappa) partono solo con un ciclo di render esplicito
    TestBed.tick();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const testo = () => (fixture.nativeElement as HTMLElement).querySelector('.mappa-testo')?.textContent?.trim() ?? '';

  beforeEach(() => {
    leaflet.fallisci = false;
    leaflet.gestori = {};
  });

  it('shows the coordinates as text, so the point is readable without the map', async () => {
    await crea({ latitudine: 41.5, longitudine: 12.25 });

    expect(testo()).toBe('Posizione: 41.500000, 12.250000');
  });

  it('invites to indicate the point when the map is editable and there is none', async () => {
    await crea({ modificabile: true });

    expect(testo()).toBe('Nessuna posizione indicata: tocca la mappa per indicarla.');
  });

  it('says that the point is not indicated in read-only mode', async () => {
    await crea({});

    expect(testo()).toBe('Posizione non indicata.');
  });

  it('keeps the coordinates and says so when the map cannot be created', async () => {
    leaflet.fallisci = true;

    await crea({ latitudine: 41.5, longitudine: 12.25 });

    // Il caricamento di Leaflet è un import dinamico: si attende l'esito, non un tempo fisso
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('.mappa-avviso')?.textContent).toContain('La mappa non si carica adesso');
    });
    expect(testo()).toBe('Posizione: 41.500000, 12.250000');
  });

  it('emits the point touched on the map, rounded to the server scale', async () => {
    await crea({ modificabile: true });
    const ricevuto = vi.fn();
    fixture.componentInstance.sposta.subscribe(ricevuto);
    await vi.waitFor(() => expect(leaflet.gestori['click']).toBeDefined());

    leaflet.gestori['click']({ latlng: { lat: 41.1234567891, lng: 12.5 } });

    expect(ricevuto).toHaveBeenCalledWith({ latitudine: 41.123457, longitudine: 12.5 });
  });
});
