import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  AfterViewInit,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ConfigService } from '../../core/config/config.service';

type Leaflet = typeof import('leaflet');
type MappaLeaflet = import('leaflet').Map;
type Segnaposto = import('leaflet').Marker;

/** Centro di partenza senza posizione: tutta Italia. */
const CENTRO_ITALIA: [number, number] = [41.9, 12.5];

const ZOOM_PUNTO = 16;
const ZOOM_ITALIA = 5;

/** Attribuzione OpenStreetMap, obbligatoria con le tile OSM. Testo fisso nel codice, mai da configurazione. */
const ATTRIBUZIONE =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/** Coordinata nella scala del server (6 decimali). */
const arrotonda = (valore: number): number => Math.round(valore * 1_000_000) / 1_000_000;

/**
 * Mappa con un punto. In sola lettura mostra la posizione dell'evento; con `modificabile` l'utente sposta il punto
 * toccando la mappa o trascinando il segnaposto (la tastiera usa i campi delle coordinate del form).
 * Leaflet si carica solo quando il componente è visualizzato. Il testo con le coordinate c'è sempre.
 */
@Component({
  selector: 'app-mappa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mappa.component.html',
  styleUrl: './mappa.component.css',
})
export class MappaComponent implements AfterViewInit {
  /** Latitudine in gradi, o `null` se il punto non c'è. */
  readonly latitudine = input<number | null>(null);
  /** Longitudine in gradi, o `null` se il punto non c'è. */
  readonly longitudine = input<number | null>(null);
  /** Nome accessibile della mappa, es. «Posizione di Sagra della castagna». */
  readonly etichetta = input.required<string>();
  /** Se vero, l'utente può spostare il punto: l'evento `sposta` porta le nuove coordinate. */
  readonly modificabile = input(false);
  /** Nuova posizione scelta dall'utente sulla mappa. */
  readonly sposta = output<{ latitudine: number; longitudine: number }>();

  private readonly contenitore = viewChild.required<ElementRef<HTMLElement>>('contenitore');
  private readonly config = inject(ConfigService);
  private readonly destroyRef = inject(DestroyRef);

  private leaflet?: Leaflet;
  private mappa?: MappaLeaflet;
  private segnaposto?: Segnaposto;

  /** Leaflet non si è caricato (rete assente o blocco): resta solo il testo. */
  protected readonly errore = signal(false);

  /** Testo alternativo sempre presente: le coordinate, o l'invito a indicare il punto. */
  protected readonly testo = computed(() => {
    const lat = this.latitudine();
    const lng = this.longitudine();
    if (lat === null || lng === null) {
      return this.modificabile() ? 'Nessuna posizione indicata: tocca la mappa per indicarla.' : 'Posizione non indicata.';
    }
    return `Posizione: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });

  constructor() {

    effect(() => {
      const lat = this.latitudine();
      const lng = this.longitudine();
      untracked(() => this.mostraPunto(lat, lng));
    });

    effect(() => {
      const modificabile = this.modificabile();
      untracked(() => this.segnaposto?.dragging?.[modificabile ? 'enable' : 'disable']());
    });

    this.destroyRef.onDestroy(() => this.mappa?.remove());
  }

  /** La vista è pronta: si crea la mappa nel contenitore (Leaflet ha bisogno del suo elemento nel DOM). */
  ngAfterViewInit(): void {
    void this.avvia();
  }

  private async avvia(): Promise<void> {
    try {
      this.leaflet = await import('leaflet');
      const L = this.leaflet;
      this.mappa = L.map(this.contenitore().nativeElement, { attributionControl: true }).setView(CENTRO_ITALIA, ZOOM_ITALIA);
      L.tileLayer(this.config.mappa().tileUrl, { maxZoom: 19, attribution: ATTRIBUZIONE }).addTo(this.mappa);

      if (this.modificabile()) {
        this.mappa.on('click', (evento) =>
          this.sposta.emit({ latitudine: arrotonda(evento.latlng.lat), longitudine: arrotonda(evento.latlng.lng) }),
        );
      }

      this.mostraPunto(this.latitudine(), this.longitudine());
    } catch {
      // Leaflet non caricato o mappa non creabile: resta il testo con le coordinate
      this.errore.set(true);
    }
  }

  /** Posiziona il segnaposto e centra la mappa; senza coordinate toglie il segnaposto. */
  private mostraPunto(lat: number | null, lng: number | null): void {
    if (!this.leaflet || !this.mappa) return;
    if (lat === null || lng === null) {
      this.segnaposto?.remove();
      this.segnaposto = undefined;
      return;
    }

    if (!this.segnaposto) {
      this.segnaposto = this.leaflet
        .marker([lat, lng], {
          icon: this.leaflet.divIcon({
            className: 'mappa-pin',
            html: '<span aria-hidden="true"></span>',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          }),
          draggable: this.modificabile(),
          title: 'Posizione dell’evento',
        })
        .addTo(this.mappa);
      this.segnaposto.on('dragend', () => {
        const punto = this.segnaposto?.getLatLng();
        if (punto) this.sposta.emit({ latitudine: arrotonda(punto.lat), longitudine: arrotonda(punto.lng) });
      });
    } else {
      this.segnaposto.setLatLng([lat, lng]);
    }
    this.mappa.setView([lat, lng], ZOOM_PUNTO);
  }
}
