import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCard, MatCardActions, MatCardContent, MatCardImage, MatCardHeader, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { TripStore } from '../../../../trip/application/trip.store';
import { Vehicle as TripVehicle } from '../../../../trip/domain/model/vehicle.entity';
import { Location } from '../../../../trip/domain/model/location.entity';
import { LocationsApiEndpoint } from '../../../../trip/infrastructure/locations-api-endpoint';
import { BookingConfirmationModal } from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';
import { FavoriteStore } from '../../../application/favorite.store';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatIcon,
    MatButton,
    MatIconButton,
    MatChip,
    MatChipSet
  ],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.css'
})
export class VehicleCard {
  @Input() vehicle!: Vehicle;
  @Output() viewDetails = new EventEmitter<Vehicle>();
  @Output() reserve = new EventEmitter<Vehicle>();
  private translate = inject(TranslateService);
  private router = inject(Router);
  private tripStore = inject(TripStore);
  private locationsApi = inject(LocationsApiEndpoint);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private favoriteStore = inject(FavoriteStore);

  isTogglingFavorite = false;

  onToggleFavorite() {
    if (this.isTogglingFavorite) return;

    this.isTogglingFavorite = true;
    const previousState = this.vehicle.favorite;

    // Optimistic UI update
    this.vehicle.favorite = !this.vehicle.favorite;

    // Check for errors after a delay
    setTimeout(() => {
      const error = this.favoriteStore.error();
      if (error) {
        // Rollback on error
        this.vehicle.favorite = previousState;
        this.snackBar.open(
          this.translate.instant('garage.favorites.error'),
          this.translate.instant('common.retry'),
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        ).onAction().subscribe(() => {
          this.onToggleFavorite();
        });
      }
      this.isTogglingFavorite = false;
    }, 500);
  }

  onViewDetails() {
    this.viewDetails.emit(this.vehicle);
  }

  onReserve() {
    // Open confirmation modal
    const dialogRef = this.dialog.open(BookingConfirmationModal, {
      data: { vehicle: this.vehicle },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'booking-confirmation-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'book_now') {
          // Reservar ahora - iniciar viaje inmediatamente
          this.startImmediateTrip();
        } else if (result.action === 'schedule') {
          // Programar reserva - emitir evento para el componente padre
          this.reserve.emit(this.vehicle);
        }
      }
    });
  }

  private startImmediateTrip() {
    // Load locations to find vehicle location
    this.locationsApi.getAll().subscribe({
      next: (locations: Location[]) => {
        const vehicleLocation = locations.find(loc => loc.id === this.vehicle.location);

        if (vehicleLocation) {
          // Convert garage vehicle to trip vehicle format
          const tripVehicle: TripVehicle = {
            id: this.vehicle.id,
            brand: this.vehicle.brand,
            model: this.vehicle.model,
            year: this.vehicle.year,
            battery: this.vehicle.battery,
            maxSpeed: this.vehicle.maxSpeed,
            range: this.vehicle.range,
            weight: this.vehicle.weight,
            color: this.vehicle.color,
            licensePlate: this.vehicle.licensePlate,
            location: this.vehicle.location,
            status: this.vehicle.status,
            type: this.vehicle.type,
            companyId: this.vehicle.companyId,
            pricePerMinute: this.vehicle.pricePerMinute,
            image: this.vehicle.image,
            features: this.vehicle.features,
            maintenanceStatus: this.vehicle.maintenanceStatus,
            lastMaintenance: this.vehicle.lastMaintenance,
            nextMaintenance: this.vehicle.nextMaintenance,
            totalKilometers: this.vehicle.totalKilometers,
            rating: this.vehicle.rating
          };

          // Set vehicle and location in trip store
          this.tripStore.setCurrentVehicle(tripVehicle);
          this.tripStore.setCurrentLocation(vehicleLocation);
          this.tripStore.setLocations(locations);

          // Set random destination
          const destinationLocation = this.getRandomDestination(vehicleLocation, locations);
          if (destinationLocation) {
            this.tripStore.setDestinationLocation(destinationLocation);
          }

          // Start trip with estimated time
          const startTime = new Date();
          const estimatedEndTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes
          this.tripStore.startTrip(startTime, estimatedEndTime, tripVehicle);

          // Navigate to trip map
          this.router.navigate(['/trip/map']);
        }
      },
      error: (error) => {
        console.error('Error loading locations for trip:', error);
      }
    });
  }

  private getRandomDestination(startLocation: Location, locations: Location[]): Location | null {
    const availableDestinations = locations.filter(loc => loc.id !== startLocation.id);
    if (availableDestinations.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableDestinations.length);
      return availableDestinations[randomIndex];
    }
    return null;
  }

  getStatusLabel(): string {
    return this.translate.instant(`garage.vehicle.statuses.${this.vehicle.status}`) || this.vehicle.status;
  }

  getTypeLabel(): string {
    return this.translate.instant(`garage.vehicle.types.${this.vehicle.type}`) || this.vehicle.type;
  }

  getStatusClass(): string {
    return `status-${this.vehicle.status}`;
  }
}
