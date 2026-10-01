export interface VehicleFilter {
  type?: 'electric_scooter' | 'bike' | 'electric_bike';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  status?: 'available' | 'reserved' | 'maintenance' | 'in_use';
  brand?: string;
  companyId?: string;
  minBattery?: number;
  color?: string;
  showFavoritesOnly?: boolean;
}
