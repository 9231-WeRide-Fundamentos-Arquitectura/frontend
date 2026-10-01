import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Trip } from '../../../domain/model/trip.entity';

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

  constructor(
    public dialogRef: MatDialogRef<RateTripModal>,
    @Inject(MAT_DIALOG_DATA) public trip: Trip
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  setRating(value: number): void {
    this.rating = value;
  }

  onSubmit(): void {
    this.dialogRef.close({
      rating: this.rating,
      comment: this.comment,
      tripId: this.trip.id
    });
  }

  getStars(): number[] {
    return [1, 2, 3, 4, 5];
  }
}

