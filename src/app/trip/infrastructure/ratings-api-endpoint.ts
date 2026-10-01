import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TripRating {
  id?: string;
  tripId: string;
  userId?: string;
  rating: number;
  comment?: string;
  ratingDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RatingsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.ratings}`;

  getAll(): Observable<TripRating[]> {
    return this.http.get<TripRating[]>(this.baseUrl);
  }

  getById(id: string): Observable<TripRating> {
    return this.http.get<TripRating>(`${this.baseUrl}/${id}`);
  }

  getByTripId(tripId: string): Observable<TripRating[]> {
    return this.http.get<TripRating[]>(`${this.baseUrl}?tripId=${tripId}`);
  }

  create(data: Partial<TripRating>): Observable<TripRating> {
    return this.http.post<TripRating>(this.baseUrl, {
      ...data,
      ratingDate: new Date().toISOString()
    });
  }

  update(id: string, data: Partial<TripRating>): Observable<TripRating> {
    return this.http.patch<TripRating>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
