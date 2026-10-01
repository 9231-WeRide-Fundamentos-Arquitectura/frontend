import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { ActiveBookingService } from '../../../application/active-booking.service';
import { BookingConfirmationModal } from '../booking-confirmation-modal/booking-confirmation-modal';
import { UnlockMethodSelectionModal } from '../unlock-method-selection-modal/unlock-method-selection-modal';
import { BookingFilterService } from '../../../application/booking-filter.service';
import { BookingFilter } from '../../../domain/model/booking-filter.model';
import { forkJoin } from 'rxjs';

interface BookingView {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startLocationName: string;
  endLocationName: string;
  startDate: Date;
  duration: number | null;
  finalCost: number | null;
  status: 'draft' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-booking-list',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatDialogModule, RouterModule, TranslateModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.css'
})
export class BookingListComponent implements OnInit {
  private bookingsApi = inject(BookingsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private bookingStorage = inject(BookingStorageService);
  private bookingStore = inject(BookingStore);
  private activeBookingService = inject(ActiveBookingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private filterService = inject(BookingFilterService);

  bookings: BookingView[] = [];
  filteredBookings: BookingView[] = [];
  isLoading = true;
  isActivating = false;
  
  searchTerm = '';
  sortBy: 'date' | 'vehicle' | 'status' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  currentFilter: BookingFilter = this.filterService.getDefaultFilter();

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    
    // Load from localStorage first
    const localBookings = this.bookingStorage.getBookings();
    
    // Also try to load from API
    forkJoin({
      bookings: this.bookingsApi.getAll(),
      vehicles: this.vehiclesApi.getAll(),
      locations: this.locationsApi.getAll()
    }).subscribe({
      next: ({ bookings, vehicles, locations }) => {
        // Merge API bookings with local bookings
        const allBookings = [...localBookings, ...bookings];
        
        // Remove duplicates (prefer local version)
        const uniqueBookings = Array.from(
          new Map(allBookings.map(b => [b.id, b])).values()
        );
        
        this.bookings = uniqueBookings.map(booking => {
          const vehicle = vehicles.find(v => v.id === booking.vehicleId);
          const startLocation = locations.find(l => l.id === booking.startLocationId);
          const endLocation = locations.find(l => l.id === booking.endLocationId);

          return {
            id: booking.id,
            vehicleId: booking.vehicleId,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown Vehicle',
            startLocationName: startLocation?.name || 'Unknown',
            endLocationName: endLocation?.name || 'Unknown',
            startDate: new Date(booking.startDate),
            duration: booking.duration,
            finalCost: booking.finalCost,
            status: booking.status
          };
        });
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings from API:', error);
        // Fallback to localStorage only
        this.loadFromLocalStorageOnly();
      }
    });
  }

  private loadFromLocalStorageOnly(): void {
    const localBookings = this.bookingStorage.getBookings();
    this.bookings = localBookings.map(booking => ({
      id: booking.id,
      vehicleId: booking.vehicleId,
      vehicleName: 'Vehicle',
      startLocationName: 'Start Location',
      endLocationName: 'End Location',
      startDate: new Date(booking.startDate),
      duration: booking.duration,
      finalCost: booking.finalCost,
      status: booking.status
    }));
    this.applyFilters();
    this.isLoading = false;
  }

  applyFilters(): void {
    this.currentFilter = {
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      vehicleName: this.searchTerm,
      status: ''
    };
    
    this.filteredBookings = this.filterService.filterAndSortBookings(
      this.bookings,
      this.currentFilter
    );
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.applyFilters();
  }

  editBooking(id: string): void {
    // Navigate to booking form with the booking ID
    this.router.navigate(['/booking/form', id]);
  }

  cancelBooking(id: string): void {
    const booking = this.bookings.find(b => b.id === id);
    if (!booking || booking.status !== 'pending') {
      return;
    }

    // Show confirmation dialog
    const message = this.translate.instant('booking.confirmCancelMessage');
    const confirmText = this.translate.instant('common.confirm');
    
    if (confirm(message)) {
      // Update in localStorage
      const success = this.bookingStorage.cancelBooking(id);
      
      if (success) {
        // Update local view
        booking.status = 'cancelled';
        
        // Update in store
        this.bookingStore.loadFromLocalStorage();
        
        // Try to update in API as well (optional)
        this.bookingsApi.update(id, { status: 'cancelled' }).subscribe({
          next: () => {
            this.showSuccessMessage('booking.cancelSuccess');
          },
          error: (error) => {
            console.error('Error updating booking in API:', error);
            // Still show success since localStorage was updated
            this.showSuccessMessage('booking.cancelSuccess');
          }
        });
      } else {
        this.showErrorMessage('booking.cancelError');
      }
    }
  }

  deleteBooking(id: string): void {
    // Show confirmation dialog
    const message = this.translate.instant('booking.confirmDeleteMessage');
    const confirmText = this.translate.instant('common.confirm');
    
    if (confirm(message)) {
      // Delete from localStorage
      const success = this.bookingStorage.deleteBooking(id);
      
      if (success) {
        // Remove from local view
        this.bookings = this.bookings.filter(b => b.id !== id);
        
        // Update store
        this.bookingStore.deleteBooking(id);
        
        // Try to delete from API as well (optional)
        this.bookingsApi.delete(id).subscribe({
          next: () => {
            this.showSuccessMessage('booking.deleteSuccess');
          },
          error: (error) => {
            console.error('Error deleting booking from API:', error);
            // Still show success since localStorage was updated
            this.showSuccessMessage('booking.deleteSuccess');
          }
        });
      } else {
        this.showErrorMessage('booking.deleteError');
      }
    }
  }

  async activateBooking(bookingView: BookingView): Promise<void> {
    try {
      this.isActivating = true;

      // Validate booking can be activated
      if (bookingView.status !== 'pending' && bookingView.status !== 'confirmed') {
        this.showErrorMessage('booking.cannotActivate');
        return;
      }

      // Check if there's already an active booking
      const activeBooking = this.activeBookingService.getActiveBooking();
      if (activeBooking) {
        this.showErrorMessage('booking.alreadyHasActive');
        return;
      }

      // Get full booking from storage
      const booking = this.bookingStorage.getBookingById(bookingView.id);
      if (!booking) {
        this.showErrorMessage('booking.notFound');
        return;
      }

      // Get vehicle information
      this.vehiclesApi.getAll().subscribe({
        next: (vehicles) => {
          const vehicle = vehicles.find(v => v.id === bookingView.vehicleId);
          
          if (!vehicle) {
            this.showErrorMessage('booking.vehicleNotAvailable');
            this.isActivating = false;
            return;
          }

          // Open booking confirmation modal (¿Cómo deseas reservar?)
          const dialogRef = this.dialog.open(BookingConfirmationModal, {
            width: '500px',
            data: { vehicle },
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {
            this.isActivating = false;
            
            if (result === 'now') {
              // Activate booking immediately
              this.activateBookingNow(booking, vehicle);
            } else if (result === 'schedule') {
              // Navigate to schedule page
              this.router.navigate(['/booking/schedule-unlock'], {
                queryParams: { bookingId: booking.id }
              });
            }
          });
        },
        error: (error) => {
          console.error('Error loading vehicle:', error);
          this.showErrorMessage('booking.vehicleNotAvailable');
          this.isActivating = false;
        }
      });

    } catch (error) {
      console.error('Error activating booking:', error);
      this.showErrorMessage('booking.activateError');
      this.isActivating = false;
    }
  }

  private activateBookingNow(booking: any, vehicle: any): void {
    // Update booking status to active
    booking.status = 'active';
    booking.actualStartDate = new Date();
    
    this.bookingStorage.updateBooking(booking.id, booking);
    this.bookingStore.loadFromLocalStorage();
    this.activeBookingService.setActiveBooking(booking);

    // Update the view
    const bookingView = this.bookings.find(b => b.id === booking.id);
    if (bookingView) {
      bookingView.status = 'active';
    }

    // Open unlock method selection modal
    const dialogRef = this.dialog.open(UnlockMethodSelectionModal, {
      width: '500px',
      data: { booking, vehicle },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'manual') {
        // Navigate to manual unlock
        this.router.navigate(['/garage'], {
          queryParams: { 
            action: 'unlock-manual',
            vehicleId: vehicle.id,
            bookingId: booking.id 
          }
        });
      } else if (result === 'qr_code') {
        // Navigate to QR scanner
        this.router.navigate(['/garage'], {
          queryParams: { 
            action: 'unlock-qr',
            vehicleId: vehicle.id,
            bookingId: booking.id 
          }
        });
      }
    });

    this.showSuccessMessage('booking.activatedSuccessfully');
  }

  private showSuccessMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
