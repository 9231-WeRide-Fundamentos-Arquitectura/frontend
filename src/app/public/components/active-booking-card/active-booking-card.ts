import { Component, Input, Output, EventEmitter, signal, inject, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { Booking } from '../../../booking/domain/model/booking.entity';
import { VehiclesApiEndpoint } from '../../../booking/infraestructure/vehicles-api-endpoint';

@Component({
  selector: 'app-active-booking-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, TranslateModule],
  templateUrl: './active-booking-card.html',
  styleUrl: './active-booking-card.css'
})
export class ActiveBookingCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() booking: Booking | null = null;
  @Output() cardClick = new EventEmitter<void>();

  private vehiclesApi = inject(VehiclesApiEndpoint);
  readonly vehicleName = signal('');
  private loadedVehicleId: string | null = null;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly _remainingTime = signal<string>('--:--');

  readonly remainingTime = this._remainingTime.asReadonly();

  ngOnInit(): void {
    this.updateRemainingTime();
    this.intervalId = setInterval(() => this.updateRemainingTime(), 1000);
  }

  // Muestra el vehículo (marca y modelo) en lugar del uuid de la reserva.
  ngOnChanges(): void {
    const id = this.booking?.vehicleId;
    if (!id || id === this.loadedVehicleId) return;
    this.loadedVehicleId = id;
    this.vehiclesApi.getById(id).subscribe({
      next: vehicle => this.vehicleName.set(`${vehicle.brand} ${vehicle.model}`),
      error: () => this.vehicleName.set('')
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onClick(): void {
    this.cardClick.emit();
  }

  private updateRemainingTime(): void {
    if (!this.booking?.endDate) {
      this._remainingTime.set('--:--');
      return;
    }

    const now = new Date();
    const end = new Date(this.booking.endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      this._remainingTime.set('00:00');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      this._remainingTime.set(`${hours}h ${minutes}m`);
    } else {
      this._remainingTime.set(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  }
}
