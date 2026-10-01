import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface ActiveBookingData {
  minutes: number;
}

@Component({
  selector: 'app-active-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './active-booking-modal.html',
  styleUrl: './active-booking-modal.css'
})
export class ActiveBookingModal {
  constructor(
    public dialogRef: MatDialogRef<ActiveBookingModal>,
    @Inject(MAT_DIALOG_DATA) public data: ActiveBookingData,
    private translate: TranslateService
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onUnderstand(): void {
    this.dialogRef.close({ understood: true });
  }

  getMessage(): string {
    const message = this.translate.instant('booking.activeBooking.message', { minutes: this.data.minutes });
    return message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}

