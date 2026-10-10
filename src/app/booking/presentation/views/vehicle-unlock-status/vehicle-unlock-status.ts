import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ManualUnlockModal } from '../../../../garage/presentation/views/manual-unlock-modal/manual-unlock-modal';
import { Router, RouterLink } from '@angular/router';
import { TripStore } from '../../../../trip/application/trip.store';
import { ActiveBookingService } from '../../../application/active-booking.service';
import { UnlockRequestsApiEndpoint } from '../../../infraestructure/unlockRequests-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { toDomainUnlockRequest } from '../../../infraestructure/unlockRequest-assembler';
import { toDomainVehicle } from '../../../infraestructure/vehicle-assembler';
import { firstValueFrom, catchError, of } from 'rxjs';

interface VehicleInfo {
  id: string;
  battery: number;
  brand: string;
  model: string;
  licensePlate: string;
  status: 'Locked' | 'Unlocked' | 'Pending' | 'Error';
  lastUpdated: string;
  bookingStartDate: Date | null;
  bookingEndDate: Date | null;
  elapsedTime: string;
  remainingTime: string;
  bookingStatus: string;
}

interface Activity {
  type: 'success' | 'info' | 'error';
  message: string;
  time: string;
}

@Component({
  selector: 'app-vehicle-unlock-status',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, RouterLink, TranslateModule],
  templateUrl: './vehicle-unlock-status.html',
  styleUrl: './vehicle-unlock-status.css'
})
export class VehicleUnlockStatusComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private tripStore = inject(TripStore);
  private activeBookingService = inject(ActiveBookingService);
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);

  isActiveTrip = computed(() => this.tripStore.isActiveTrip() || !!this.activeBookingService.booking());
  currentVehicle = computed(() => this.tripStore.currentVehicle());

  vehicleInfo = signal<VehicleInfo>({
    id: '',
    battery: 0,
    brand: '',
    model: '',
    licensePlate: '',
    status: 'Locked',
    lastUpdated: '',
    bookingStartDate: null,
    bookingEndDate: null,
    elapsedTime: '00:00',
    remainingTime: '00:00',
    bookingStatus: ''
  });

  activeBooking = signal<any>(null);

  recentActivity = signal<Activity[]>([]);
  isLoading = signal<boolean>(false);
  connectionError = signal<boolean>(false);
  errorMessage = signal<string>('');
  private timeUpdateInterval?: number;

  get unlockStatus(): string {
    return this.vehicleInfo().status;
  }

  get lastUpdated(): string {
    return this.vehicleInfo().lastUpdated;
  }

  ngOnInit() {
    this.loadVehicleStatus();
    this.startTimeUpdates();
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private startTimeUpdates() {
    this.updateTimes();
    this.timeUpdateInterval = window.setInterval(() => {
      this.updateTimes();
    }, 1000);
  }

  private updateTimes() {
    const vehicleInfo = this.vehicleInfo();
    if (vehicleInfo.bookingStartDate) {
      const now = new Date();
      const elapsedTime = this.calculateElapsedTime(vehicleInfo.bookingStartDate, now);
      const remainingTime = vehicleInfo.bookingEndDate
        ? this.calculateRemainingTime(now, vehicleInfo.bookingEndDate)
        : 'N/A';

      this.vehicleInfo.update(info => ({
        ...info,
        elapsedTime,
        remainingTime
      }));
    }
  }

  async loadVehicleStatus() {
    if (this.isActiveTrip()) {
      await this.loadActiveTripStatus();
    } else {
      this.vehicleInfo.set({
        id: '',
        battery: 0,
        brand: '',
        model: '',
        licensePlate: '',
        status: 'Locked',
        lastUpdated: '',
        bookingStartDate: null,
        bookingEndDate: null,
        elapsedTime: '00:00',
        remainingTime: '00:00',
        bookingStatus: ''
      });
      this.activeBooking.set(null);
      this.recentActivity.set([]);
    }
  }

  async loadActiveTripStatus() {
    this.isLoading.set(true);
    this.connectionError.set(false);
    this.errorMessage.set('');

    try {
      let booking = this.activeBookingService.getActiveBooking();
      if (booking) {
        this.activeBooking.set(booking);
      } else {
        this.activeBooking.set(null);
      }

      const now = new Date();

      const tripStart = this.tripStore.tripStartTime();
      const tripEnd = this.tripStore.estimatedEndTime();

      const startDate = booking?.startDate || tripStart || now;
      const endDate = booking?.endDate || tripEnd || null;
      const elapsedTime = this.calculateElapsedTime(startDate, now);
      const remainingTime = endDate ? this.calculateRemainingTime(now, endDate) : 'N/A';

      const unlockRequests = booking
        ? await firstValueFrom(
            this.unlockRequestsApi.getByBookingId(booking.id).pipe(
              catchError(() => {
                this.connectionError.set(true);
                this.errorMessage.set(this.translate.instant('vehicleStatus.unlockFetchError'));
                return of([]);
              })
            )
          )
        : [];

      let unlockStatus: 'Locked' | 'Unlocked' | 'Pending' | 'Error' = 'Locked';
      let mostRecentRequest = null;

      if (unlockRequests.length > 0) {
        mostRecentRequest = unlockRequests
          .map(req => toDomainUnlockRequest(req))
          .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())[0];
        unlockStatus = this.mapUnlockStatus(mostRecentRequest.status);
      }

      const vehicleResponse = await firstValueFrom(
        this.vehiclesApi.getById(booking ? booking.vehicleId : this.currentVehicle()?.id ?? '').pipe(
          catchError(() => {
            const tripVehicle = this.currentVehicle();
            if (tripVehicle) {
              return of({
                id: tripVehicle.id,
                brand: tripVehicle.brand || '',
                model: tripVehicle.model || '',
                licensePlate: tripVehicle.licensePlate || '',
                battery: tripVehicle.battery || 0
              } as any);
            }
            return of(null);
          })
        )
      );

      if (vehicleResponse) {
        const vehicle = toDomainVehicle(vehicleResponse);

        this.vehicleInfo.set({
          id: vehicle.id,
          battery: vehicle.battery,
          brand: vehicle.brand,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
          status: unlockStatus,
          lastUpdated: mostRecentRequest ? this.formatLastUpdated(mostRecentRequest.actualUnlockTime || mostRecentRequest.requestedAt) : 'N/A',
          bookingStartDate: startDate,
          bookingEndDate: endDate,
          elapsedTime: elapsedTime,
          remainingTime: remainingTime,
          bookingStatus: booking?.status || (this.isActiveTrip() ? 'in_use' : '')
        });

        const activities: Activity[] = [];

        if (mostRecentRequest) {
          if (mostRecentRequest.actualUnlockTime) {
            activities.push({
              type: 'success',
              message: this.translate.instant('vehicleStatus.activity.unlocked'),
              time: this.formatTime(mostRecentRequest.actualUnlockTime)
            });
          }

          if (mostRecentRequest.status === 'pending') {
            activities.push({
              type: 'info',
              message: this.translate.instant('vehicleStatus.activity.requested'),
              time: this.formatTime(mostRecentRequest.requestedAt)
            });
          }

          if (mostRecentRequest.status === 'failed') {
            activities.push({
              type: 'error',
              message: mostRecentRequest.errorMessage || this.translate.instant('vehicleStatus.activity.failed'),
              time: this.formatTime(mostRecentRequest.requestedAt)
            });
          }
        }

        if (booking) {
          activities.push({
            type: 'info',
            message: `${this.translate.instant('vehicleStatus.activity.booking')} ${this.getBookingStatusLabel(booking.status).toLowerCase()}`,
            time: this.formatDateTime(startDate)
          });
        }

        this.recentActivity.set(activities);
      }
    } catch (error) {
      console.error('Error loading vehicle status:', error);
      this.connectionError.set(true);
      this.errorMessage.set(this.translate.instant('vehicleStatus.loadError'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshStatus() {
    if (this.isActiveTrip()) {
      await this.loadActiveTripStatus();
    }
  }

  retryConnection() {
    this.connectionError.set(false);
    this.errorMessage.set('');
    this.loadVehicleStatus();
  }

  mapUnlockStatus(status: 'pending' | 'unlocked' | 'failed'): 'Locked' | 'Unlocked' | 'Pending' | 'Error' {
    switch (status) {
      case 'unlocked':
        return 'Unlocked';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Error';
      default:
        return 'Locked';
    }
  }

  formatLastUpdated(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return this.translate.instant('vehicleStatus.ago.now');

    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 60) return this.translate.instant('vehicleStatus.ago.minutes', { count: diffMins });

    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 24) return this.translate.instant('vehicleStatus.ago.hours', { count: diffHours });
    return this.translate.instant('vehicleStatus.ago.days', { count: diffDays });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString(this.locale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateElapsedTime(startDate: Date, now: Date): string {
    const diffMs = Math.max(0, now.getTime() - startDate.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateRemainingTime(now: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - now.getTime();
    if (diffMs < 0) {
      return this.translate.instant('vehicleStatus.timeUp');
    }
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  lockVehicle() {
    // Finalizar el viaje en el flujo existente evita fingir un bloqueo físico.
    this.router.navigate(['/trip']);
  }

  async unlockVehicle() {
    const booking = this.activeBooking();
    if (!booking) return;
    const vehicle = await firstValueFrom(this.vehiclesApi.getById(booking.vehicleId));
    this.dialog.open(ManualUnlockModal, { data: { booking, vehicle }, width: '600px', maxWidth: '95vw' })
      .afterClosed().subscribe(() => this.loadActiveTripStatus());
  }

  goToGarage() {
    this.router.navigate(['/garage']);
  }

  goToScheduleBooking() {
    this.router.navigate(['/garage']);
  }

  goToHistory() {
    this.router.navigate(['/trip/history']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Unlocked':
        return this.translate.instant('vehicleStatus.states.unlocked');
      case 'Locked':
        return this.translate.instant('vehicleStatus.states.locked');
      case 'Pending':
        return this.translate.instant('vehicleStatus.states.pending');
      case 'Error':
        return this.translate.instant('vehicleStatus.states.error');
      default:
        return this.translate.instant('vehicleStatus.states.unknown');
    }
  }

  private locale(): string {
    return this.translate.currentLang === 'en' ? 'en-US' : 'es-ES';
  }

  getBookingStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
      case 'pending':
      case 'completed':
      case 'cancelled':
      case 'active':
        return this.translate.instant(`booking.status.${status}`);
      default:
        return status;
    }
  }
}
