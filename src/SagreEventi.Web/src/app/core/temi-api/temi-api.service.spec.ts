import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { PeriodoTema, TemiApiService } from './temi-api.service';

const API = 'https://api.test';
const URL = `${API}/api/temi/periodi`;

const periodi: PeriodoTema[] = [
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
    attivo: false,
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

describe('TemiApiService', () => {
  let service: TemiApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ConfigService, useValue: { apiBaseUrl: () => API } }],
    });
    service = TestBed.inject(TemiApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('periodi reads the periods with a GET on the public endpoint', async () => {
    const chiamata = service.periodi();
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('GET');
    req.flush(periodi);

    await expect(chiamata).resolves.toEqual(periodi);
  });

  it('salvaPeriodi sends the periods with a PUT and returns the saved ones', async () => {
    const chiamata = service.salvaPeriodi(periodi);
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(periodi);
    req.flush(periodi);

    await expect(chiamata).resolves.toEqual(periodi);
  });

  it('periodi rejects when the server answers with an error', async () => {
    const chiamata = service.periodi();
    http.expectOne(URL).flush('errore', { status: 500, statusText: 'Server Error' });

    await expect(chiamata).rejects.toBeTruthy();
  });
});
