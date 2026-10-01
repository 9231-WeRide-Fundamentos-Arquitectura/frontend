import { normalizeVehicleResponse } from '../../booking/infraestructure/vehicle-assembler';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Vehicle } from '../domain/model/vehicle.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  getAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.baseUrl).pipe(map(response => response.map(normalizeVehicleResponse)));
  }

  getById(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/${id}`).pipe(map(response => normalizeVehicleResponse(response)));
  }
}

