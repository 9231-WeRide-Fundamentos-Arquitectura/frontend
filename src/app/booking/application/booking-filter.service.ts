import { Injectable } from '@angular/core';
import { Booking } from '../domain/model/booking.entity';
import { BookingFilter, FilterOptions } from '../domain/model/booking-filter.model';

@Injectable({ providedIn: 'root' })
export class BookingFilterService {
  filterAndSortBookings(
    bookings: any[],
    filter: BookingFilter,
    filterOptions?: FilterOptions
  ): any[] {
    let filtered = [...bookings];

    if (filter.vehicleName) {
      const searchTerm = filter.vehicleName.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.vehicleName.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.status) {
      filtered = filtered.filter(booking => booking.status === filter.status);
    }

    if (filterOptions) {
      filtered = filtered.filter(booking => {
        switch (booking.status) {
          case 'draft': return filterOptions.showDrafts;
          case 'pending': return filterOptions.showPending;
          case 'active': return filterOptions.showActive;
          case 'completed': return filterOptions.showCompleted;
          case 'cancelled': return filterOptions.showCancelled;
          default: return true;
        }
      });
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(booking =>
        new Date(booking.startDate) >= filter.dateFrom!
      );
    }

    if (filter.dateTo) {
      filtered = filtered.filter(booking =>
        new Date(booking.startDate) <= filter.dateTo!
      );
    }

    return this.sortBookings(filtered, filter.sortBy, filter.sortOrder);
  }

  private sortBookings(bookings: any[], sortBy: string, sortOrder: string): any[] {
    const sorted = [...bookings].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'vehicle':
          comparison = a.vehicleName.localeCompare(b.vehicleName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  getDefaultFilter(): BookingFilter {
    return {
      sortBy: 'date',
      sortOrder: 'desc',
      vehicleName: '',
      status: ''
    };
  }

  getDefaultFilterOptions(): FilterOptions {
    return {
      showDrafts: true,
      showPending: true,
      showActive: true,
      showCompleted: true,
      showCancelled: false
    };
  }
}
