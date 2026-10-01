import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { Booking } from '../../../domain/model/booking.entity';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, TranslateModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingStorage = inject(BookingStorageService);
  private bookingStore = inject(BookingStore);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  // Edit mode properties
  isEditMode = false;
  editingBookingId: string | null = null;

  vehicles = [
    { id: '1', brand: 'Lime', model: 'S-300 Electric Scooter', location: 'Downtown Station A', rate: 0.15, type: 'E-Scooter', battery: '85%', range: '25 km' },
    { id: '2', brand: 'Bird', model: 'One Electric Scooter', location: 'Mall Parking B', rate: 0.20, type: 'E-Scooter', battery: '92%', range: '30 km' },
    { id: '3', brand: 'Spin', model: 'Scoot Pro', location: 'Airport Zone C', rate: 0.18, type: 'E-Scooter', battery: '78%', range: '22 km' },
    { id: '4', brand: 'Jump', model: 'E-Bike City', location: 'University Campus', rate: 0.25, type: 'E-Bike', battery: '88%', range: '45 km' },
    { id: '5', brand: 'Lime', model: 'E-Bike Gen 4', location: 'Central Park', rate: 0.22, type: 'E-Bike', battery: '95%', range: '50 km' },
    { id: '6', brand: 'Veo', model: 'Cosmo E-Scooter', location: 'Business District', rate: 0.16, type: 'E-Scooter', battery: '82%', range: '28 km' },
    { id: '7', brand: 'Tier', model: 'Electric Scooter', location: 'Shopping Center', rate: 0.19, type: 'E-Scooter', battery: '90%', range: '32 km' },
    { id: '8', brand: 'Dott', model: 'E-Scooter Pro', location: 'Train Station', rate: 0.17, type: 'E-Scooter', battery: '86%', range: '26 km' }
  ];
  selectedVehicle: string = '';
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
  rate: number = 0;
  showSummary: boolean = false;
  smsReminder: boolean = false;
  emailConfirmation: boolean = false;
  pushNotification: boolean = false;

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const bookingId = params.get('id');
      if (bookingId) {
        this.isEditMode = true;
        this.editingBookingId = bookingId;
        this.loadBookingForEdit(bookingId);
      }
    });
  }

  /**
   * Load booking data for editing
   */
  private loadBookingForEdit(bookingId: string): void {
    const booking = this.bookingStorage.getBookingById(bookingId);
    
    if (booking) {
      // Populate form fields with booking data
      this.selectedVehicle = booking.vehicleId;
      this.selectedDate = this.formatDateForInput(booking.startDate);
      this.unlockTime = this.formatTimeForInput(booking.startDate);
      this.duration = booking.duration || 1;
      
      // Find vehicle to get rate
      const vehicle = this.vehicles.find(v => v.id === booking.vehicleId);
      this.rate = vehicle ? vehicle.rate : 0;
    } else {
      // Booking not found, show error and navigate back
      this.showErrorMessage('booking.notFound');
      this.router.navigate(['/booking/list']);
    }
  }

  /**
   * Format date for HTML date input (YYYY-MM-DD)
   */
  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Format time for HTML time input (HH:MM)
   */
  private formatTimeForInput(date: Date): string {
    const d = new Date(date);
    return d.toTimeString().slice(0, 5);
  }

  getVehicleName(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? `${v.brand} ${v.model}` : '';
  }

  getVehicleType(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? v.type : '';
  }

  getVehicleBattery(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? v.battery : '';
  }

  getVehicleRange(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? v.range : '';
  }

  submitBooking() {
    const vehicle = this.vehicles.find(v => v.id === this.selectedVehicle);
    this.rate = vehicle ? vehicle.rate : 0;
    
    if (this.isEditMode && this.editingBookingId) {
      // Update existing booking
      this.updateBooking();
    } else {
      // Create new booking
      this.createNewBooking();
    }
  }

  /**
   * Create a new booking and save to localStorage
   */
  private createNewBooking(): void {
    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const finalCost = this.calculateCost();
    
    const newBooking = new Booking(
      this.generateBookingId(),
      'current-user-id', // Replace with actual user ID
      this.selectedVehicle,
      'start-location-id', // Replace with actual location
      'end-location-id', // Replace with actual location
      new Date(),
      startDateTime,
      null,
      null,
      null,
      'pending',
      finalCost,
      0,
      finalCost,
      'card',
      'pending',
      null,
      this.duration,
      null,
      null,
      []
    );

    // Save to localStorage and store
    this.bookingStorage.saveBooking(newBooking);
    this.bookingStore.addBooking(newBooking);
    
    this.showSuccessMessage('booking.createSuccess');
    this.showSummary = true;
    
    // Navigate to list after a delay
    setTimeout(() => {
      this.router.navigate(['/booking/list']);
    }, 2000);
  }

  /**
   * Update existing booking
   */
  private updateBooking(): void {
    if (!this.editingBookingId) return;

    const startDateTime = this.combineDateTime(this.selectedDate, this.unlockTime);
    const finalCost = this.calculateCost();
    
    const updatedData: Partial<Booking> = {
      vehicleId: this.selectedVehicle,
      startDate: startDateTime,
      duration: this.duration,
      finalCost: finalCost,
      totalCost: finalCost
    };

    const success = this.bookingStorage.updateBooking(this.editingBookingId, updatedData);
    
    if (success) {
      // Update store
      this.bookingStore.loadFromLocalStorage();
      
      this.showSuccessMessage('booking.updateSuccess');
      this.showSummary = true;
      
      // Navigate to list after a delay
      setTimeout(() => {
        this.router.navigate(['/booking/list']);
      }, 2000);
    } else {
      this.showErrorMessage('booking.updateError');
    }
  }

  /**
   * Combine date and time strings into a Date object
   */
  private combineDateTime(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}`);
  }

  /**
   * Calculate booking cost
   */
  private calculateCost(): number {
    return this.rate * this.duration;
  }

  /**
   * Generate unique booking ID
   */
  private generateBookingId(): string {
    return `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  saveDraft() {
    this.showSummary = true;
    // Here you could save the draft locally or to the backend
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
