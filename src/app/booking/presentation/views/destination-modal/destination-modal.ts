import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MapComponent, MarkerComponent } from 'ngx-mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Booking } from '../../../domain/model/booking.entity';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { DestinationQuote } from '../../../infraestructure/bookings-response';
import { toDomainBooking } from '../../../infraestructure/booking-assembler';
import { LocationsApiEndpoint } from '../../../../trip/infrastructure/locations-api-endpoint';

export interface DestinationModalData {
  booking: Booking;
  // 'start': destino previo al inicio del viaje; 'change': cambio con el viaje en curso (con cargo).
  mode: 'start' | 'change';
}

// Se cierra con la reserva actualizada si el destino quedó guardado, o con null si el usuario cancela.
export type DestinationModalResult = Booking | null;

const LIMA_CENTER: [number, number] = [-77.0936, -12.0766];

@Component({
  selector: 'app-destination-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule, MapComponent, MarkerComponent],
  template: `
    <div class="destination-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>place</mat-icon>
          {{ (data.mode === 'change' ? 'booking.destination.titleChange' : 'booking.destination.titleStart') | translate }}
        </h2>
        <button mat-icon-button (click)="close()" [attr.aria-label]="'common.close' | translate">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p class="hint">{{ 'booking.destination.hint' | translate }}</p>

        <div class="map-wrapper">
          <mgl-map
            [style]="'mapbox://styles/mapbox/streets-v12'"
            [zoom]="[14]"
            [center]="center()"
            (mapClick)="onMapClick($event)"
          >
            @if (origin(); as o) {
              <mgl-marker [lngLat]="[o.lng, o.lat]">
                <div class="pin origin-pin"><span>{{ 'booking.destination.origin' | translate }}</span></div>
              </mgl-marker>
            }
            @if (point(); as p) {
              <mgl-marker [lngLat]="[p.lng, p.lat]">
                <div class="pin destination-pin"><span>{{ 'booking.destination.destination' | translate }}</span></div>
              </mgl-marker>
            }
          </mgl-map>
        </div>

        <div class="summary" aria-live="polite">
          @if (!point()) {
            <p class="muted">{{ 'booking.destination.noPoint' | translate }}</p>
          } @else {
            <div class="address">
              <mat-icon>location_on</mat-icon>
              <span>{{ address() }}</span>
            </div>

            @if (loadingQuote()) {
              <p class="muted">{{ 'booking.destination.calculating' | translate }}</p>
            } @else if (quote(); as q) {
              <dl class="metrics">
                <div><dt>{{ 'booking.destination.distance' | translate }}</dt><dd>{{ q.distanceKm | number:'1.1-1' }} km</dd></div>
                <div><dt>{{ 'booking.destination.duration' | translate }}</dt><dd>{{ 'booking.destination.minutes' | translate:{ value: q.durationMinutes } }}</dd></div>
                <div><dt>{{ 'booking.destination.estimatedCost' | translate }}</dt><dd>$ {{ q.estimatedCost | number:'1.2-2' }}</dd></div>
                @if (q.discount > 0) {
                  <div><dt>{{ 'booking.destination.discount' | translate }}</dt><dd>- $ {{ q.discount | number:'1.2-2' }}</dd></div>
                }
                @if (q.changeFee > 0) {
                  <div class="fee"><dt>{{ 'booking.destination.changeFee' | translate }}</dt><dd>+ $ {{ q.changeFee | number:'1.2-2' }}</dd></div>
                }
                <div class="total"><dt>{{ 'booking.destination.total' | translate }}</dt><dd>$ {{ q.total | number:'1.2-2' }}</dd></div>
              </dl>
              <p class="muted note">
                {{ 'booking.destination.estimateNote' | translate }}
                @if (q.changeFee > 0) {
                  {{ 'booking.destination.changeFeeNote' | translate:{ fee: '$ ' + (q.changeFee | number:'1.2-2') } }}
                }
              </p>
            }
          }

          @if (errorMessage()) {
            <p class="error" role="alert">{{ errorMessage() }}</p>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()" [disabled]="saving()">{{ 'common.cancel' | translate }}</button>
        <button mat-flat-button color="primary" (click)="confirm()" [disabled]="!canConfirm()">
          {{ (saving() ? 'booking.destination.saving' : data.mode === 'change' ? 'booking.destination.confirmChange' : 'booking.destination.confirmStart') | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .destination-modal { min-width: 420px; max-width: 560px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { display: flex; align-items: center; gap: 12px; margin: 0; font-size: 1.3rem; color: #333; }
    .hint { margin: 0 0 12px; color: #555; }
    .map-wrapper { height: 300px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
    mgl-map { display: block; height: 100%; width: 100%; }
    .pin { position: relative; padding: 4px 10px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
    .origin-pin { background: #2563eb; }
    .destination-pin { background: #dc2626; }
    .summary { margin-top: 12px; }
    .address { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #111827; margin-bottom: 8px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 0; }
    .metrics div { display: flex; justify-content: space-between; gap: 8px; }
    .metrics dt { color: #6b7280; }
    .metrics dd { margin: 0; font-weight: 600; }
    .metrics .total { grid-column: 1 / -1; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 1.05rem; }
    .metrics .fee dd { color: #b45309; }
    .muted { color: #6b7280; margin: 4px 0; }
    .note { font-size: 12px; }
    .error { color: #b91c1c; margin: 8px 0 0; font-weight: 500; }
    @media (max-width: 480px) { .destination-modal { min-width: 0; } .metrics { grid-template-columns: 1fr; } }
  `]
})
export class DestinationModal implements OnInit {
  private bookingsApi = inject(BookingsApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  origin = signal<{ lat: number; lng: number } | null>(null);
  point = signal<{ lat: number; lng: number } | null>(null);
  address = signal('');
  quote = signal<DestinationQuote | null>(null);
  loadingQuote = signal(false);
  saving = signal(false);
  errorMessage = signal('');
  center = computed<[number, number]>(() => {
    const o = this.origin();
    return o ? [o.lng, o.lat] : LIMA_CENTER;
  });
  // Solo se confirma con un destino válido ya cotizado: un 422 (fuera de cobertura) deja la cotización en null.
  canConfirm = computed(() => !!this.point() && !!this.quote() && !this.loadingQuote() && !this.saving());

  // Descarta respuestas de puntos que el usuario ya reemplazó.
  private selectionToken = 0;

  constructor(
    public dialogRef: MatDialogRef<DestinationModal, DestinationModalResult>,
    @Inject(MAT_DIALOG_DATA) public data: DestinationModalData
  ) {}

  async ngOnInit(): Promise<void> {
    const { booking } = this.data;
    try {
      const station = await firstValueFrom(this.locationsApi.getById(booking.startLocationId));
      this.origin.set({ lat: station.coordinates.lat, lng: station.coordinates.lng });
    } catch {
      // Sin la estación el backend igualmente valida la cobertura; el mapa queda centrado en Lima.
    }
    if (booking.destinationLat != null && booking.destinationLng != null) {
      void this.select({ lat: booking.destinationLat, lng: booking.destinationLng }, booking.destinationAddress ?? undefined);
    }
  }

  onMapClick(event: { lngLat?: { lat: number; lng: number } }): void {
    if (!event.lngLat || this.saving()) return;
    void this.select({ lat: event.lngLat.lat, lng: event.lngLat.lng });
  }

  private async select(point: { lat: number; lng: number }, knownAddress?: string): Promise<void> {
    const token = ++this.selectionToken;
    this.point.set(point);
    this.quote.set(null);
    this.errorMessage.set('');
    this.address.set(knownAddress ?? this.coordinatesText(point));
    this.loadingQuote.set(true);

    const quote = firstValueFrom(this.bookingsApi.quoteDestination(this.data.booking.id, point));
    const address = knownAddress ? Promise.resolve(knownAddress) : this.reverseGeocode(point);
    const [quoteResult, addressResult] = await Promise.allSettled([quote, address]);
    if (token !== this.selectionToken) return;

    this.loadingQuote.set(false);
    if (addressResult.status === 'fulfilled') this.address.set(addressResult.value);
    if (quoteResult.status === 'fulfilled') this.quote.set(quoteResult.value);
    else this.errorMessage.set(this.messageFrom(quoteResult.reason, 'booking.destination.quoteError'));
  }

  // Geocodificación inversa de Mapbox; si falla, el texto de respaldo son las coordenadas.
  private async reverseGeocode(point: { lat: number; lng: number }): Promise<string> {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lng},${point.lat}.json`;
      const response = await firstValueFrom(this.http.get<{ features?: { place_name?: string }[] }>(url, {
        params: { access_token: environment.mapboxAccessToken, limit: 1, language: 'es' }
      }));
      return (response.features?.[0]?.place_name ?? this.coordinatesText(point)).slice(0, 255);
    } catch {
      return this.coordinatesText(point);
    }
  }

  private coordinatesText(point: { lat: number; lng: number }): string {
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }

  private messageFrom(error: any, fallbackKey: string): string {
    return error?.error?.message || error?.error?.detail || this.translate.instant(fallbackKey);
  }

  async confirm(): Promise<void> {
    const point = this.point();
    if (!point || !this.canConfirm()) return;
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.bookingsApi.setDestination(this.data.booking.id, {
        ...point, address: this.address().slice(0, 255)
      }));
      this.dialogRef.close(toDomainBooking(response));
    } catch (error) {
      this.errorMessage.set(this.messageFrom(error, 'booking.destination.saveError'));
      this.saving.set(false);
    }
  }

  close(): void {
    if (this.saving()) return;
    this.dialogRef.close(null);
  }
}
