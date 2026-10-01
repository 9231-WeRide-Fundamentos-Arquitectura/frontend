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

  userLocation = signal<[number, number] | null>(null);
  markers: Array<{lng: number, lat: number}> = [];
  vehicleMarkers = computed(() => {
    const vehicles = this.tripStore.vehicles();
    const locations = this.tripStore.locations();
    return vehicles.filter(v => v.status === 'available').map(vehicle => {
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
        const activeBooking = this.activeBookingService.getActiveBooking();

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
      if (vehicle.status !== 'available') return false;

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

  reserveVehicle(vehicle: Vehicle) {
    const locations = this.tripStore.locations();
    const vehicleLocation = locations.find(loc => loc.id === vehicle.location);

    if (vehicleLocation) {
      this.tripStore.setCurrentVehicle(vehicle);
      this.tripStore.setCurrentLocation(vehicleLocation);

      const destinationLocation = this.getRandomDestination(vehicleLocation);
      if (destinationLocation) {
        this.tripStore.setDestinationLocation(destinationLocation);
      }

      const startTime = new Date();
      const estimatedEndTime = new Date(startTime.getTime() + 30 * 60000);
      this.tripStore.startTrip(startTime, estimatedEndTime, vehicle);

      this.currentBattery.set(vehicle.battery);
      const distance = this.calculateDistanceBetweenLocations(vehicleLocation, destinationLocation!);
      this.estimatedDistance.set(distance);

      this.clearSelection();
    }
  }

  getRandomDestination(startLocation: Location): Location | null {
    const locations = this.tripStore.locations();
    const availableDestinations = locations.filter(loc => loc.id !== startLocation.id);
    if (availableDestinations.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableDestinations.length);
      return availableDestinations[randomIndex];
    }
    return null;
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

  endTrip() {
    const currentTrip = this.tripStore.currentTrip();

    // Open rate trip modal after ending trip
    this.openRateTripModal();

    // End the trip in store
    this.tripStore.endTrip();
    this.elapsedTime.set('00:00:00');
    this.remainingTime.set('00:00:00');
    this.currentBattery.set(0);
    this.estimatedDistance.set(0);
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
    const trip = this.tripStore.currentTrip();
    if (!trip) {
      // Create a mock trip object for now
      const mockTrip = {
        id: `trip_${Date.now()}`,
        vehicleId: this.currentVehicle()?.id || '',
        startLocationId: this.currentLocation()?.id || '',
        endLocationId: this.destinationLocation()?.id || ''
      };

      const dialogRef = this.dialog.open(RateTripModal, {
        data: mockTrip,
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
    } else {
      const dialogRef = this.dialog.open(RateTripModal, {
        data: trip,
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
  }

  submitRating(ratingData: any) {
    const isOffline = this.connectionError();

    if (isOffline) {
      // Save to local storage for later sync
      this.offlineSyncService.queueRating({
        tripId: ratingData.tripId,
        rating: ratingData.rating,
        comment: ratingData.comment
      });

      this.showMessage(
        this.translate.instant('trip.rateTrip.savedOffline'),
        'info'
      );
    } else {
      // Submit directly to API
      this.ratingsApi.create({
        tripId: ratingData.tripId,
        rating: ratingData.rating,
        comment: ratingData.comment
      }).subscribe({
        next: () => {
          this.showMessage(
            this.translate.instant('trip.rateTrip.thankYou'),
            'success'
          );
        },
        error: (error) => {
          console.error('Error submitting rating:', error);
          // Fallback to offline queue if submission fails
          this.offlineSyncService.queueRating({
            tripId: ratingData.tripId,
            rating: ratingData.rating,
            comment: ratingData.comment
          });
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
    if(this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    if(this.tripUpdateInterval) {
      clearInterval(this.tripUpdateInterval);
    }
  }
}
