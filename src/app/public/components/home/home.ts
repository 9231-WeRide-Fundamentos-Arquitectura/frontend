import { Component, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActiveBookingService } from '../../../booking/application/active-booking.service';
import { HomeStore } from '../../application/home.store';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader';
import { ErrorStateComponent } from '../error-state/error-state';
import { ActiveBookingCardComponent } from '../active-booking-card/active-booking-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ActiveBookingCardComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activeBookingService = inject(ActiveBookingService);
  private homeStore = inject(HomeStore);

  readonly isLoading = this.homeStore.isLoading;
  readonly error = this.homeStore.error;
  readonly hasError = this.homeStore.hasError;
  readonly features = this.homeStore.features;

  readonly activeBooking = computed(() => this.activeBookingService.getActiveBooking());

  onRetry(): void {
    this.homeStore.retry();
  }

  navigateToTripDetails(): void {
    this.router.navigate(['/trip/details']);
  }

  navigateToGarage(): void {
    this.router.navigate(['/garage']);
  }

  onScheduleUnlock(): void {
    const activeBooking = this.activeBookingService.getActiveBooking();

    if (activeBooking) {
      this.router.navigate(['/trip/details']);
    } else {
      this.snackBar.open(
        'Reserva un vehículo primero',
        'Cerrar',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        }
      );
      
      setTimeout(() => {
        this.router.navigate(['/garage']);
      }, 500);
    }
  }
}
