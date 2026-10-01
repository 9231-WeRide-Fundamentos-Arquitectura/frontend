import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Booking } from '../domain/model/booking.entity';
import { BookingsApiEndpoint } from '../infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../infraestructure/booking-assembler';
import { firstValueFrom } from 'rxjs';

const ACTIVE_BOOKING_KEY = 'active_booking';

@Injectable({
  providedIn: 'root'
})
export class ActiveBookingService {
  private bookingsApi = inject(BookingsApiEndpoint);
  private auth = inject(AuthService);
  readonly booking = signal<Booking | null>(null);

  constructor() {
    this.booking.set(this.getActiveBooking());
    effect(() => {
      if (this.booking()?.userId !== this.auth.session()?.id) this.clearActiveBooking();
    });
  }

  /**
   * Check if user has an active booking from API and store in localStorage
   */
  async checkAndStoreActiveBooking(userId: string): Promise<Booking | null> {
    try {
      const bookings = await firstValueFrom(this.bookingsApi.getByUserId(userId));
      
      // Filter for active bookings (pending or confirmed status)
      const activeBookings = bookings
        .filter(b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'active')
        .map(b => toDomainBooking(b))
        .sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || b.reservedAt.getTime() - a.reservedAt.getTime());

      if (activeBookings.length > 0) {
        const mostRecent = activeBookings[0];
        this.setActiveBooking(mostRecent);
        return mostRecent;
      }

      this.clearActiveBooking();
      return null;
    } catch (error) {
      console.error('Error checking active booking:', error);
      throw error;
    }
  }

  /**
   * Get active booking from localStorage
   */
  getActiveBooking(): Booking | null {
    const stored = localStorage.getItem(ACTIVE_BOOKING_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      if (String(data.userId) !== this.auth.session()?.id) return null;
      return new Booking(
        data.id,
        data.userId,
        data.vehicleId,
        data.startLocationId,
        data.endLocationId,
        new Date(data.reservedAt),
        new Date(data.startDate),
        data.endDate ? new Date(data.endDate) : null,
        data.actualStartDate ? new Date(data.actualStartDate) : null,
        data.actualEndDate ? new Date(data.actualEndDate) : null,
        data.status,
        data.totalCost,
        data.discount,
        data.finalCost,
        data.paymentMethod,
        data.paymentStatus,
        data.distance,
        data.duration,
        data.averageSpeed,
        data.rating,
        data.issues
      );
    } catch (error) {
      console.error('Error parsing active booking:', error);
      this.clearActiveBooking();
      return null;
    }
  }

  /**
   * Set active booking in localStorage
   */
  setActiveBooking(booking: Booking): void {
    localStorage.setItem(ACTIVE_BOOKING_KEY, JSON.stringify(booking));
    this.booking.set(booking);
  }

  /**
   * Clear active booking from localStorage
   */
  clearActiveBooking(): void {
    localStorage.removeItem(ACTIVE_BOOKING_KEY);
    this.booking.set(null);
  }

  /**
   * Check if there's an active booking
   */
  hasActiveBooking(): boolean {
    return this.getActiveBooking() !== null;
  }

  /**
   * Update active booking status
   */
  updateActiveBooking(updates: Partial<Booking>): void {
    const current = this.getActiveBooking();
    if (current) {
      const updated = { ...current, ...updates };
      this.setActiveBooking(updated);
    }
  }
}
