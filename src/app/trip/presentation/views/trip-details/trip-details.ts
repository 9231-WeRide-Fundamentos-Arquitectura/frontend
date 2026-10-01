import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';
import { Booking, BookingActivationStatus } from '../../../../booking/domain/model/booking.entity';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [
    MatCard,
    MatCardModule,
    MatButton,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css'
})
export class TripDetails implements OnInit, OnDestroy {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private bookingStore = inject(BookingStore);
  private activeBookingService = inject(ActiveBookingService);
  private tripInitializer = inject(TripInitializerService);
  private destroy$ = new Subject<void>();

  isActiveTrip = computed(() => this.tripStore.isActiveTrip());
  currentVehicle = computed(() => this.tripStore.currentVehicle());
  currentLocation = computed(() => this.tripStore.currentLocation());
  destinationLocation = computed(() => this.tripStore.destinationLocation());
  tripStartTime = computed(() => this.tripStore.tripStartTime());
  estimatedEndTime = computed(() => this.tripStore.estimatedEndTime());

  elapsedTime = signal<string>('00:00');
  remainingTime = signal<string>('00:00');
  extraTime = signal<string>('Aún no sobrepasas tu tiempo');
  rating = signal<number>(0);

  relatedBooking = signal<Booking | null>(null);
  canActivateBooking = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  private timeUpdateInterval?: number;

  async ngOnInit() {
    this.bookingStore.getActiveBooking$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(booking => {
        this.relatedBooking.set(booking);
        this.canActivateBooking.set(!!(
          booking &&
          booking.activationStatus === 'scheduled' &&
          !booking.isActivated
        ));
      });

    if (this.isActiveTrip()) {
      this.startTimeUpdates();
      this.isLoading.set(false);
      return;
    }

    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking && this.tripInitializer.canInitializeTripFromBooking(activeBooking)) {
      const initialized = await this.tripInitializer.initializeTripFromBooking(activeBooking);

      if (initialized && this.isActiveTrip()) {
        this.startTimeUpdates();
      }
    }

    this.isLoading.set(false);
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startTimeUpdates() {
    this.updateTimes();
    this.timeUpdateInterval = window.setInterval(() => {
      this.updateTimes();
    }, 1000);
  }

  private updateTimes() {
    const startTime = this.tripStartTime();
    const estimatedEnd = this.estimatedEndTime();

    if (!startTime || !estimatedEnd) return;

    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = estimatedEnd.getTime() - now.getTime();

    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
    this.elapsedTime.set(`${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')} min`);

    if (remaining > 0) {
      const remainingMinutes = Math.floor(remaining / 60000);
      const remainingSeconds = Math.floor((remaining % 60000) / 1000);
      this.remainingTime.set(`${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} min`);
      this.extraTime.set('Aún no sobrepasas tu tiempo');
    } else {
      const overtimeMinutes = Math.floor(Math.abs(remaining) / 60000);
      const overtimeSeconds = Math.floor((Math.abs(remaining) % 60000) / 1000);
      this.remainingTime.set('00:00 min');
      this.extraTime.set(`Tiempo extra: ${overtimeMinutes.toString().padStart(2, '0')}:${overtimeSeconds.toString().padStart(2, '0')} min`);
    }
  }

  getVehicleType(): string {
    const vehicle = this.currentVehicle();
    if (!vehicle) return 'Electric Scooter';

    const typeMap: { [key: string]: string } = {
      'electric_scooter': 'Scooter Eléctrico',
      'bike': 'Bicicleta',
      'electric_bike': 'Bicicleta Eléctrica'
    };
    return typeMap[vehicle.type] || 'Electric Scooter';
  }
  goToScheduleBooking() {
    this.router.navigate(['/garage']);
  }

  setRating(stars: number) {
    this.rating.set(stars);
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  goToSettings() {
    this.router.navigate(['/user/profile']);
  }

  goToGarage() {
    this.router.navigate(['/garage']);
  }

  async activateBooking() {
    const booking = this.relatedBooking();
    if (!booking || !this.canActivateBooking()) return;

    try {
      await this.bookingStore.activateBooking(booking.id);

      this.router.navigate(['/trip'], {
        queryParams: {
          bookingActivated: true,
          bookingId: booking.id
        }
      });
    } catch (error) {
      console.error('Error activating booking:', error);
    }
  }

  getBookingStatusIcon(status?: BookingActivationStatus): string {
    const iconMap: { [key: string]: string } = {
      'scheduled': 'schedule',
      'active': 'play_circle',
      'completed': 'check_circle',
      'cancelled': 'cancel'
    };
    return iconMap[status || 'scheduled'];
  }

  getBookingStatusText(status?: BookingActivationStatus): string {
    const textMap: { [key: string]: string } = {
      'scheduled': 'Programada',
      'active': 'Activa',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return textMap[status || 'scheduled'];
  }

  getBookingStatusClass(status?: BookingActivationStatus): string {
    return `booking-status-${status || 'scheduled'}`;
  }
}

