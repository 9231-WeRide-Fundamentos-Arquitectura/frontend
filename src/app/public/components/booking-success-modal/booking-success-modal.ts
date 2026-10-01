import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Vehicle } from '../../../garage/domain/model/vehicle.model';
import { Booking } from '../../../booking/domain/model/booking.entity';

export interface BookingSuccessModalData {
  vehicle: Vehicle;
  booking: Booking;
}

@Component({
  selector: 'app-booking-success-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './booking-success-modal.html',
  styleUrl: './booking-success-modal.css'
})
export class BookingSuccessModal {
  private router = inject(Router);

  constructor(
    public dialogRef: MatDialogRef<BookingSuccessModal>,
    @Inject(MAT_DIALOG_DATA) public data: BookingSuccessModalData
  ) {}

  get vehicle(): Vehicle {
    return this.data.vehicle;
  }

  get booking(): Booking {
    return this.data.booking;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number | null): string {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  onContinue(): void {
    this.dialogRef.close();
    this.router.navigate(['/trip/details']);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
