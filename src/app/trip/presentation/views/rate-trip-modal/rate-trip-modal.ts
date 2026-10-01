import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RatingsApiEndpoint } from '../../../infrastructure/ratings-api-endpoint';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-rate-trip-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './rate-trip-modal.html',
  styleUrl: './rate-trip-modal.css'
})
export class RateTripModal {
  rating = 0;
  comment = '';
  tags: string[] = [];
  readonly availableTags = ['clean', 'brakes_ok', 'comfortable', 'good_condition'];
  saving = false;
  error = '';
  private api = inject(RatingsApiEndpoint);
  private router = inject(Router);
  private translate = inject(TranslateService);

  constructor(
    public dialogRef: MatDialogRef<RateTripModal>,
    @Inject(MAT_DIALOG_DATA) public trip: { bookingId: string }
  ) {}

  onClose(): void {
    this.dialogRef.close();
    this.router.navigate(['/home']);
  }

  setRating(value: number): void {
    this.rating = value;
  }

  onSubmit(): void {
    if (this.saving || this.rating < 1 || this.rating > 5 || !this.trip.bookingId) return;
    this.saving = true;
    this.error = '';
    this.api.create({ bookingId: this.trip.bookingId, rating: this.rating, comment: this.comment, tags: this.tags }).subscribe({
      next: () => this.onClose(),
      error: () => {
        this.saving = false;
        this.error = this.translate.instant('trip.rateTrip.error');
      }
    });
  }

  toggleTag(tag: string): void {
    this.tags = this.tags.includes(tag) ? this.tags.filter(t => t !== tag) : [...this.tags, tag];
  }

  getStars(): number[] {
    return [1, 2, 3, 4, 5];
  }
}

