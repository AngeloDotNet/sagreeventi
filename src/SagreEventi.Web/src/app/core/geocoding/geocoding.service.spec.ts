import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { GeocodingService, INTERVALLO_RICERCA_MS, leggiRisultato } from './geocoding.service';

const URL = 'https://search.example.com/search';
const RICHIESTE = (req: { url: string }) => req.url === URL;

const risultato = (parziale: Record<string, unknown> = {}) => [
  { lat: '41.1234567', lon: '12.5', display_name: 'Piazza Municipio 1, Soriano nel Cimino, Italia', ...parziale },
];

describe('GeocodingService', () => {
  let service: GeocodingService;
  let http: HttpTestingController;

  /** La ricerca passa dalla coda: la richiesta parte dopo qualche microtask. Si attende che compaia, senza tempi fissi. */
  const richiesta = async (): Promise<TestRequest> => {
    let trovata: TestRequest | undefined;
    await vi.waitFor(() => {
      trovata = http.expectOne(RICHIESTE);
    });
    return trovata as TestRequest;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { mappa: () => ({ tileUrl: '', nominatimUrl: URL }) } },
      ],
    });
    service = TestBed.inject(GeocodingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('returns the first result with the coordinates on the server scale and its name', async () => {
    const attesa = service.cerca('Piazza Municipio 1, Soriano');

    const req = await richiesta();
    expect(req.request.params.get('q')).toBe('Piazza Municipio 1, Soriano');
    expect(req.request.params.get('format')).toBe('jsonv2');
    expect(req.request.params.get('limit')).toBe('1');
    req.flush(risultato());

    await expect(attesa).resolves.toEqual({ latitudine: 41.123457, longitudine: 12.5, nome: 'Piazza Municipio 1, Soriano nel Cimino, Italia' });
  });

  it('answers a repeated query, even written differently, from the cache', async () => {
    const primo = service.cerca('Via  Roma, Soriano');
    (await richiesta()).flush(risultato());
    await primo;

    await expect(service.cerca('via roma, soriano')).resolves.toMatchObject({ latitudine: 41.123457 });
    http.expectNone(RICHIESTE);
  });

  it('sends nothing and returns null for a blank query', async () => {
    await expect(service.cerca('   ')).resolves.toBeNull();

    http.expectNone(RICHIESTE);
  });

  it('keeps the query as a parameter, never as part of the URL', async () => {
    const malevola = `' OR 1=1 --<script>x</script>`;
    const attesa = service.cerca(malevola);

    const req = await richiesta();
    expect(req.request.url).toBe(URL);
    expect(req.request.params.get('q')).toBe(malevola);
    req.flush([]);

    await expect(attesa).resolves.toBeNull();
  });

  it('returns null when the service finds nothing', async () => {
    const attesa = service.cerca('Via inesistente 999');
    (await richiesta()).flush([]);

    await expect(attesa).resolves.toBeNull();
  });

  it.each([
    ['an object instead of a list', { lat: '41', lon: '12' }],
    ['a list with a null item', [null]],
    ['numbers instead of strings', [{ lat: 41, lon: 12 }]],
    ['a latitude that is not a number', [{ lat: 'abc', lon: '12' }]],
    ['an empty latitude', [{ lat: '', lon: '12' }]],
    ['an infinite latitude', [{ lat: 'Infinity', lon: '12' }]],
    ['a latitude out of range', [{ lat: '91', lon: '12' }]],
    ['a longitude out of range', [{ lat: '41', lon: '181' }]],
  ])('returns null for %s', async (_nome, corpo) => {
    const attesa = service.cerca('Via Roma');
    (await richiesta()).flush(corpo);

    await expect(attesa).resolves.toBeNull();
  });

  it('cuts a very long name and accepts a result without a name', async () => {
    const primo = service.cerca('Via Roma');
    (await richiesta()).flush(risultato({ display_name: 'a'.repeat(300) }));
    const conNome = await primo;

    const secondo = service.cerca('Via Milano');
    (await richiesta()).flush(risultato({ display_name: 5 }));

    expect(conNome?.nome).toHaveLength(200);
    await expect(secondo).resolves.toMatchObject({ nome: '' });
  });

  it('rejects with the HTTP error when the service fails, so the form can say so', async () => {
    const attesa = service.cerca('Via Roma');
    (await richiesta()).flush('servizio fuori uso', { status: 503, statusText: 'Service Unavailable' });

    await expect(attesa).rejects.toBeInstanceOf(HttpErrorResponse);
  });

  it('waits so that two different searches are at least one second apart', async () => {
    vi.useFakeTimers();
    const primo = service.cerca('Via Roma');
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne(RICHIESTE).flush(risultato());
    await primo;

    const secondo = service.cerca('Via Milano');
    await vi.advanceTimersByTimeAsync(INTERVALLO_RICERCA_MS - 1);
    http.expectNone(RICHIESTE);

    await vi.advanceTimersByTimeAsync(1);
    http.expectOne(RICHIESTE).flush(risultato());
    await expect(secondo).resolves.toMatchObject({ latitudine: 41.123457 });
  });
});

describe('leggiRisultato', () => {
  it('rounds the coordinates to 6 decimals and keeps the name', () => {
    expect(leggiRisultato([{ lat: '41.12345678', lon: '-12.9999999', display_name: 'X' }])).toEqual({
      latitudine: 41.123457,
      longitudine: -13,
      nome: 'X',
    });
  });

  it('returns null for anything that is not a list of results', () => {
    expect(leggiRisultato(null)).toBeNull();
    expect(leggiRisultato('[]')).toBeNull();
    expect(leggiRisultato([])).toBeNull();
  });
});
