export interface VehicleFilter {
  type?: 'electric_scooter' | 'bike' | 'electric_bike';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  // 'unavailable' agrupa reserved, in_use y cualquier otro estado distinto de available y maintenance.
  status?: 'available' | 'reserved' | 'maintenance' | 'in_use' | 'unavailable';
  brand?: string;
  companyId?: string;
  minBattery?: number;
  color?: string;
  showFavoritesOnly?: boolean;
}
