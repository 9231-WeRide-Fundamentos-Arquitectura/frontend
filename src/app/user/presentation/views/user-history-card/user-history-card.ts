import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BookingHistoryApiEndpoint, CompletedTrip } from '../../../../trip/infrastructure/booking-history-api-endpoint';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { BookingResponse } from '../../../../booking/infraestructure/bookings-response';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-history-card', standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-history-card.html', styleUrl: './user-history-card.css'
})
export class UserHistoryCard implements OnInit {
  private destroyRef = inject(DestroyRef);
  private history = inject(BookingHistoryApiEndpoint);
  private bookingsApi = inject(BookingsApiEndpoint);
  private stateService = inject(UserSettingsStateService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  trips: CompletedTrip[] = [];
  bookings: BookingResponse[] = [];
  activeTab: 'trips' | 'bookings' = 'trips';
  loading = false;
  loadingBookings = false;
  error = '';
  bookingsError = '';
  nextPage = 0;
  hasMore = false;

  ngOnInit() { this.loadTrips(); this.loadBookings(); }

  loadTrips(reset = true) {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.history.getPage(reset ? 0 : this.nextPage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.trips = reset ? page.content : [...this.trips, ...page.content.filter(trip => !this.trips.some(existing => existing.id === trip.id))];
        this.nextPage = page.number + 1;
        this.hasMore = this.nextPage < page.totalPages;
        this.loading = false;
      },
      error: () => { this.error = 'trip.history.error'; this.loading = false; }
    });
  }

  loadBookings() {
    if (this.loadingBookings) return;
    this.loadingBookings = true;
    this.bookingsError = '';
    this.bookingsApi.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: bookings => { this.bookings = bookings; this.loadingBookings = false; },
      error: () => { this.bookingsError = 'trip.history.error'; this.loadingBookings = false; }
    });
  }

  retryTrips() { this.loadTrips(this.trips.length === 0); }
  viewDetails(trip: CompletedTrip) { this.router.navigate(['/trip/history'], { queryParams: { bookingId: trip.id } }); }
  closeCard() { this.stateService.closeSection(); }
  formatDate(value: string | null): string {
    return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(this.translate.getCurrentLang() || 'es') : '—';
  }
  formatDuration(minutes: number | null): string {
    if (minutes == null) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  getStatusColor(status: string): string {
    return ({ completed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', active: '#3b82f6' } as Record<string, string>)[status] || '#6b7280';
  }
}
