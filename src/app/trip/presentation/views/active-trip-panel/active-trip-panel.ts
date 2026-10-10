import {Component, computed, inject, input, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {TripStore} from '../../../application/trip.store';
import {ActiveBookingService} from '../../../../booking/application/active-booking.service';

@Component({
  selector: 'app-active-trip-panel',
  imports: [CommonModule, TranslateModule],
  templateUrl: './active-trip-panel.html',
  styleUrl: './active-trip-panel.css'
})
export class ActiveTripPanel {
  protected tripStore = inject(TripStore);

  elapsedTime = input.required<string>();
  remainingTime = input.required<string>();
  currentBattery = input.required<number>();
  estimatedDistance = input.required<number>();
  connectionError = input<boolean>(false);

  onEndTrip = output<void>();
  onRetryUpdate = output<void>();
  onReportProblem = output<void>();
  onChangeDestination = output<void>();

  // Estimado del destino marcado (distancia, minutos, monto) tomado de la reserva activa.
  private activeBooking = inject(ActiveBookingService);
  destinationEstimate = computed(() => {
    const booking = this.activeBooking.booking();
    return booking?.estimatedCost == null ? null : {
      distance: booking.estimatedDistance, minutes: booking.estimatedDuration, cost: booking.estimatedCost
    };
  });

  currentVehicle = computed(() => this.tripStore.currentVehicle());
  currentLocation = computed(() => this.tripStore.currentLocation());
  destinationLocation = computed(() => this.tripStore.destinationLocation());

  endTrip() {
    this.onEndTrip.emit();
  }

  retryUpdate() {
    this.onRetryUpdate.emit();
  }

  changeDestination() {
    this.onChangeDestination.emit();
  }

  reportProblem() {
    this.onReportProblem.emit();
  }
}
