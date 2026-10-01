import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.entity';

import { ProblemReportsApiEndpoint } from '../../../infrastructure/problem-reports-api-endpoint';
import { TripStore } from '../../../application/trip.store';
import { BookingStore } from '../../../../booking/application/booking.store';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';

export interface ProblemCategory {
  key: string;
  label: string;
}

@Component({
  selector: 'app-report-problem-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './report-problem-modal.html',
  styleUrl: './report-problem-modal.css'
})
export class ReportProblemModal {
  selectedCategories: string[] = [];
  description = '';
  photo: string | undefined;
  photoLoading = false;
  saving = false;
  submitted: { chargeWaived?: boolean } | null = null;
  error = '';
  private tripStore = inject(TripStore);
  private bookingStore = inject(BookingStore);
  private api = inject(ProblemReportsApiEndpoint);
  private activeBooking = inject(ActiveBookingService);
  private translate = inject(TranslateService);


  categories: ProblemCategory[] = [
    { key: 'mechanical', label: 'trip.reportProblem.categories.mechanical' },
    { key: 'tires', label: 'trip.reportProblem.categories.tires' },
    { key: 'gps', label: 'trip.reportProblem.categories.gps' },
    { key: 'battery', label: 'trip.reportProblem.categories.battery' },
    { key: 'lock', label: 'trip.reportProblem.categories.lock' },
    { key: 'brakes', label: 'trip.reportProblem.categories.brakes' },
    { key: 'damage', label: 'trip.reportProblem.categories.damage' },
    { key: 'other', label: 'trip.reportProblem.categories.other' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReportProblemModal>,
    @Inject(MAT_DIALOG_DATA) public vehicle: Vehicle
  ) {}

  onClose(): void {
    if (!this.saving) this.dialogRef.close(this.submitted);
  }

  toggleCategory(categoryKey: string): void {
    const index = this.selectedCategories.indexOf(categoryKey);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryKey);
    }
  }

  isCategorySelected(categoryKey: string): boolean {
    return this.selectedCategories.includes(categoryKey);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photo = undefined;
    this.error = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      this.error = this.translate.instant('trip.reportProblem.photoError');
      input.value = '';
      return;
    }
    this.photoLoading = true;
    const reader = new FileReader();
    reader.onload = () => { this.photo = reader.result as string; this.photoLoading = false; };
    reader.onerror = () => { this.error = this.translate.instant('trip.reportProblem.photoError'); this.photoLoading = false; };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    const booking = this.activeBooking.getActiveBooking();
    this.saving = true;
    this.error = '';
    this.dialogRef.disableClose = true;
    this.api.create({
      vehicleId: String(this.vehicle.id),
      bookingId: booking?.vehicleId === String(this.vehicle.id) ? booking.id : undefined,
      categories: this.selectedCategories,
      description: this.description.trim(),
      photo: this.photo
    }).subscribe({
      next: report => {
        this.submitted = report;
        if (report.chargeWaived) {
          this.activeBooking.clearActiveBooking();
          this.bookingStore.setActiveBooking(null);
          this.tripStore.endTrip();
          this.tripStore.setCurrentTrip(null);
        }
        this.tripStore.setVehicles(this.tripStore.vehicles().map(vehicle => String(vehicle.id) === String(this.vehicle.id)
          ? { ...vehicle, status: 'maintenance' } : vehicle));
        this.saving = false;
        this.dialogRef.disableClose = false;
      },
      error: () => {
        this.error = this.translate.instant('trip.reportProblem.error');
        this.saving = false;
        this.dialogRef.disableClose = false;
      }
    });
  }

  canSubmit(): boolean {
    return this.selectedCategories.length > 0 && this.description.length <= 2000 && !this.saving && !this.photoLoading && !this.submitted;
  }
}
