import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VehicleApiResponse {
  id: string;
  brand: string;
  model: string;
  year: number;
  battery: number;
  maxSpeed: number;
  range: number;
  weight: number;
  color: string;
  licensePlate: string;
  location: string;
  status: string;
  type: string;
  companyId: string;
  pricePerMinute: number;
  image: string;
  features: string[];
  maintenanceStatus: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKilometers: number;
  rating: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleApiService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.vehicles}`;

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<VehicleApiResponse[]> {
    return this.http.get<VehicleApiResponse[]>(this.apiUrl);
  }

  async getVehiclesAsync(): Promise<VehicleApiResponse[]> {
    return firstValueFrom(this.http.get<VehicleApiResponse[]>(this.apiUrl));
  }

  getVehicleById(id: string): Observable<VehicleApiResponse> {
    return this.http.get<VehicleApiResponse>(`${this.apiUrl}/${id}`);
  }

  async getVehicleByIdAsync(id: string): Promise<VehicleApiResponse> {
    return firstValueFrom(this.http.get<VehicleApiResponse>(`${this.apiUrl}/${id}`));
  }
}

