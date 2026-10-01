import { Injectable } from '@angular/core';
import { ApiService, Location } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private locationsSubject = new BehaviorSubject<Location[]>([]);
  public locations$ = this.locationsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadLocations(): Observable<Location[]> {
    return this.apiService.getLocations().pipe(
      tap(locations => {
        this.locationsSubject.next(locations);
      })
    );
  }

  getCachedLocations(): Location[] {
    return this.locationsSubject.value;
  }

  getActiveLocations(): Location[] {
    return this.locationsSubject.value.filter(l => l.isActive);
  }

  getLocationsByDistrict(district: string): Location[] {
    return this.locationsSubject.value.filter(l => l.district === district);
  }

  findLocationById(id: string): Location | undefined {
    return this.locationsSubject.value.find(location => location.id === id);
  }
}
