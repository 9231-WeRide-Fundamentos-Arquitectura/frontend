import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { BookingDetailsResponse } from '../../../infraestructure/bookings-response';
import { ErrorStateComponent } from '../../../../public/components/error-state/error-state';

// Detalle de solo lectura: siempre se consulta GET /bookings/{id}/details al abrir.
@Component({
  selector: 'app-booking-details-modal',
  imports: [CommonModule, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule, ErrorStateComponent],
  styleUrl: './booking-details-modal.css',
  templateUrl: './booking-details-modal.html'
})
export class BookingDetailsModal implements OnInit {
  private api = inject(BookingsApiEndpoint);
  private data = inject<{ bookingId: string }>(MAT_DIALOG_DATA);

  details = signal<BookingDetailsResponse | null>(null);
  loading = signal(true);
  error = signal(false);
  copied = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getDetails(this.data.bookingId).subscribe({
      next: details => { this.details.set(details); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  // pending / confirmed (reserved) y active (in_progress) traen batería y código.
  get live(): boolean {
    const status = this.details()?.booking.status;
    return status === 'pending' || status === 'confirmed' || status === 'active';
  }

  get codeExpired(): boolean {
    const expires = this.details()?.unlock?.codeExpiresAt;
    return !expires || new Date(expires).getTime() <= Date.now();
  }

  copyCode(): void {
    const code = this.details()?.unlock?.accessCode;
    if (code) void navigator.clipboard?.writeText(code).then(() => this.copied.set(true));
  }
}
