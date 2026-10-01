import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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

  seeMore() { this.loadTrips(false); }
  retry() { this.loadTrips(this.trips.length === 0); }
  goBack() { this.router.navigate(['/trip']); }
}
