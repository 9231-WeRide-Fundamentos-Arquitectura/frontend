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
import {RatingsApiEndpoint} from '../../../infrastructure/ratings-api-endpoint';
import {OfflineSyncService} from '../../../application/offline-sync.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { TripInitializerService } from '../../../application/trip-initializer.service';
import { RouteCoordinate } from '../../../domain/model/trip.entity';

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
  private routeCoordinates: RouteCoordinate[] = [];
  private routeBookingId: string | null = null;
  private routeDistance = 0;

  userLocation = signal<[number, number] | null>(null);
  // Un vehículo se oculta solo si tiene una reserva activa que lo ocupa en los próximos 15 min (disponibilidad real del backend).
  private hiddenVehicleIds = signal(new Set<string>());
  private async refreshBusyVehicles(): Promise<void> {
    const now = new Date(), soon = new Date(now.getTime() + 15 * 60000);
    const busy = await Promise.all(this.tripStore.vehicles().filter(v => v.status === 'available').map(async v => {
      try { return (await firstValueFrom(this.bookingsApi.availability(v.id, now, soon))).available ? null : v.id; }
      catch { return null; }
    }));
    this.hiddenVehicleIds.set(new Set(busy.filter((id): id is string => id !== null)));
  }
  private availabilityInterval = window.setInterval(() => void this.refreshBusyVehicles(), 25000);
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
    setTimeout(() => void this.refreshBusyVehicles(), 2000);
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
          if (pos.coords.accuracy <= 100) this.recordRoutePosition({ lat: latitude, lng: longitude });
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

  // ponytail: GPS is captured while the map is open; background tracking requires a native client.
  recordRoutePosition(point: RouteCoordinate): void {
    const booking = this.activeBookingService.getActiveBooking();
    if (!this.isActiveTrip() || !booking || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)
        || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return;
    const key = `weride_route_${booking.userId}_${booking.id}`;
    if (this.routeBookingId !== booking.id) {
      this.routeBookingId = booking.id;
      this.routeCoordinates = [];
      this.routeDistance = 0;
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
        if (Array.isArray(saved) && saved.length <= 5000 && saved.every(p => p && Number.isFinite(p.lat)
            && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180)) this.routeCoordinates = saved;
      } catch { /* A damaged local route must not stop a ride. */ }
      for (let i = 1; i < this.routeCoordinates.length; i++) {
        const from = this.routeCoordinates[i - 1], to = this.routeCoordinates[i];
        this.routeDistance += this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
      }
    }
    const last = this.routeCoordinates.at(-1);
    if (last?.lat === point.lat && last?.lng === point.lng) return;
    if (last) this.routeDistance += this.calculateDistance(last.lat, last.lng, point.lat, point.lng);
    // Keep the whole route represented within the server limit by reducing sampling density.
    if (this.routeCoordinates.length >= 5000) this.routeCoordinates = this.routeCoordinates.filter((_, i) => i % 2 === 0);
    this.routeCoordinates.push(point);
    this.estimatedDistance.set(this.routeDistance);
    try { sessionStorage.setItem(key, JSON.stringify(this.routeCoordinates)); } catch { /* Keep the in-memory route if browser storage is full. */ }
  }

  private simulateRoute(fromId: string, toId: string): { points: RouteCoordinate[]; distance: number } | null {
    const locations = this.tripStore.locations();
    const from = locations.find(l => l.id === fromId)?.coordinates, to = locations.find(l => l.id === toId)?.coordinates;
    if (!from || !to) return null;
    const steps = 10;
    const points = Array.from({ length: steps + 1 }, (_, i) => ({
      lat: from.lat + (to.lat - from.lat) * i / steps, lng: from.lng + (to.lng - from.lng) * i / steps
    }));
    return { points, distance: this.calculateDistance(from.lat, from.lng, to.lat, to.lng) };
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
      if (this.routeBookingId !== booking.id) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(`weride_route_${booking.userId}_${booking.id}`) || '[]');
          if (Array.isArray(saved) && saved.length) this.recordRoutePosition(saved.at(-1));
        } catch { /* Invalid browser data cannot block completion. */ }
      }
      const duration = Math.max(0, Math.ceil((Date.now() - start.getTime()) / 60000));
      let distance = this.routeBookingId === booking.id ? this.routeDistance : 0;
      let route = this.routeBookingId === booking.id ? this.routeCoordinates : [];
      let routeSource: 'gps' | 'simulated' = 'gps';
      if (route.length < 2) {
        // No usable GPS (e.g. desktop): interpolate station to station and flag it as simulated.
        const simulated = this.simulateRoute(booking.startLocationId, booking.endLocationId);
        if (simulated) { route = simulated.points; distance = simulated.distance; routeSource = 'simulated'; }
      }
      const response = await firstValueFrom(this.bookingsApi.complete(booking.id, {
        totalCost: duration * vehicle.pricePerMinute, discount: 0, distance, duration,
        averageSpeed: duration ? distance / (duration / 60) : 0, rating: null,
        routeCoordinates: route, routeSource
      }));
      this.bookingStore.updateBooking(toDomainBooking(response));
      try { sessionStorage.removeItem(`weride_route_${booking.userId}_${booking.id}`); } catch { /* Completion already persisted on the server. */ }
      this.routeCoordinates = [];
      this.routeBookingId = null;
      this.routeDistance = 0;
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

    dialogRef.afterClosed().subscribe((report) => {
      if (!report) return;
      if (report.chargeWaived) {
        this.activeBookingService.clearActiveBooking();
        this.tripStore.endTrip();
        this.tripStore.setCurrentTrip(null);
        this.bookingStore.setActiveBooking(null);
      }
      this.loadVehicles();
    });
  }

  openRateTripModal() {
    if (!this.completedBookingId) return;
    this.dialog.open(RateTripModal, {
      data: { bookingId: this.completedBookingId },
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'rate-trip-dialog',
      disableClose: true
    });
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
