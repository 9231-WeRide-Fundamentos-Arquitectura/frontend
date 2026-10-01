import { toDomainTrip } from './trip-assembler';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Trip } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.trips}`;

  getAll(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.baseUrl).pipe(map(response => response.map(toDomainTrip)));
  }

  getById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${id}`).pipe(map(response => toDomainTrip(response)));
  }

  getByUserId(userId: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}?userId=${userId}`).pipe(map(response => response.map(toDomainTrip)));
  }

  create(trip: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, trip).pipe(map(response => toDomainTrip(response)));
  }

  update(id: string, trip: Partial<Trip>): Observable<Trip> {
    return this.http.patch<Trip>(`${this.baseUrl}/${id}`, trip).pipe(map(response => toDomainTrip(response)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

