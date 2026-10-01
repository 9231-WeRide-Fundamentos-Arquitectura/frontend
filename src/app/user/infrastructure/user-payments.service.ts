import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaymentsApiEndpoint, Payment } from './payments-api-endpoint';

@Injectable({
  providedIn: 'root'
})
export class UserPaymentsService {
  private paymentsApi = inject(PaymentsApiEndpoint);

  getUserPayments(userId: string): Observable<Payment[]> {
    return this.paymentsApi.getByUserId(userId);
  }

  getTotalSpent(userId: string): Observable<number> {
    return this.paymentsApi.getSummary(userId).pipe(map(summary => summary.totalSpent));
  }

  getRecentPayments(userId: string, limit: number = 5): Observable<Payment[]> {
    return this.paymentsApi.getByUserId(userId, 0, limit).pipe(
      map(payments => 
        payments
          .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
          .slice(0, limit)
      )
    );
  }
}

