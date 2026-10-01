import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../application/user.store';
import { UserPaymentsService } from '../../../infrastructure/user-payments.service';
import { Payment } from '../../../infrastructure/payments-api-endpoint';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-wallet-card',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-wallet-card.html',
  styleUrl: './user-wallet-card.css'
})
export class UserWalletCard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly paymentsService = inject(UserPaymentsService);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.userStore.getGuestUser$();
  payments$: Observable<Payment[]> = new Observable();
  totalSpent$: Observable<number> = new Observable();

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user?.id) {
        const userId = user.id.toString();
        this.payments$ = this.paymentsService.getRecentPayments(userId, 10);
        this.totalSpent$ = this.paymentsService.getTotalSpent(userId);
      } else {
        this.payments$ = new Observable(observer => observer.next([]));
        this.totalSpent$ = new Observable(observer => observer.next(0));
      }
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

