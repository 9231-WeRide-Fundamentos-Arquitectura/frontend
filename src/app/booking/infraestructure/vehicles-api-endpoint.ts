import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehicleResponse, VehiclesListResponse } from './vehicle-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiclesApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(this.baseUrl);
  }

  create(vehicle: Omit<VehicleResponse, 'id'>): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.baseUrl, vehicle);
  }

  getById(id: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.baseUrl}/${id}`);
  }

  update(id: string, vehicle: Partial<VehicleResponse>): Observable<VehicleResponse> {
    return this.http.patch<VehicleResponse>(`${this.baseUrl}/${id}`, vehicle);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
