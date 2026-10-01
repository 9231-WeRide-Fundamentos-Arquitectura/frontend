import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TripRating {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RatingsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  create(data: TripRating): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${data.bookingId}/rating`, {
      score: data.rating,
      comment: data.comment,
      tags: data.tags ?? []
    });
  }
}
