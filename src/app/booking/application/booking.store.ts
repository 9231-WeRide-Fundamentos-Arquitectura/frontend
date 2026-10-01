import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Booking, BookingActivationStatus } from '../domain/model/booking.entity';
import { BookingStorageService } from './booking-storage.service';
import { BookingsApiEndpoint } from '../infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../infraestructure/booking-assembler';

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private storageService = inject(BookingStorageService);
  private bookingsApi = inject(BookingsApiEndpoint);
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private selectedBookingSubject = new BehaviorSubject<Booking | null>(null);
  private activeBookingSubject = new BehaviorSubject<Booking | null>(null);

  constructor() {
    this.loadFromLocalStorage();
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

  async activateBooking(bookingId: string): Promise<void> {
    const bookingResponse = await firstValueFrom(
      this.bookingsApi.getById(bookingId)
    );

    const activatedBooking = toDomainBooking(bookingResponse);
    activatedBooking.activationStatus = 'active';
    activatedBooking.isActivated = true;
    activatedBooking.activatedAt = new Date();
    activatedBooking.status = 'active';

    await firstValueFrom(
      this.bookingsApi.update(bookingId, {
        ...bookingResponse,
        status: 'active',
        actualStartDate: new Date().toISOString()
      })
    );

    this.activeBookingSubject.next(activatedBooking);
    this.updateBooking(activatedBooking);
  }

  async unlockVehicleByQR(qrCode: string): Promise<{
    success: boolean;
    vehicleId?: string;
    bookingId?: string;
    location?: any;
    error?: string;
  }> {
    try {
      const booking = this.activeBookingSubject.getValue();
      if (!booking) {
        return { success: false, error: 'No hay reserva activa' };
      }

      await this.activateBooking(booking.id);

      return {
        success: true,
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        location: { lat: -12.046374, lng: -77.042793 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async unlockVehicleManually(
    vehiclePhone: string,
    unlockCode: string
  ): Promise<{
    success: boolean;
    vehicleId?: string;
    bookingId?: string;
    location?: any;
    error?: string;
  }> {
    try {
      const booking = this.activeBookingSubject.getValue();
      if (!booking) {
        return { success: false, error: 'No hay reserva activa' };
      }

      await this.activateBooking(booking.id);

      return {
        success: true,
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        location: { lat: -12.046374, lng: -77.042793 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async getBookingByIdAsync(bookingId: string): Promise<Booking> {
    const response = await firstValueFrom(this.bookingsApi.getById(bookingId));
    return toDomainBooking(response);
  }
}

