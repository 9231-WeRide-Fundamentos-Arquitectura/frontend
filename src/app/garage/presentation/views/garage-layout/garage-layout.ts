import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { BookingConfirmationModal } from '../../../../booking/presentation/views/booking-confirmation-modal/booking-confirmation-modal';
import { GarageFilter } from '../garage-filter/garage-filter';
import { VehicleCard } from '../vehicle-card/vehicle-card';
import { VehicleDetailsModal } from '../vehicle-details-modal/vehicle-details-modal';
import { QrScannerModal } from '../qr-scanner-modal/qr-scanner-modal';
import { ManualUnlockModal } from '../manual-unlock-modal/manual-unlock-modal';
import { ReportProblemModal } from '../report-problem-modal/report-problem-modal';
import { MatButton } from '@angular/material/button';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { VehicleFilter } from '../../../domain/model/vehicle-filter.model';
import { GetVehiclesUseCase } from '../../../application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from '../../../application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from '../../../application/use-cases/toggle-favorite.usecase';
import { FavoriteStore } from '../../../application/favorite.store';

@Component({
  selector: 'app-garage-layout',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatTabsModule,
    GarageFilter,
    VehicleCard,
    MatButton,
  ],
  templateUrl: './garage-layout.html',
  styleUrl: './garage-layout.css'
})
export class GarageLayout implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  isLoading = false;
  error: string | null = null;
  currentView: 'all' | 'favorites' = 'all';

  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activeBookingService = inject(ActiveBookingService);
  private favoriteStore = inject(FavoriteStore);

  constructor(
    private dialog: MatDialog,
    private getVehiclesUseCase: GetVehiclesUseCase,
    private filterVehiclesUseCase: FilterVehiclesUseCase,
    private toggleFavoriteUseCase: ToggleFavoriteUseCase,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    await this.loadVehicles();
  }

  async loadVehicles() {
    this.isLoading = true;
    this.error = null;
    try {
      this.vehicles = await this.getVehiclesUseCase.execute();
      this.filteredVehicles = this.vehicles;
      this.updateFavoriteStatus();
    } catch (error) {
      this.error = this.translate.instant('garage.error');
      console.error('Error loading vehicles:', error);
    } finally {
      this.isLoading = false;
    }
  }

  updateFavoriteStatus() {
    const favoriteIds = this.favoriteStore.favoriteVehicleIds();
    this.vehicles = this.vehicles.map(v => ({
      ...v,
      favorite: favoriteIds.includes(v.id)
    }));
    this.filteredVehicles = this.filteredVehicles.map(v => ({
      ...v,
      favorite: favoriteIds.includes(v.id)
    }));
  }

  async applyFilter(filter: VehicleFilter) {
    this.isLoading = true;
    try {
      // Apply showFavoritesOnly based on current view
      const enhancedFilter = {
        ...filter,
        showFavoritesOnly: this.currentView === 'favorites'
      };
      this.filteredVehicles = await this.filterVehiclesUseCase.execute(enhancedFilter);
      this.updateFavoriteStatus();
    } catch (error) {
      this.error = this.translate.instant('garage.filterError');
      console.error('Error applying filters:', error);
    } finally {
      this.isLoading = false;
    }
  }

  switchView(view: 'all' | 'favorites') {
    this.currentView = view;
    // Update favorite status first to ensure we have the latest from localStorage
    this.updateFavoriteStatus();
    // Then reapply current filters with new view
    this.applyFilter({});
  }

  get favoritesCount(): number {
    return this.favoriteStore.favoriteVehicleIds().length;
  }

  openVehicleDetails(vehicle: Vehicle) {
    this.dialog.open(VehicleDetailsModal, {
      data: vehicle,
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'vehicle-details-dialog',
      autoFocus: false,
      restoreFocus: false
    });
  }

  openQrScannerModal(vehicle?: Vehicle) {
    this.dialog.open(QrScannerModal, {
      data: vehicle,
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'qr-scanner-dialog',
      autoFocus: false
    });
  }

  openManualUnlockModal(vehicle: Vehicle) {
    this.dialog.open(ManualUnlockModal, {
      data: vehicle,
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'manual-unlock-dialog',
      autoFocus: false
    });
  }

  openReportProblemModal(vehicle: Vehicle) {
    this.dialog.open(ReportProblemModal, {
      data: vehicle,
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'report-problem-dialog',
      autoFocus: false
    });
  }

  navigateToScheduleUnlock(vehicle: Vehicle): void {
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking) {
      const snackBarRef = this.snackBar.open(
        'Ya tienes una reserva activa',
        'Ver Reserva',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/trip/details']);
      });
      return;
    }

    // Open confirmation modal
    const dialogRef = this.dialog.open(BookingConfirmationModal, {
      data: { vehicle },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'booking-confirmation-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const immediate = result.action === 'book_now';
        this.router.navigate(['/schedule-unlock'], {
          state: { vehicle, immediate }
        });
      }
    });
  }
}
