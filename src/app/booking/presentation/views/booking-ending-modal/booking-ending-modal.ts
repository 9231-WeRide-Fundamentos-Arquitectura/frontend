import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface BookingEndingData {
  minutes: number;
  extendCost: number;
}

@Component({
  selector: 'app-booking-ending-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './booking-ending-modal.html',
  styleUrl: './booking-ending-modal.css'
})
export class BookingEndingModal {
  constructor(
    public dialogRef: MatDialogRef<BookingEndingModal>,
    @Inject(MAT_DIALOG_DATA) public data: BookingEndingData,
    private translate: TranslateService
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  extendTime(): void {
    this.dialogRef.close({ action: 'extend' });
  }

  endReservation(): void {
    this.dialogRef.close({ action: 'end' });
  }

  getMessage(): string {
    const message = this.translate.instant('booking.bookingEnding.message', { minutes: this.data.minutes });
    return message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  getExtendButtonText(): string {
    return this.translate.instant('booking.bookingEnding.extendTime', { cost: this.data.extendCost });
  }
}

