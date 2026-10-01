import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
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
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './vehicle-unlock-status.html',
  styleUrl: './vehicle-unlock-status.css'
})
export class VehicleUnlockStatusComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private activeBookingService = inject(ActiveBookingService);
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);

  isActiveTrip = computed(() => this.tripStore.isActiveTrip());
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
                this.errorMessage.set('Error de conexión al obtener el estado de desbloqueo');
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
          lastUpdated: mostRecentRequest ? this.formatLastUpdated(mostRecentRequest.requestedAt) : 'N/A',
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
              message: 'Vehículo desbloqueado exitosamente',
              time: this.formatTime(mostRecentRequest.actualUnlockTime)
            });
          }

          if (mostRecentRequest.status === 'pending') {
            activities.push({
              type: 'info',
              message: 'Solicitud de desbloqueo iniciada',
              time: this.formatTime(mostRecentRequest.requestedAt)
            });
          }

          if (mostRecentRequest.status === 'failed') {
            activities.push({
              type: 'error',
              message: mostRecentRequest.errorMessage || 'Error en el desbloqueo - reintento intentado',
              time: this.formatTime(mostRecentRequest.requestedAt)
            });
          }
        }

        if (booking) {
          activities.push({
            type: 'info',
            message: `Reserva ${booking.status === 'confirmed' ? 'confirmada' : booking.status}`,
            time: this.formatDateTime(startDate)
          });
        }

        this.recentActivity.set(activities);
      }
    } catch (error) {
      console.error('Error loading vehicle status:', error);
      this.connectionError.set(true);
      this.errorMessage.set('Error al cargar el estado del vehículo');
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

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hace 1 día';
    return `Hace ${diffDays} días`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateElapsedTime(startDate: Date, now: Date): string {
    const diffMs = now.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  calculateRemainingTime(now: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - now.getTime();
    if (diffMs < 0) {
      return 'Tiempo agotado';
    }
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  async lockVehicle() {
    if (!this.isActiveTrip()) return;

    try {
      const booking = this.activeBooking();
      if (!booking) return;

      await firstValueFrom(
        this.unlockRequestsApi.update(booking.unlockRequestId || '', {
          status: 'pending',
          actualUnlockTime: null
        })
      );

      this.vehicleInfo.update(info => ({ ...info, status: 'Locked' }));

      this.recentActivity.update(activities => [{
        type: 'info',
        message: 'Vehículo bloqueado',
        time: this.formatTime(new Date())
      }, ...activities]);
    } catch (error) {
      console.error('Error locking vehicle:', error);
    }
  }

  async unlockVehicle() {
    if (!this.isActiveTrip()) return;

    try {
      const booking = this.activeBooking();
      if (!booking) return;

      await firstValueFrom(
        this.unlockRequestsApi.update(booking.unlockRequestId || '', {
          status: 'unlocked',
          actualUnlockTime: new Date().toISOString()
        })
      );

      this.vehicleInfo.update(info => ({ ...info, status: 'Unlocked' }));

      this.recentActivity.update(activities => [{
        type: 'success',
        message: 'Vehículo desbloqueado',
        time: this.formatTime(new Date())
      }, ...activities]);
    } catch (error) {
      console.error('Error unlocking vehicle:', error);
    }
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
        return 'Desbloqueado';
      case 'Locked':
        return 'Bloqueado';
      case 'Pending':
        return 'En proceso';
      case 'Error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  }

  getBookingStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }
}
