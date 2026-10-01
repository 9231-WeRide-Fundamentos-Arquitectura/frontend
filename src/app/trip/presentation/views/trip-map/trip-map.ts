import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { BookingsApiEndpoint } from '../../../../booking/infraestructure/bookings-api-endpoint';
import { BookingStore } from '../../../../booking/application/booking.store';
import { toDomainBooking } from '../../../../booking/infraestructure/booking-assembler';
import {Component, OnDestroy, OnInit, signal, inject, computed} from '@angular/core';
import { MapComponent, MarkerComponent} from 'ngx-mapbox-gl';
import {LocationsApiEndpoint} from '../../../infrastructure/locations-api-endpoint';
import {VehiclesApiEndpoint} from '../../../infrastructure/vehicles-api-endpoint';
import {TripStore} from '../../../application/trip.store';
import {CommonModule} from '@angular/common';
import {Vehicle} from '../../../domain/model/vehicle.entity';
import {Location} from '../../../domain/model/location.entity';
import {MatDialog} from '@angular/material/dialog';
import {VehicleDetailsModal} from '../../../../garage/presentation/views/vehicle-details-modal/vehicle-details-modal';
import {ActiveTripPanel} from '../active-trip-panel/active-trip-panel';
import {ReportProblemModal} from '../report-problem-modal/report-problem-modal';
import {RateTripModal} from '../rate-trip-modal/rate-trip-modal';
import {ProblemReportsApiEndpoint} from '../../../infrastructure/problem-reports-api-endpoint';
import {RatingsApiEndpoint} from '../../../infrastructure/ratings-api-endpoint';
import {OfflineSyncService} from '../../../application/offline-sync.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';

@Component({
  selector: 'app-trip-map',
  imports: [MapComponent, MarkerComponent, CommonModule, ActiveTripPanel],
  templateUrl: './trip-map.html',
  styleUrl: './trip-map.css'
})
export class TripMap implements OnInit, OnDestroy {
  private locationsApi = inject(LocationsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  protected tripStore = inject(TripStore);
  private dialog = inject(MatDialog);
  private problemReportsApi = inject(ProblemReportsApiEndpoint);
  private ratingsApi = inject(RatingsApiEndpoint);
  private offlineSyncService = inject(OfflineSyncService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private activeBookingService = inject(ActiveBookingService);
  private tripInitializer = inject(TripInitializerService);
  private auth = inject(AuthService);
  private bookingsApi = inject(BookingsApiEndpoint);
  private bookingStore = inject(BookingStore);
  private bookingBusy = false;
  private completedBookingId: string | null = null;

  userLocation = signal<[number, number] | null>(null);
  // ponytail: disponibilidad simulada en el cliente (cada vehículo se oculta al azar); cambiar por telemetría real del backend cuando exista.
  private hiddenVehicleIds = signal(new Set<string>());
  private availabilityInterval = window.setInterval(() => this.hiddenVehicleIds.set(
    new Set(this.tripStore.vehicles().filter(() => Math.random() < this.HIDDEN_PROBABILITY).map(v => v.id))
  ), 25000);
  private readonly HIDDEN_PROBABILITY = 0.35;
  markers: Array<{lng: number, lat: number}> = [];
  vehicleMarkers = computed(() => {
    const vehicles = this.tripStore.vehicles();
    const locations = this.tripStore.locations();
    const hidden = this.hiddenVehicleIds();
    return vehicles.filter(v => v.status === 'available' && !hidden.has(v.id)).map(vehicle => {
      const location = locations.find(loc => loc.id === vehicle.location);
      return {
        vehicle,
        location
      };
    }).filter(item => item.location);
  });

  nearbyVehicles = computed(() => this.tripStore.nearbyVehicles());
  selectedLocation = computed(() => this.tripStore.selectedLocation());
  connectionError = computed(() => this.tripStore.connectionError());
  isActiveTrip = computed(() => this.tripStore.isActiveTrip());
  currentVehicle = computed(() => this.tripStore.currentVehicle());
  currentLocation = computed(() => this.tripStore.currentLocation());
  destinationLocation = computed(() => this.tripStore.destinationLocation());
  tripStartTime = computed(() => this.tripStore.tripStartTime());
  estimatedEndTime = computed(() => this.tripStore.estimatedEndTime());

  elapsedTime = signal<string>('00:00:00');
  remainingTime = signal<string>('00:00:00');
  currentBattery = signal<number>(0);
  estimatedDistance = signal<number>(0);

  private watchId?: number;
  private tripUpdateInterval?: number;
  private readonly NEARBY_DISTANCE_KM = 2;

  async ngOnInit(): Promise<void> {
    this.loadLocations();
    this.loadVehicles();
    this.startLocationTracking();
    this.startTripUpdates();

    // Verificar si hay un viaje activo, si no, intentar inicializar desde booking
    if (!this.isActiveTrip()) {
      // Esperar un momento para que las ubicaciones y vehículos se carguen
      setTimeout(async () => {
        let activeBooking;
        try { activeBooking = await this.activeBookingService.checkAndStoreActiveBooking(this.auth.userId); }
        catch { this.showMessage('No se pudo consultar tu reserva activa', 'error'); return; }

        if (activeBooking && this.tripInitializer.canInitializeTripFromBooking(activeBooking)) {
          // Intentar inicializar el viaje desde el booking
          await this.tripInitializer.initializeTripFromBooking(activeBooking);

          // Si se inicializó correctamente, actualizar la batería y distancia
          if (this.isActiveTrip() && this.currentVehicle()) {
            this.currentBattery.set(this.currentVehicle()!.battery);
            if (this.currentLocation() && this.destinationLocation()) {
              const distance = this.calculateDistanceBetweenLocations(
                this.currentLocation()!,
                this.destinationLocation()!
              );
              this.estimatedDistance.set(distance);
            }
          }
        }
      }, 500);
    }

    // Try to sync offline data on component init if there's connection
    setTimeout(() => {
      if (!this.connectionError()) {
        this.syncOfflineData();
      }
    }, 2000);
  }

  loadLocations() {
    this.tripStore.setLoading(true);
    this.tripStore.setConnectionError(false);
    this.locationsApi.getAll().subscribe({
      next: (locations: any) => {
        this.tripStore.setLocations(locations);
        this.markers = locations.map((loc: any) => ({
          lng: loc.coordinates.lng,
          lat: loc.coordinates.lat
        }));
        this.tripStore.setLoading(false);
      },
      error: (error: any) => {
        console.error('Error al cargar ubicaciones:', error);
        this.tripStore.setConnectionError(true);
        this.tripStore.setLoading(false);
      }
    });
  }

  loadVehicles() {
    this.tripStore.setLoading(true);
    this.tripStore.setConnectionError(false);
    this.vehiclesApi.getAll().subscribe({
      next: (vehicles: Vehicle[]) => {
        this.tripStore.setVehicles(vehicles);
        this.tripStore.setLoading(false);
      },
      error: (error: any) => {
        console.error('Error al cargar vehículos:', error);
        this.tripStore.setConnectionError(true);
        this.tripStore.setLoading(false);
      }
    });
  }

  onMapClick(event: any) {
    const lngLat = event.lngLat;
    if (lngLat) {
      const selectedLocation = { lat: lngLat.lat, lng: lngLat.lng };
      this.tripStore.setSelectedLocation(selectedLocation);
      this.findNearbyVehicles(selectedLocation);
    }
  }

  findNearbyVehicles(selectedLocation: { lat: number, lng: number }) {
    const vehicles = this.tripStore.vehicles();
    const locations = this.tripStore.locations();

    const nearbyVehicles = vehicles.filter(vehicle => {
      if (vehicle.status !== 'available' || this.hiddenVehicleIds().has(vehicle.id)) return false;

      const vehicleLocation = locations.find(loc => loc.id === vehicle.location);
      if (!vehicleLocation) return false;

      const distance = this.calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        vehicleLocation.coordinates.lat,
        vehicleLocation.coordinates.lng
      );

      return distance <= this.NEARBY_DISTANCE_KM;
    });

    this.tripStore.setNearbyVehicles(nearbyVehicles);
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value: number): number {
    return value * Math.PI / 180;
  }

  getAlternativeLocations(): Location[] {
    const locations = this.tripStore.locations();
    return locations
      .filter(loc => {
        const vehiclesAtLocation = this.tripStore.vehicles().filter(
          v => v.location === loc.id && v.status === 'available'
        );
        return vehiclesAtLocation.length > 0;
      })
      .slice(0, 3);
  }

  retryLoadData() {
    this.tripStore.setConnectionError(false);
    this.loadLocations();
    this.loadVehicles();

    // Attempt to sync offline data when connection is restored
    this.syncOfflineData();
  }

  private syncOfflineData() {
    const pendingCount = this.offlineSyncService.getPendingCount();

    if (pendingCount.total > 0) {
      this.offlineSyncService.syncAll().then(() => {
        const remainingCount = this.offlineSyncService.getPendingCount();
        if (remainingCount.total === 0) {
          this.showMessage(
            this.translate.instant('common.success') + ': Datos sincronizados',
            'success'
          );
        }
      }).catch((error) => {
        console.error('Error syncing offline data:', error);
      });
    }
  }

  clearSelection() {
    this.tripStore.setSelectedLocation(null);
    this.tripStore.setNearbyVehicles([]);
  }

  openVehicleDetails(vehicle: Vehicle) {
    const dialogRef = this.dialog.open(VehicleDetailsModal, {
      width: '800px',
      maxWidth: '95vw',
      data: vehicle,
      panelClass: 'vehicle-details-dialog'
    });

    dialogRef.componentInstance.dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reserve') {
        this.reserveVehicle(vehicle);
      }
    });
  }

  async reserveVehicle(vehicle: Vehicle) {
    if (this.bookingBusy || this.isActiveTrip()) return;
    const location = this.tripStore.locations().find(loc => loc.id === vehicle.location);
    if (!location) { this.showMessage('No se pudo encontrar la ubicación del vehículo', 'error'); return; }
    this.bookingBusy = true;
    try {
      await this.tripInitializer.reserveAndStart(vehicle.id, location.id, this.destinationLocation()?.id ?? location.id);
      this.currentBattery.set(vehicle.battery);
      this.clearSelection();
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'No se pudo iniciar la reserva', 'error');
    } finally { this.bookingBusy = false; }
  }

  calculateDistanceBetweenLocations(loc1: Location, loc2: Location): number {
    return this.calculateDistance(
      loc1.coordinates.lat,
      loc1.coordinates.lng,
      loc2.coordinates.lat,
      loc2.coordinates.lng
    );
  }

  startLocationTracking() {
    if('geolocation' in navigator){
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const {longitude, latitude} = pos.coords;
          this.userLocation.set([longitude, latitude]);
        },
        (error) => {
          // Error obteniendo la ubicación
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalizacion')
    }
  }

  startTripUpdates() {
    this.tripUpdateInterval = window.setInterval(() => {
      if (this.isActiveTrip()) {
        this.updateTripInfo();
      }
    }, 1000);
  }

  updateTripInfo() {
    const startTime = this.tripStartTime();
    const endTime = this.estimatedEndTime();

    if (startTime && endTime) {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
      const remaining = endTime.getTime() - now.getTime();

      this.elapsedTime.set(this.formatTime(elapsed));
      this.remainingTime.set(remaining > 0 ? this.formatTime(remaining) : '00:00:00');

      const vehicle = this.currentVehicle();
      if (vehicle) {
        const batteryDrain = (elapsed / 60000) * 0.5;
        const newBattery = Math.max(0, vehicle.battery - batteryDrain);
        this.currentBattery.set(Math.round(newBattery));
      }
    }
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  async endTrip() {
    if (this.bookingBusy) return;
    const booking = this.activeBookingService.getActiveBooking();
    const vehicle = this.currentVehicle();
    const start = this.tripStartTime();
    if (!booking || !vehicle || !start) { this.showMessage('No hay una reserva activa para finalizar', 'error'); return; }
    this.bookingBusy = true;
    try {
      const duration = Math.max(0, Math.ceil((Date.now() - start.getTime()) / 60000));
      const distance = this.estimatedDistance();
      const response = await firstValueFrom(this.bookingsApi.complete(booking.id, {
        totalCost: duration * vehicle.pricePerMinute, discount: 0, distance, duration,
        averageSpeed: duration ? distance / (duration / 60) : 0, rating: null
      }));
      this.bookingStore.updateBooking(toDomainBooking(response));
      this.bookingStore.setActiveBooking(null);
      this.completedBookingId = booking.id;
      this.activeBookingService.clearActiveBooking();
      this.openRateTripModal();
      this.tripStore.endTrip();
      this.elapsedTime.set('00:00:00');
      this.remainingTime.set('00:00:00');
      this.currentBattery.set(0);
      this.estimatedDistance.set(0);
    } catch {
      this.showMessage('No se pudo finalizar el viaje. Tu reserva sigue activa; intenta nuevamente.', 'error');
    } finally { this.bookingBusy = false; }
  }

  openReportProblemModal() {
    const vehicle = this.currentVehicle();
    if (!vehicle) return;

    const dialogRef = this.dialog.open(ReportProblemModal, {
      data: vehicle,
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'report-problem-dialog',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.submitProblemReport(result);
      }
    });
  }

  submitProblemReport(reportData: any) {
    const isOffline = this.connectionError();

    if (isOffline) {
      // Save to local storage for later sync
      this.offlineSyncService.queueProblemReport({
        vehicleId: reportData.vehicleId,
        categories: reportData.categories,
        description: reportData.description,
        tripId: this.tripStore.currentTrip()?.id
      });

      this.showMessage(
        this.translate.instant('trip.reportProblem.savedOffline'),
        'info'
      );
    } else {
      // Submit directly to API
      this.problemReportsApi.create({
        vehicleId: reportData.vehicleId,
        categories: reportData.categories,
        description: reportData.description,
        tripId: this.tripStore.currentTrip()?.id
      }).subscribe({
        next: () => {
          this.showMessage(
            this.translate.instant('trip.reportProblem.success'),
            'success'
          );
        },
        error: (error) => {
          console.error('Error submitting problem report:', error);
          // Fallback to offline queue if submission fails
          this.offlineSyncService.queueProblemReport({
            vehicleId: reportData.vehicleId,
            categories: reportData.categories,
            description: reportData.description,
            tripId: this.tripStore.currentTrip()?.id
          });
          this.showMessage(
            this.translate.instant('trip.reportProblem.savedOffline'),
            'info'
          );
        }
      });
    }
  }

  openRateTripModal() {
    const dialogRef = this.dialog.open(RateTripModal, {
      data: this.tripStore.currentTrip() ?? {},
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'rate-trip-dialog',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.submitRating(result);
      }
    });
  }

  submitRating(ratingData: any) {
    // La calificación se guarda sobre la reserva; un viaje iniciado solo en local no tiene nada que calificar en el backend.
    const bookingId = this.completedBookingId ?? this.activeBookingService.getActiveBooking()?.id;
    if (!bookingId) {
      console.warn('Calificación descartada: no hay reserva activa a la que asociarla');
      return;
    }
    const rating = { bookingId, rating: ratingData.rating, comment: ratingData.comment };

    if (this.connectionError()) {
      // Save to local storage for later sync
      this.offlineSyncService.queueRating(rating);

      this.showMessage(
        this.translate.instant('trip.rateTrip.savedOffline'),
        'info'
      );
    } else {
      // Submit directly to API
      this.ratingsApi.create(rating).subscribe({
        next: () => {
          this.showMessage(
            this.translate.instant('trip.rateTrip.thankYou'),
            'success'
          );
        },
        error: (error) => {
          console.error('Error submitting rating:', error);
          // Fallback to offline queue if submission fails
          this.offlineSyncService.queueRating(rating);
          this.showMessage(
            this.translate.instant('trip.rateTrip.savedOffline'),
            'info'
          );
        }
      });
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info') {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`]
    });
  }

  retryTripUpdate() {
    this.tripStore.setConnectionError(false);
    this.updateTripInfo();
  }

  ngOnDestroy(): void {
    clearInterval(this.availabilityInterval);
    if(this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    if(this.tripUpdateInterval) {
      clearInterval(this.tripUpdateInterval);
    }
  }
}
