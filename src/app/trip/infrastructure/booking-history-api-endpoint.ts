import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { BackendBookingResponse, BookingResponse } from '../../booking/infraestructure/bookings-response';
import { normalizeBookingResponse } from '../../booking/infraestructure/booking-assembler';
import { VehiclesApiEndpoint } from './vehicles-api-endpoint';
import { LocationsApiEndpoint } from './locations-api-endpoint';
import { Vehicle } from '../domain/model/vehicle.entity';
import { Location } from '../domain/model/location.entity';
import { RouteCoordinate } from '../domain/model/trip.entity';
import { environment } from '../../../environments/environment';

type HistoryResponse = BackendBookingResponse & { routeCoordinates?: RouteCoordinate[] };
export interface CompletedTrip extends BookingResponse {
  routeCoordinates: RouteCoordinate[];
  route: string;
  vehicleName: string;
  image: string;
  startedAt: string | null;
  endedAt: string | null;
}
export interface BookingHistoryPage<T = CompletedTrip> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class BookingHistoryApiEndpoint {
  private http = inject(HttpClient);
  private vehicles = inject(VehiclesApiEndpoint);
  private locations = inject(LocationsApiEndpoint);
  private url = `${environment.apiUrl}${environment.endpoints.bookings}/history`;

  getPage(page = 0, size = 10) {
    return forkJoin({
      page: this.http.get<BookingHistoryPage<HistoryResponse>>(this.url, { params: { page, size } }),
      vehicles: this.vehicles.getAll(), locations: this.locations.getAll()
    }).pipe(map(({ page, vehicles, locations }) => ({
      ...page, content: page.content.map(booking => this.toTrip(booking, vehicles, locations))
    })));
  }

  getById(id: string) {
    return forkJoin({
      booking: this.http.get<HistoryResponse>(`${this.url}/${encodeURIComponent(id)}`),
      vehicles: this.vehicles.getAll(), locations: this.locations.getAll()
    }).pipe(map(({ booking, vehicles, locations }) => this.toTrip(booking, vehicles, locations)));
  }

  private toTrip(raw: HistoryResponse, vehicles: Vehicle[], locations: Location[]): CompletedTrip {
    const booking = normalizeBookingResponse(raw);
    const vehicle = vehicles.find(vehicle => vehicle.id === booking.vehicleId);
    const station = (id: string) => locations.find(location => location.id === id)?.name || (id ? `#${id}` : '—');
    return {
      ...booking,
      routeCoordinates: raw.routeCoordinates ?? [],
      route: `${station(booking.startLocationId)} → ${station(booking.endLocationId)}`,
      vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : `#${booking.vehicleId}`,
      image: vehicle?.image || '',
      startedAt: raw.actualStartDate ?? raw.startDate ?? null,
      endedAt: raw.actualEndDate ?? raw.endDate ?? null
    };
  }
}
