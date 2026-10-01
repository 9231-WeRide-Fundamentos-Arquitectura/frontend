import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserPaymentsService } from './user-payments.service';
import { environment } from '../../../environments/environment';

describe('Wallet paid bookings', () => {
  it('uses the server total across all pages and limits recent payments separately', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(UserPaymentsService);
    const http = TestBed.inject(HttpTestingController);
    let total = 0;
    let recentCount = -1;
    service.getTotalSpent('42').subscribe(value => total = value);
    service.getRecentPayments('42', 10).subscribe(value => recentCount = value.length);
    const base = `${environment.apiUrl}${environment.endpoints.payments}`;
    const summary = http.expectOne(`${base}/summary?userId=42`);
    summary.flush({ totalSpent: 1250, currency: 'USD' });
    const payments = http.expectOne(`${base}?userId=42&page=0&limit=10`);
    payments.flush([]);
    expect(total).toBe(1250);
    expect(recentCount).toBe(0);
    http.verify();
  });
});
