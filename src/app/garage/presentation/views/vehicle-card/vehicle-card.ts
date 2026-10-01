import { TripInitializerService } from '../../../../trip/application/trip-initializer.service';
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
import { Vehicle, hasCriticalBattery } from '../../../domain/model/vehicle.model';
import { BookingConfirmationModal } from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';
import { FavoriteStore } from '../../../application/favorite.store';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';
import { AuthService } from '../../../../core/services/auth.service';

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
  private tripInitializer = inject(TripInitializerService);
  private bookingBusy = false;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private favoriteStore = inject(FavoriteStore);
  private toggleFavorite = inject(ToggleFavoriteUseCase);
  private auth = inject(AuthService);

  isTogglingFavorite = false;
  get criticalBattery(): boolean { return hasCriticalBattery(this.vehicle); }

  async onToggleFavorite() {
    if (this.isTogglingFavorite) return;

    this.isTogglingFavorite = true;
    try {
      await this.toggleFavorite.execute(this.auth.userId, this.vehicle.id);
      this.vehicle.favorite = this.favoriteStore.isFavorite(this.vehicle.id);
    } catch {
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
    } finally {
      this.isTogglingFavorite = false;
    }
  }

  onViewDetails() {
    this.viewDetails.emit(this.vehicle);
  }

  onReserve() {
    if (this.criticalBattery) return;
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

  private async startImmediateTrip() {
    if (this.bookingBusy) return;
    this.bookingBusy = true;
    try {
      await this.tripInitializer.reserveAndStart(this.vehicle.id, this.vehicle.location);
      await this.router.navigate(['/trip/map']);
    } catch (error) {
      this.snackBar.open(error instanceof Error ? error.message : 'No se pudo iniciar la reserva', 'Cerrar', { duration: 4000 });
    } finally { this.bookingBusy = false; }
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
