import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BookingHistoryApiEndpoint, CompletedTrip } from '../../../infrastructure/booking-history-api-endpoint';

@Component({
  selector: 'app-trip-history', standalone: true,
  imports: [MatIconModule, MatIconButton, CommonModule, TranslateModule],
  templateUrl: './trip-history.html', styleUrl: './trip-history.css'
})
export class TripHistory implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(BookingHistoryApiEndpoint);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  trips: CompletedTrip[] = [];
  loading = false;
  error = '';
  nextPage = 0;
  hasMore = false;
  selectedTrip: CompletedTrip | null = null;
  detailLoadingId = '';
  detailErrorId = '';
  // Viaje cuyo comprobante se está imprimiendo; se limpia al cerrar el diálogo de impresión.
  receiptTrip: CompletedTrip | null = null;

  ngOnInit() {
    this.loadTrips();
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    if (bookingId) this.loadDetails(bookingId);
  }

  loadTrips(reset = true) {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.api.getPage(reset ? 0 : this.nextPage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.trips = reset ? page.content : [...this.trips, ...page.content.filter(trip => !this.trips.some(existing => existing.id === trip.id))];
        this.nextPage = page.number + 1;
        this.hasMore = this.nextPage < page.totalPages;
        this.loading = false;
      },
      error: () => { this.error = 'trip.history.error'; this.loading = false; }
    });
  }

  formatDate(value: string | null): string {
    return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(this.translate.getCurrentLang() || 'es') : '—';
  }

  viewDetails(trip: CompletedTrip) {
    if (this.selectedTrip?.id === trip.id) { this.selectedTrip = null; return; }
    this.loadDetails(trip.id);
  }

  loadDetails(id: string) {
    if (this.detailLoadingId) return;
    this.detailLoadingId = id;
    this.detailErrorId = '';
    this.api.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: trip => { this.selectedTrip = trip; this.detailLoadingId = ''; },
      error: () => { this.detailErrorId = id; this.detailLoadingId = ''; }
    });
  }

  // Comprobante generado en el navegador: se renderiza la hoja de impresión y se abre window.print()
  // para que el usuario lo guarde como PDF. Los estilos @media print están en styles.css.
  printReceipt(trip: CompletedTrip) {
    this.receiptTrip = trip;
    setTimeout(() => window.print());
  }

  @HostListener('window:afterprint')
  clearReceipt() {
    this.receiptTrip = null;
  }

  destinationLabel(trip: CompletedTrip): string {
    const origin = trip.route.split(' → ')[0];
    return trip.destinationAddress ? `${origin} → ${trip.destinationAddress}` : trip.route;
  }

  baseCost(trip: CompletedTrip): number | null {
    return trip.finalCost == null ? null : trip.finalCost - (trip.destinationChangeFees ?? 0);
  }

  seeMore() { this.loadTrips(false); }
  retry() { this.loadTrips(this.trips.length === 0); }
  goBack() { this.router.navigate(['/trip']); }
  goToGarage() { this.router.navigate(['/garage']); }
}
