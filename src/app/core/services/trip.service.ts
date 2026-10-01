import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Trip } from '../../trip/domain/model/trip.entity';
import { Vehicle } from '../../trip/domain/model/vehicle.entity';
import { Location } from '../../trip/domain/model/location.entity';

export interface TripWithDetails extends Trip {
  vehicle?: Vehicle;
  startLocation?: Location;
  endLocation?: Location;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private tripsSubject = new BehaviorSubject<Trip[]>([]);
  private currentTripSubject = new BehaviorSubject<TripWithDetails | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  trips$ = this.tripsSubject.asObservable();
  currentTrip$ = this.currentTripSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadTrips(): Observable<Trip[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.apiService.getTrips().pipe(
      map((trips: Trip[]) => {
        this.tripsSubject.next(trips);
        this.loadingSubject.next(false);
        return trips;
      })
    );
  }

  loadTripWithDetails(trip: Trip): Observable<TripWithDetails> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const requests = {
      vehicles: this.apiService.getVehicles(),
      locations: this.apiService.getLocations()
    };

    return forkJoin(requests).pipe(
      map(({ vehicles, locations }) => {
        const vehicle = vehicles.find(v => v.id === trip.vehicleId);
        const startLocation = locations.find(l => l.id === trip.startLocationId);
        const endLocation = locations.find(l => l.id === trip.endLocationId);

        const tripWithDetails: TripWithDetails = {
          ...trip,
          vehicle,
          startLocation,
          endLocation
        };

        this.currentTripSubject.next(tripWithDetails);
        this.loadingSubject.next(false);
        return tripWithDetails;
      })
    );
  }

  loadLatestTrip(): Observable<TripWithDetails | null> {
    this.loadingSubject.next(true);
    
    return this.apiService.getTrips().pipe(
      switchMap((trips: Trip[]) => {
        if (trips.length === 0) {
          this.loadingSubject.next(false);
          return new Observable<TripWithDetails | null>(observer => {
            observer.next(null);
            observer.complete();
          });
        }

        // Get the latest completed trip or the first one
        const latestTrip = trips
          .filter(trip => trip.status === 'completed')
          .sort((a, b) => new Date(b.endDate || b.startDate).getTime() - new Date(a.endDate || a.startDate).getTime())[0]
          || trips[0];

        return this.loadTripWithDetails(latestTrip);
      })
    );
  }

  getTripsByUserId(userId: string): Observable<Trip[]> {
    this.loadingSubject.next(true);
    
    return this.apiService.getTrips().pipe(
      map((trips: Trip[]) => {
        const userTrips = trips.filter(trip => trip.userId === userId);
        this.tripsSubject.next(userTrips);
        this.loadingSubject.next(false);
        return userTrips;
      })
    );
  }

  getCurrentTrip(): TripWithDetails | null {
    return this.currentTripSubject.value;
  }

  setError(error: string) {
    this.errorSubject.next(error);
  }

  clearError() {
    this.errorSubject.next(null);
  }
}