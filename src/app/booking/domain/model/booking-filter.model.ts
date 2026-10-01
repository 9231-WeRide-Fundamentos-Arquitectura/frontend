export type BookingSortBy = 'date' | 'vehicle' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface BookingFilter {
  sortBy: BookingSortBy;
  sortOrder: SortOrder;
  vehicleName?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FilterOptions {
  showDrafts: boolean;
  showPending: boolean;
  showActive: boolean;
  showCompleted: boolean;
  showCancelled: boolean;
}
