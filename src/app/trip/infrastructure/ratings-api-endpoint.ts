import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TripRating {
  bookingId: string;
  rating: number;
  comment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RatingsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  // Contrato propuesto (aún no existe en el backend): POST /api/v1/bookings/{bookingId}/rating
  create(data: TripRating): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${data.bookingId}/rating`, {
      score: data.rating,
      comment: data.comment
    });
  }
}
