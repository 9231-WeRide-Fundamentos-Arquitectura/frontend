import { Injectable } from '@angular/core';
import { Booking } from '../domain/model/booking.entity';

const STORAGE_KEY = 'weride_bookings';

@Injectable({
  providedIn: 'root'
})
export class BookingStorageService {
  
  /**
   * Save a new booking to localStorage
   */
  saveBooking(booking: Booking): void {
    try {
      const bookings = this.getBookings();
      bookings.push(booking);
      this.saveToStorage(bookings);
    } catch (error) {
      console.error('Error saving booking to localStorage:', error);
      throw new Error('Failed to save booking. Storage might be full.');
    }
  }

  /**
   * Get all bookings from localStorage
   */
  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      return parsed.map((b: any) => this.deserializeBooking(b));
    } catch (error) {
      console.error('Error reading bookings from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a specific booking by ID
   */
  getBookingById(id: string): Booking | null {
    const bookings = this.getBookings();
    return bookings.find(b => b.id === id) || null;
  }

  /**
   * Update an existing booking
   */
  updateBooking(id: string, updatedData: Partial<Booking>): boolean {
    try {
      const bookings = this.getBookings();
      const index = bookings.findIndex(b => b.id === id);
      
      if (index === -1) {
        console.error('Booking not found:', id);
        return false;
      }

      // Merge existing booking with updated data
      bookings[index] = { ...bookings[index], ...updatedData };
      this.saveToStorage(bookings);
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      return false;
    }
  }

  /**
   * Delete a booking permanently
   */
  deleteBooking(id: string): boolean {
    try {
      const bookings = this.getBookings();
      const filtered = bookings.filter(b => b.id !== id);
      
      if (filtered.length === bookings.length) {
        console.error('Booking not found:', id);
        return false;
      }

      this.saveToStorage(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  /**
   * Cancel a booking (change status to cancelled)
   */
  cancelBooking(id: string): boolean {
    return this.updateBooking(id, { status: 'cancelled' });
  }

  /**
   * Clear all bookings from localStorage
   */
  clearAllBookings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing bookings:', error);
    }
  }

  /**
   * Check if localStorage is available and has space
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Private helper to save bookings array to localStorage
   */
  private saveToStorage(bookings: Booking[]): void {
    const serialized = bookings.map(b => this.serializeBooking(b));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  }

  /**
   * Serialize booking to plain object for storage
   */
  private serializeBooking(booking: Booking): any {
    return {
      ...booking,
      reservedAt: booking.reservedAt?.toISOString(),
      startDate: booking.startDate?.toISOString(),
      endDate: booking.endDate?.toISOString(),
      actualStartDate: booking.actualStartDate?.toISOString(),
      actualEndDate: booking.actualEndDate?.toISOString()
    };
  }

  /**
   * Deserialize booking from storage to Booking entity
   */
  private deserializeBooking(data: any): Booking {
    return new Booking(
      data.id,
      data.userId,
      data.vehicleId,
      data.startLocationId,
      data.endLocationId,
      data.reservedAt ? new Date(data.reservedAt) : new Date(),
      data.startDate ? new Date(data.startDate) : new Date(),
      data.endDate ? new Date(data.endDate) : null,
      data.actualStartDate ? new Date(data.actualStartDate) : null,
      data.actualEndDate ? new Date(data.actualEndDate) : null,
      data.status || 'pending',
      data.totalCost,
      data.discount,
      data.finalCost,
      data.paymentMethod || '',
      data.paymentStatus || 'pending',
      data.distance,
      data.duration,
      data.averageSpeed,
      data.rating,
      data.issues || []
    );
  }
}
