import { Injectable, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Booking } from '../domain/model/booking.entity';
import { BookingStorageService } from './booking-storage.service';
import { BookingsApiEndpoint } from '../infraestructure/bookings-api-endpoint';
import { UnlockRequestsApiEndpoint } from '../infraestructure/unlockRequests-api-endpoint';
import { ActiveBookingService } from './active-booking.service';
import { toDomainBooking } from '../infraestructure/booking-assembler';

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private storageService = inject(BookingStorageService);
  private bookingsApi = inject(BookingsApiEndpoint);
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private activeBookingService = inject(ActiveBookingService);
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private selectedBookingSubject = new BehaviorSubject<Booking | null>(null);
  private activeBookingSubject = new BehaviorSubject<Booking | null>(null);

  constructor() {
    this.loadFromLocalStorage();
    const auth = inject(AuthService);
    effect(() => {
      auth.session();
      this.loadFromLocalStorage();
      this.activeBookingSubject.next(null);
      this.selectedBookingSubject.next(null);
    });
  }

  getBookings(): Observable<Booking[]> {
    return this.bookingsSubject.asObservable();
  }

  addBooking(booking: Booking): void {
    const current = this.bookingsSubject.getValue();
    this.bookingsSubject.next([...current, booking]);
    // Persist to localStorage
    this.storageService.saveBooking(booking);
  }

  updateBooking(updated: Booking): void {
    const current = this.bookingsSubject.getValue();
    const updatedList = current.map(b => b.id === updated.id ? updated : b);
    this.bookingsSubject.next(updatedList);
    // Persist to localStorage
    this.storageService.updateBooking(updated.id, updated);
  }

  deleteBooking(id: string): void {
    const current = this.bookingsSubject.getValue();
    const filteredList = current.filter(b => b.id !== id);
    this.bookingsSubject.next(filteredList);
    // Remove from localStorage
    this.storageService.deleteBooking(id);
  }

  selectBooking(id: string): void {
    const current = this.bookingsSubject.getValue();
    const found = current.find(b => b.id === id) || null;
    this.selectedBookingSubject.next(found);
  }

  getSelectedBooking(): Observable<Booking | null> {
    return this.selectedBookingSubject.asObservable();
  }

  clearSelectedBooking(): void {
    this.selectedBookingSubject.next(null);
  }

  /**
   * Load bookings from localStorage into the store
   */
  loadFromLocalStorage(): void {
    const bookings = this.storageService.getBookings();
    this.bookingsSubject.next(bookings);
  }

  /**
   * Sync all current bookings to localStorage
   */
  syncToLocalStorage(): void {
    const current = this.bookingsSubject.getValue();
    this.storageService.clearAllBookings();
    current.forEach(booking => this.storageService.saveBooking(booking));
  }

  getBookingById(id: string): Booking | null {
    const current = this.bookingsSubject.getValue();
    return current.find(b => b.id === id) || null;
  }

  getActiveBooking$(): Observable<Booking | null> {
    return this.activeBookingSubject.asObservable();
  }

  setActiveBooking(booking: Booking | null): void {
    this.activeBookingSubject.next(booking);
  }

  async unlockVehicleByQR(qrCode: string, booking?: Booking, requestId?: string) {
    return this.unlockVehicle('qr_code', qrCode, booking, requestId);
  }

  async unlockVehicleManually(_vehiclePhone: string, unlockCode: string, booking?: Booking, requestId?: string) {
    return this.unlockVehicle('manual', unlockCode, booking, requestId);
  }

  private async unlockVehicle(method: 'manual' | 'qr_code', unlockCode: string, selected?: Booking, requestId?: string) {
    try {
      const booking = selected || this.activeBookingSubject.getValue() || this.activeBookingService.getActiveBooking();
      if (!booking) return { success: false, error: 'No hay reserva activa' };
      if (!requestId) {
        const previous = await firstValueFrom(this.unlockRequestsApi.getByBookingId(booking.id));
        requestId = previous[0]?.id;
      }
      if (!requestId) {
        const request = await firstValueFrom(this.unlockRequestsApi.create({
          userId: booking.userId, vehicleId: booking.vehicleId, bookingId: booking.id,
          requestedAt: new Date().toISOString(), scheduledUnlockTime: (booking.startDate || new Date()).toISOString(),
          actualUnlockTime: null, status: 'pending', method, location: { lat: 0, lng: 0 },
          unlockCode: '', attempts: 0, errorMessage: null
        }));
        requestId = request.id;
      }
      this.activeBookingService.setActiveBooking(booking);
      const request = await firstValueFrom(this.unlockRequestsApi.update(requestId, { method, unlockCode }));
      if (request.status !== 'unlocked') return { success: false, error: request.errorMessage || 'Código incorrecto' };
      // El servidor valida el código e inicia la reserva en la misma transacción.
      const updated = await this.getBookingByIdAsync(booking.id);
      this.setActiveBooking(updated);
      this.updateBooking(updated);
      this.activeBookingService.setActiveBooking(updated);
      return { success: true, vehicleId: updated.vehicleId, bookingId: updated.id };
    } catch (error: any) {
      return { success: false, error: error?.error?.message || error?.error?.detail || error?.message || 'Error al desbloquear' };
    }
  }

  async getBookingByIdAsync(bookingId: string): Promise<Booking> {
    const response = await firstValueFrom(this.bookingsApi.getById(bookingId));
    return toDomainBooking(response);
  }
}

