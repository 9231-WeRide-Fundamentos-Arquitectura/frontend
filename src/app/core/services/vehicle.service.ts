import { Injectable } from '@angular/core';
import { ApiService, Vehicle } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  public vehicles$ = this.vehiclesSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadVehicles(): Observable<Vehicle[]> {
    return this.apiService.getVehicles().pipe(
      tap(vehicles => {
        this.vehiclesSubject.next(vehicles);
      })
    );
  }

  loadAvailableVehicles(): Observable<Vehicle[]> {
    return this.apiService.getAvailableVehicles().pipe(
      tap(vehicles => {
      })
    );
  }

  getCachedVehicles(): Vehicle[] {
    return this.vehiclesSubject.value;
  }

  getAvailableVehicles(): Vehicle[] {
    return this.vehiclesSubject.value.filter(v => v.status === 'available');
  }

  getVehiclesByCompany(companyId: string): Vehicle[] {
    return this.vehiclesSubject.value.filter(v => v.companyId === companyId);
  }

  findVehicleById(id: string): Vehicle | undefined {
    return this.vehiclesSubject.value.find(vehicle => vehicle.id === id);
  }
}
