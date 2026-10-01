import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BookingResponse, BackendBookingResponse } from './bookings-response';
import { normalizeBookingResponse } from './booking-assembler';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  constructor(private http: HttpClient) {}

  // Obtener todas las reservas
  getAll(): Observable<BookingResponse[]> {
    return this.http.get<BackendBookingResponse[]>(this.baseUrl).pipe(map(bookings => bookings.map(normalizeBookingResponse)));
  }

  // Crear una nueva reserva
  create(booking: Pick<BookingResponse, 'userId' | 'vehicleId' | 'startLocationId' | 'endLocationId'> & Partial<Pick<BookingResponse, 'startDate' | 'endDate' | 'totalCost'>>): Observable<BookingResponse> {
    const { userId, vehicleId, startLocationId, endLocationId, startDate, endDate, totalCost } = booking;
    return this.http.post<BackendBookingResponse>(this.baseUrl, { userId, vehicleId, startLocationId, endLocationId, startDate, endDate, totalCost }).pipe(map(normalizeBookingResponse));
  }

  // Disponibilidad del vehículo frente a las reservas de todos los usuarios
  availability(vehicleId: string, start: Date, end: Date): Observable<{ available: boolean; busySlots: { startDate: string; endDate: string }[] }> {
    return this.http.get<{ available: boolean; busySlots: { startDate: string; endDate: string }[] }>(
      `${this.baseUrl}/availability`, { params: { vehicleId, start: start.toISOString(), end: end.toISOString() } });
  }

  // Obtener una reserva por ID
  getById(id: string): Observable<BookingResponse> {
    return this.getAll().pipe(map(bookings => {
      const booking = bookings.find(b => b.id === id);
      if (!booking) throw new Error(`Reserva ${id} no encontrada`);
      return booking;
    }));
  }

  // Actualizar una reserva
  cancel(id: string): Observable<BookingResponse> {
    return this.http.patch<BackendBookingResponse>(`${this.baseUrl}/${id}`, null).pipe(map(normalizeBookingResponse));
  }

  start(id: string): Observable<BookingResponse> {
    return this.http.put<BackendBookingResponse>(`${this.baseUrl}/${id}/start`, null).pipe(map(normalizeBookingResponse));
  }

  complete(id: string, metrics: Pick<BookingResponse, 'totalCost' | 'discount' | 'distance' | 'duration' | 'averageSpeed' | 'rating'>): Observable<BookingResponse> {
    return this.http.post<BackendBookingResponse>(`${this.baseUrl}/${id}/complete`, metrics).pipe(map(normalizeBookingResponse));
  }

  // Eliminar una reserva
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Obtener reservas por userId
  getByUserId(userId: string): Observable<BookingResponse[]> {
    return this.getAll();
  }

  // Obtener reservas por vehicleId
  getByVehicleId(vehicleId: string): Observable<BookingResponse[]> {
    return this.http.get<BackendBookingResponse[]>(this.baseUrl, { params: { vehicleId } }).pipe(map(bookings => bookings.map(normalizeBookingResponse)));
  }
}
