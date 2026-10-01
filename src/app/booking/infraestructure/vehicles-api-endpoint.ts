import { normalizeVehicleResponse } from './vehicle-assembler';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VehicleResponse, VehiclesListResponse } from './vehicle-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehiclesApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(this.baseUrl).pipe(map(response => response.map(normalizeVehicleResponse)));
  }

  create(vehicle: Omit<VehicleResponse, 'id'>): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.baseUrl, vehicle).pipe(map(response => normalizeVehicleResponse(response)));
  }

  getById(id: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.baseUrl}/${id}`).pipe(map(response => normalizeVehicleResponse(response)));
  }

  update(id: string, vehicle: Partial<VehicleResponse>): Observable<VehicleResponse> {
    return this.http.patch<VehicleResponse>(`${this.baseUrl}/${id}`, vehicle).pipe(map(response => normalizeVehicleResponse(response)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
