import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Payment {
  id: string;
  userId: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  cardLast4?: string;
  status: string;
  transactionId: string;
  processedAt: string;
  description: string;
  invoice?: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.payments}`;

  getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl);
  }

  getByUserId(userId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}?userId=${userId}`);
  }

  getById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }
}

